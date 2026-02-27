"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
    collection, addDoc, onSnapshot, query, where,
    limit, getDocs, updateDoc, doc, deleteDoc,
    serverTimestamp, orderBy, setDoc, increment
} from "firebase/firestore";

const servers = {
    iceServers: [{ urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }]
};

export default function VideoMatchView({ user, profile, mode, onEnd }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSearching, setIsSearching] = useState(true);
    const [chatTime, setChatTime] = useState(0);
    const [partner, setPartner] = useState(null);
    const [currentCallId, setCurrentCallId] = useState(null);
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
    const isConnecting = useRef(false);
    const currentCallIdRef = useRef(null);

    const Icons = {
        Camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
        Mic: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>,
        Shield: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
        Star: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
    };

    const calculateCompatibility = (me, target, searchAge) => {
        let score = 0;
        const myInterests = me.interests || [];
        const targetInterests = target.interests || [];
        const overlap = myInterests.filter(i => targetInterests.includes(i)).length;

        if (me.mode === "FOUNDER") {
            const isTech = myInterests.some(i => ["tech", "coding", "dev"].includes(i.toLowerCase()));
            const isBiz = targetInterests.some(i => ["marketing", "business", "design"].includes(i.toLowerCase()));
            if (isTech && isBiz) score += 40;
            else score += (overlap * 10);
        } else if (me.mode === "ACADEMIC") {
            if (me.branch === target.branch) score += 40;
            else score += (overlap * 5);
        } else {
            score += (overlap * 15);
        }

        const karmaDiff = Math.abs((me.karma || 100) - (target.karma || 100));
        score += Math.max(0, 20 - (karmaDiff / 10));
        const waitTime = (Date.now() - (target.createdAt?.toMillis() || Date.now())) / 1000;
        score += Math.min(20, waitTime * 2);
        if (searchAge > 15) score += 10;
        return Math.min(100, score);
    };

    const handleNext = () => {
        cleanupQueue();
        setIsSearching(true);
        setPartner(null);
        setCurrentCallId(null);
        setMessages([]);
        setChatTime(0);
        setSafetyBlur(true);
    };

    const cleanupQueue = async () => {
        isConnecting.current = false;
        if (partnerDocIdRef.current) {
            try { await updateDoc(doc(db, "matchQueue", partnerDocIdRef.current), { status: "disconnected" }).catch(() => { }); } catch (e) { }
            partnerDocIdRef.current = null;
        }
        if (queueDocRef.current) {
            try { await deleteDoc(doc(db, "matchQueue", queueDocRef.current)).catch(() => { }); } catch (e) { }
            queueDocRef.current = null;
        }
        if (pc.current) { pc.current.close(); pc.current = null; }
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (currentCallIdRef.current) {
            try { await deleteDoc(doc(db, "calls", currentCallIdRef.current)); } catch (e) { }
            currentCallIdRef.current = null;
        }
        setCurrentCallId(null);
    };

    useEffect(() => {
        async function getCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) { }
        }
        getCamera();
        return () => {
            cleanupQueue();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    useEffect(() => {
        if (!streamRef.current) return;
        streamRef.current.getVideoTracks().forEach(track => { track.enabled = !isCameraOff; });
    }, [isCameraOff]);

    useEffect(() => {
        if (!streamRef.current) return;
        streamRef.current.getAudioTracks().forEach(track => { track.enabled = !isMuted; });
    }, [isMuted]);

    const startWebRTC = async (pId, pData, isCaller, callId) => {
        setCurrentCallId(callId);
        currentCallIdRef.current = callId;
        setIsSearching(false);
        setPartner(pData);
        setSafetyBlur(true);
        setTimeout(() => setSafetyBlur(false), 3000);
        setMessages([{ id: "sys", text: `Connected with ${pData.name}. Peer channel ready.`, sender: "system" }]);

        const peer = new RTCPeerConnection(servers);
        pc.current = peer;
        if (streamRef.current) streamRef.current.getTracks().forEach(t => peer.addTrack(t, streamRef.current));

        peer.ontrack = (e) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        };

        const callDoc = doc(db, "calls", callId);
        peer.onicecandidate = (e) => {
            if (e.candidate) addDoc(collection(callDoc, isCaller ? "callerCandidates" : "calleeCandidates"), e.candidate.toJSON()).catch(() => { });
        };

        if (isCaller) {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            await setDoc(callDoc, { offer: { sdp: offer.sdp, type: offer.type } });
            onSnapshot(callDoc, async (s) => {
                const d = s.data();
                if (d?.answer && peer.signalingState === "have-local-offer") {
                    await peer.setRemoteDescription(new RTCSessionDescription(d.answer));
                }
            });
            onSnapshot(collection(callDoc, "calleeCandidates"), (s) => {
                s.docChanges().forEach(async (c) => {
                    if (c.type === "added") await peer.addIceCandidate(new RTCIceCandidate(c.doc.data())).catch(() => { });
                });
            });
        } else {
            let sdpSet = false;
            onSnapshot(callDoc, async (s) => {
                const d = s.data();
                if (d?.offer && !sdpSet) {
                    sdpSet = true;
                    await peer.setRemoteDescription(new RTCSessionDescription(d.offer));
                    const ans = await peer.createAnswer();
                    await peer.setLocalDescription(ans);
                    await updateDoc(callDoc, { answer: { sdp: ans.sdp, type: ans.type } });
                }
            });
            onSnapshot(collection(callDoc, "callerCandidates"), (s) => {
                s.docChanges().forEach(async (c) => {
                    if (c.type === "added") await peer.addIceCandidate(new RTCIceCandidate(c.doc.data())).catch(() => { });
                });
            });
        }
    };

    useEffect(() => {
        if (!user || !isSearching) return;
        let myUnsub = null;
        let searchInterval = null;
        const startTime = Date.now();

        const startMatchSearch = async () => {
            try {
                const staleQ = query(collection(db, "matchQueue"), where("userId", "==", user.uid));
                const staleSnap = await getDocs(staleQ);
                for (const d of staleSnap.docs) { await deleteDoc(doc(db, "matchQueue", d.id)).catch(() => { }); }
            } catch (e) { }

            const myEntry = {
                userId: user.uid,
                name: profile?.name || "Student",
                college: profile?.college || "Verified College",
                branch: profile?.branch || "Unknown",
                interests: profile?.interests || [],
                karma: profile?.karma || 100,
                mode,
                status: "searching",
                createdAt: serverTimestamp()
            };

            const qRef = await addDoc(collection(db, "matchQueue"), myEntry);
            queueDocRef.current = qRef.id;

            myUnsub = onSnapshot(doc(db, "matchQueue", qRef.id), (snap) => {
                const data = snap.data();
                if (!snap.exists() || (data && data.status === "disconnected")) {
                    handleNext();
                    return;
                }
                if (data && data.status === "matched" && data.matchedWith && isSearching && !isConnecting.current) {
                    isConnecting.current = true;
                    partnerDocIdRef.current = data.partnerDocId;
                    setTimeout(() => {
                        startWebRTC(data.matchedWith, data.matchedWithData, false, data.callId);
                    }, 1000);
                }
            });

            const searchForPeers = async () => {
                if (!isSearching || isConnecting.current) return;
                const searchAge = (Date.now() - startTime) / 1000;
                const q = query(collection(db, "matchQueue"), where("status", "==", "searching"), limit(20));
                const snap = await getDocs(q);
                const others = snap.docs.filter(d => d.id !== qRef.id && d.data().userId !== user.uid);

                if (others.length > 0) {
                    const scoredPeers = others.map(doc => ({
                        id: doc.id,
                        data: doc.data(),
                        score: calculateCompatibility(myEntry, doc.data(), searchAge)
                    })).sort((a, b) => b.score - a.score);

                    const bestMatch = scoredPeers[0];
                    const threshold = searchAge < 10 ? 60 : (searchAge < 20 ? 40 : 10);

                    if (bestMatch.score >= threshold && user.uid < bestMatch.data.userId) {
                        const callId = [qRef.id, bestMatch.id].sort().join("_");
                        try {
                            isConnecting.current = true;
                            await updateDoc(doc(db, "matchQueue", bestMatch.id), {
                                status: "matched",
                                matchedWith: user.uid,
                                matchedWithData: myEntry,
                                partnerDocId: qRef.id,
                                callId
                            });
                            await updateDoc(doc(db, "matchQueue", qRef.id), {
                                status: "matched",
                                matchedWith: bestMatch.data.userId,
                                matchedWithData: bestMatch.data,
                                partnerDocId: bestMatch.id,
                                callId
                            });
                            partnerDocIdRef.current = bestMatch.id;
                            startWebRTC(bestMatch.data.userId, bestMatch.data, true, callId);
                        } catch (e) { isConnecting.current = false; }
                    }
                }
            };
            searchInterval = setInterval(searchForPeers, 2500);
        };
        startMatchSearch();
        return () => {
            if (myUnsub) myUnsub();
            if (searchInterval) clearInterval(searchInterval);
        };
    }, [user, isSearching]);

    useEffect(() => {
        if (!currentCallId || !user) return;
        const msgQ = query(collection(db, "calls", currentCallId, "messages"), orderBy("createdAt", "asc"));
        const msgUnsub = onSnapshot(msgQ, (snap) => {
            const msgs = snap.docs.map(d => ({
                id: d.id, ...d.data(),
                timestamp: d.data().createdAt?.toMillis() || Date.now(),
                sender: d.data().senderId === user.uid ? "me" : "partner"
            })).sort((a, b) => a.timestamp - b.timestamp);
            setMessages(prev => [...prev.filter(m => m.sender === "system"), ...msgs]);
        });

        const matchUnsub = onSnapshot(doc(db, "matchQueue", queueDocRef.current), (snap) => {
            if (snap.exists() && snap.data().status === "disconnected") {
                handleNext();
            }
        });

        return () => {
            msgUnsub();
            matchUnsub();
        };
    }, [currentCallId, user]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !currentCallId) return;
        const txt = input.trim();
        setInput("");
        await addDoc(collection(db, "calls", currentCallId, "messages"), { text: txt, senderId: user.uid, createdAt: serverTimestamp() }).catch(() => { });
    };

    useEffect(() => {
        const t = setInterval(() => { if (!isSearching) setChatTime(v => v + 1); }, 1000);
        return () => clearInterval(t);
    }, [isSearching]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "100%", width: "100%", background: "#050505", position: "relative", overflow: "hidden" }}>
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, opacity: 0.03,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            <div className="video-area" style={{ display: "flex", flexDirection: "column", position: "relative", background: "#000" }}>
                {partner && (
                    <div style={{
                        position: "absolute", top: "30px", left: "30px", zIndex: 100,
                        display: "flex", alignItems: "center", gap: "15px",
                        background: "rgba(10,10,10,0.8)", padding: "12px 20px",
                        borderRadius: "2px", border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(20px)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                    }}>
                        <div style={{ width: "40px", height: "40px", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px" }}>
                            {partner.name[0]}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong style={{ fontSize: "14px", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>{partner.name}</strong>
                            <span style={{ fontSize: "10px", color: "#8b5cf6", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{partner.college?.toUpperCase()}</span>
                        </div>
                    </div>
                )}

                <div className="video-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, gap: "1px", background: "#1a1a1a" }}>
                    <div style={{ position: "relative", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                        {isSearching && (
                            <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
                                <div style={{ width: "50px", height: "1px", background: "#8b5cf6", animation: "pulse 1.5s infinite" }} />
                                <span style={{ color: "#8b5cf6", letterSpacing: "5px", fontWeight: 800, fontSize: "10px", fontFamily: "'JetBrains Mono', monospace" }}>FINDING PEER...</span>
                            </div>
                        )}
                        {!isSearching && safetyBlur && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,5,0.95)", backdropFilter: "blur(60px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#8b5cf6", gap: "15px", zIndex: 50 }}>
                                <Icons.Shield />
                                <span style={{ fontSize: "10px", letterSpacing: "3px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>SAFETY SCAN IN PROGRESS...</span>
                            </div>
                        )}
                    </div>

                    <div style={{ position: "relative", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", filter: isCameraOff ? "brightness(0)" : "none" }} />
                        <div style={{ position: "absolute", bottom: "20px", right: "20px", background: "rgba(0,0,0,0.5)", padding: "5px 10px", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#666", border: "1px solid rgba(255,255,255,0.1)" }}>
                            LIVE_SIGNAL
                        </div>
                    </div>
                </div>

                <div className="controls" style={{ height: "100px", background: "#0a0a0b", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", padding: "0 40px", gap: "20px", zIndex: 100 }}>
                    <button onClick={handleNext} style={{
                        background: "#fff", color: "#000", border: "none", fontWeight: 900, padding: "14px 40px", cursor: "pointer",
                        textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace",
                        clipPath: "polygon(8% 0, 100% 0, 100% 70%, 92% 100%, 0 100%, 0 30%)"
                    }}>
                        Next Match →
                    </button>

                    <button onClick={onEnd} style={{
                        background: "transparent", color: "#ff4757", border: "1px solid #333", padding: "12px 25px", cursor: "pointer",
                        textTransform: "uppercase", fontSize: "11px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        Exit
                    </button>

                    <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
                        <button onClick={() => setIsMuted(!isMuted)} style={{ background: isMuted ? "#ff4757" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: "2px", cursor: "pointer" }}>
                            <Icons.Mic />
                        </button>
                        <button onClick={() => setIsCameraOff(!isCameraOff)} style={{ background: isCameraOff ? "#ff4757" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "12px", borderRadius: "2px", cursor: "pointer" }}>
                            <Icons.Camera />
                        </button>
                    </div>
                </div>
            </div>

            <aside style={{ borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", background: "#080808", zIndex: 20 }}>
                <div style={{ padding: "24px", borderBottom: "1px solid #1a1a1a", fontSize: "10px", fontWeight: 800, color: "#444", letterSpacing: "3px", fontFamily: "'JetBrains Mono', monospace" }}>
                    COMM_CHANNEL_DATA
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "15px" }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.sender === "me" ? "flex-end" : (m.sender === "system" ? "center" : "flex-start"),
                            maxWidth: m.sender === "system" ? "100%" : "85%"
                        }}>
                            <div style={{
                                padding: m.sender === "system" ? "8px 15px" : "12px 18px",
                                borderRadius: m.sender === "system" ? "0" : (m.sender === "me" ? "15px 15px 0 15px" : "15px 15px 15px 0"),
                                fontSize: m.sender === "system" ? "10px" : "13px",
                                background: m.sender === "me" ? "#fff" : (m.sender === "system" ? "rgba(139,92,246,0.05)" : "#111"),
                                color: m.sender === "me" ? "#000" : (m.sender === "system" ? "#8b5cf6" : "#ddd"),
                                border: m.sender === "system" ? "none" : "1px solid rgba(255,255,255,0.05)",
                                fontFamily: m.sender === "system" ? "'JetBrains Mono', monospace" : "inherit"
                            }}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} style={{ padding: "20px", background: "#050505", borderTop: "1px solid #1a1a1a" }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        style={{ width: "100%", background: "#0a0a0a", border: "1px solid #222", color: "#fff", padding: "14px", outline: "none", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace" }}
                    />
                </form>
            </aside>

            <style jsx>{`
                @keyframes pulse {
                    0% { transform: scaleX(0.5); opacity: 0.2; }
                    50% { transform: scaleX(2); opacity: 1; }
                    100% { transform: scaleX(0.5); opacity: 0.2; }
                }
            `}</style>
        </div>
    );
}
