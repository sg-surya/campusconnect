"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    collection, addDoc, onSnapshot, query, where,
    limit, getDocs, updateDoc, doc, deleteDoc,
    serverTimestamp, orderBy, setDoc, increment
} from "firebase/firestore";

const servers = {
    iceServers: [{ urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }],
    iceCandidatePoolSize: 10,
};

export default function VideoMatchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "GLOBAL";
    const { user, profile } = useAuth();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSearching, setIsSearching] = useState(true);
    const [chatTime, setChatTime] = useState(0);
    const [partner, setPartner] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [safetyBlur, setSafetyBlur] = useState(true);

    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const chatEndRef = useRef(null);
    const queueDocRef = useRef(null);
    const partnerDocIdRef = useRef(null);
    const streamRef = useRef(null);
    const pc = useRef(null);

    const Icons = {
        Camera: ({ size = 20, color = "currentColor" }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
        ),
        Mic: ({ size = 20, color = "currentColor" }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
        ),
        Shield: ({ size = 20, color = "currentColor" }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        ),
        GraduationCap: ({ size = 20, color = "currentColor" }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>
        )
    };

    useEffect(() => {
        async function getCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) { console.error(err); }
        }
        getCamera();
        return () => cleanupQueue();
    }, []);

    const cleanupQueue = async () => {
        if (queueDocRef.current) {
            try {
                const docRef = doc(db, "matchQueue", queueDocRef.current);
                await updateDoc(docRef, { status: "disconnected" });
                setTimeout(() => deleteDoc(docRef).catch(() => { }), 2000);
            } catch (e) { }
            queueDocRef.current = null;
        }
        if (partnerDocIdRef.current) {
            try { await updateDoc(doc(db, "matchQueue", partnerDocIdRef.current), { status: "disconnected" }); } catch (e) { }
            partnerDocIdRef.current = null;
        }
        if (pc.current) {
            pc.current.getSenders().forEach(s => s.track && s.track.stop());
            pc.current.close();
            pc.current = null;
        }
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const calculateMatchScore = (me, target) => {
        let score = 0;
        if (me.college === target.college) score += 40;
        const overlap = (me.interests || []).filter(i => (target.interests || []).includes(i)).length;
        score += overlap * 15;
        const karmaDiff = Math.abs((me.karma || 100) - (target.karma || 100));
        if (karmaDiff < 50) score += 20;
        return score;
    };

    useEffect(() => {
        if (!user || !isSearching) return;
        let myUnsub = null, searchInterval = null;

        const findMatch = async () => {
            const myEntry = {
                userId: user.uid,
                name: profile?.name || "Student",
                college: profile?.college || "Unknown",
                interests: profile?.interests || [],
                gender: profile?.gender || "Other",
                karma: profile?.karma || 100,
                mode, status: "searching", createdAt: serverTimestamp()
            };
            const qRef = await addDoc(collection(db, "matchQueue"), myEntry);
            queueDocRef.current = qRef.id;

            myUnsub = onSnapshot(doc(db, "matchQueue", qRef.id), (snap) => {
                const data = snap.data();
                if (data?.status === "disconnected" && !isSearching) handleNext();
                if (data?.status === "matched" && data.matchedWith && isSearching) {
                    partnerDocIdRef.current = data.partnerDocId;
                    startWebRTC(data.matchedWith, data.matchedWithData, false, data.callId);
                }
            });

            const search = async () => {
                if (!isSearching) return;
                let q = query(collection(db, "matchQueue"), where("status", "==", "searching"), orderBy("createdAt", "asc"), limit(20));
                if (mode !== "RANDOM") q = query(q, where("mode", "==", mode));

                const snap = await getDocs(q);
                const others = snap.docs.filter(d => d.id !== qRef.id && d.data().userId !== user.uid);

                if (others.length > 0) {
                    const best = others.map(c => ({ doc: c, score: calculateMatchScore(myEntry, c.data()) })).sort((a, b) => b.score - a.score)[0].doc;
                    const bestData = best.data();
                    const callId = [qRef.id, best.id].sort().join("_");
                    try {
                        await updateDoc(doc(db, "matchQueue", best.id), { status: "matched", matchedWith: user.uid, matchedWithData: myEntry, partnerDocId: qRef.id, callId });
                        await updateDoc(doc(db, "matchQueue", qRef.id), { status: "matched", matchedWith: bestData.userId, matchedWithData: bestData, partnerDocId: best.id, callId });
                        partnerDocIdRef.current = best.id;
                        startWebRTC(bestData.userId, bestData, true, callId);
                    } catch (e) { }
                }
            };
            searchInterval = setInterval(search, 3500);
        };

        const startWebRTC = async (pId, pData, isCaller, callId) => {
            if (!isSearching) return;
            setIsSearching(false);
            setPartner(pData);
            setSafetyBlur(true);
            setTimeout(() => setSafetyBlur(false), 3000);
            setMessages([{ id: "sys", text: `Connected with ${pData.name}. Secure peer channel established.`, sender: "system" }]);

            const peer = new RTCPeerConnection(servers);
            pc.current = peer;
            if (streamRef.current) streamRef.current.getTracks().forEach(t => peer.addTrack(t, streamRef.current));

            peer.ontrack = (e) => {
                if (remoteVideoRef.current && e.streams[0]) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                    remoteVideoRef.current.play().catch(() => { });
                }
            };

            const callDoc = doc(db, "calls", callId);
            peer.onicecandidate = (e) => {
                if (e.candidate && peer.localDescription) {
                    addDoc(collection(callDoc, isCaller ? "callerCandidates" : "calleeCandidates"), e.candidate.toJSON()).catch(() => { });
                }
            };

            if (isCaller) {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                await setDoc(callDoc, { offer: { sdp: offer.sdp, type: offer.type } });
                onSnapshot(callDoc, (s) => {
                    const d = s.data();
                    if (d?.answer && peer.signalingState === "have-local-offer") {
                        peer.setRemoteDescription(new RTCSessionDescription(d.answer));
                    }
                });
                onSnapshot(collection(callDoc, "calleeCandidates"), (s) => s.docChanges().forEach(c => {
                    if (c.type === "added") peer.addIceCandidate(new RTCIceCandidate(c.doc.data())).catch(() => { });
                }));
            } else {
                let processed = false;
                onSnapshot(callDoc, async (s) => {
                    const d = s.data();
                    if (d?.offer && !processed) {
                        processed = true;
                        await peer.setRemoteDescription(new RTCSessionDescription(d.offer));
                        const ans = await peer.createAnswer();
                        await peer.setLocalDescription(ans);
                        await updateDoc(callDoc, { answer: { sdp: ans.sdp, type: ans.type } });
                    }
                });
                onSnapshot(collection(callDoc, "callerCandidates"), (s) => s.docChanges().forEach(c => {
                    if (c.type === "added") peer.addIceCandidate(new RTCIceCandidate(c.doc.data())).catch(() => { });
                }));
            }
        };

        findMatch();
        return () => { if (myUnsub) myUnsub(); if (searchInterval) clearInterval(searchInterval); };
    }, [user, isSearching]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages(p => [...p, { id: Date.now(), text: input.trim(), sender: "me" }]);
        setInput("");
    };

    const giveKarma = async () => {
        if (!partner?.userId) return;
        try {
            await updateDoc(doc(db, "users", partner.userId), { karma: increment(5) });
            setMessages(p => [...p, { id: Date.now(), text: `You gave 5 Karma to ${partner.name}!`, sender: "system" }]);
        } catch (e) { }
    };

    const handleNext = () => { cleanupQueue(); setIsSearching(true); setPartner(null); setMessages([]); setChatTime(0); setSafetyBlur(true); };
    const handleStop = () => { cleanupQueue(); router.push("/dashboard"); };
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "100vh", width: "100vw", background: "#050505", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
            <main style={{ display: "flex", flexDirection: "column", height: "100vh", position: "relative" }}>
                {partner && (
                    <div style={{ position: "absolute", top: "30px", left: "30px", zIndex: 10, display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.6)", padding: "10px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", textTransform: "uppercase" }}>{partner.name[0]}</div>
                        <div style={{ textAlign: "left" }}>
                            <div style={{ color: "white", fontWeight: 800, fontSize: "14px" }}>{partner.name}</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase" }}>{partner.college}</div>
                        </div>
                    </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, gap: "1px", background: "#1a1a1a" }}>
                    <div style={{ position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {isSearching && <div style={{ textAlign: "center", opacity: 0.5 }}><div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "3px", color: "#8b5cf6" }}>LOOKING_FOR_MATCH...</div></div>}
                        {!isSearching && safetyBlur && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(40px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
                                <div style={{ textAlign: "center" }}><Icons.Shield size={32} color="#8b5cf6" /><div style={{ fontSize: "11px", color: "#8b5cf6", letterSpacing: "2px", fontWeight: 800, marginTop: "10px" }}>AI_SAFETY_SCANNING</div></div>
                            </div>
                        )}
                    </div>
                    <div style={{ position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", filter: isCameraOff ? "brightness(0)" : "none" }} />
                        <div style={{ position: "absolute", bottom: "30px", right: "30px", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>YOU (LIVE)</div>
                    </div>
                </div>
                <div style={{ height: "120px", background: "#080808", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", padding: "0 50px", gap: "25px" }}>
                    <button onClick={handleNext} style={{ background: "#fff", color: "#000", border: "none", fontWeight: 900, padding: "18px 50px", fontSize: "15px", textTransform: "uppercase", cursor: "pointer" }}>SKIP / NEXT →</button>
                    {!isSearching && partner && (
                        <button onClick={giveKarma} style={{ background: "rgba(250, 204, 21, 0.1)", color: "#facc15", border: "1px solid #facc15", padding: "18px 24px", fontSize: "13px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase" }}>★ UPVOTE</button>
                    )}
                    <button onClick={handleStop} style={{ background: "transparent", color: "#ff4757", border: "1px solid #333", padding: "18px 30px", fontSize: "13px", textTransform: "uppercase", cursor: "pointer" }}>Close</button>
                    <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
                        <button onClick={() => setIsMuted(!isMuted)} style={{ background: isMuted ? "#ff4757" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "10px", cursor: "pointer" }}><Icons.Mic size={18} /></button>
                        <button onClick={() => setIsCameraOff(!isCameraOff)} style={{ background: isCameraOff ? "#ff4757" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "10px", cursor: "pointer" }}><Icons.Camera size={18} /></button>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#444", letterSpacing: "2px" }}>SESSION DURATION</div>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "24px", fontWeight: 800, color: "#fff" }}>{formatTime(chatTime)}</div>
                    </div>
                </div>
            </main>
            <aside style={{ borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", background: "#080808" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "11px", color: "#666", fontWeight: 800, letterSpacing: "2px" }}>MESSAGES</span></div>
                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{ alignSelf: m.sender === "me" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                            {m.sender === "system" ? <div style={{ fontSize: "10px", color: "#8b5cf6", textAlign: "center", fontStyle: "italic", background: "rgba(139,92,246,0.1)", padding: "10px", borderRadius: "4px" }}>{m.text}</div> : <div style={{ background: m.sender === "me" ? "#fff" : "#1a1a1c", color: m.sender === "me" ? "#000" : "#fff", padding: "12px 18px", borderRadius: "16px", fontSize: "14px" }}>{m.text}</div>}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendMessage} style={{ padding: "24px", background: "#050505", borderTop: "1px solid #1a1a1a" }}><input type="text" placeholder="Send a message..." value={input} onChange={(e) => setInput(e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid #222", color: "white", padding: "14px 20px", borderRadius: "12px", outline: "none" }} /></form>
            </aside>
        </div>
    );
}
