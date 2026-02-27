"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    collection, addDoc, onSnapshot, query, where,
    limit, getDocs, updateDoc, doc, deleteDoc,
    serverTimestamp, orderBy, getDoc, setDoc
} from "firebase/firestore";

const servers = {
    iceServers: [
        {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
        },
    ],
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
        ),
        X: ({ size = 20, color = "currentColor" }) => (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        )
    };

    // 1. Camera access
    useEffect(() => {
        async function getCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true
                });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        }
        getCamera();

        return () => {
            stopCamera();
            cleanupQueue();
        };
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const cleanupQueue = async () => {
        if (queueDocRef.current) {
            try {
                const docRef = doc(db, "matchQueue", queueDocRef.current);
                await updateDoc(docRef, { status: "disconnected" });
                setTimeout(() => deleteDoc(docRef), 1000);
            } catch (e) { }
            queueDocRef.current = null;
        }
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
    };

    // 2. Matching and WebRTC Handshake
    useEffect(() => {
        if (!user || !isSearching) return;

        let myUnsub = null;
        let searchInterval = null;

        const findMatch = async () => {
            try {
                const myEntry = {
                    userId: user.uid,
                    name: profile?.name || user.email.split("@")[0],
                    college: profile?.college || "Unknown College",
                    mode: mode,
                    status: "searching",
                    matchedWith: null,
                    createdAt: serverTimestamp()
                };

                const qRef = await addDoc(collection(db, "matchQueue"), myEntry);
                queueDocRef.current = qRef.id;

                // Listen for status changes (Handshake listener)
                myUnsub = onSnapshot(doc(db, "matchQueue", qRef.id), async (docSnap) => {
                    const data = docSnap.data();
                    if (!data) return;

                    // Remote Disconnect handling
                    if (data.status === "disconnected" && !isSearching) {
                        handleNext();
                        return;
                    }

                    // Someone matched with me
                    if (data.status === "matched" && data.matchedWith && isSearching) {
                        console.log("Matched by peer!");
                        startWebRTC(data.matchedWith, data.matchedWithData, false);
                    }
                });

                const searchForOthers = async () => {
                    if (!isSearching) return;
                    let q = query(
                        collection(db, "matchQueue"),
                        where("status", "==", "searching"),
                        orderBy("createdAt", "asc"),
                        limit(10)
                    );
                    if (mode !== "RANDOM") {
                        q = query(q, where("mode", "==", mode));
                    }

                    const snapshot = await getDocs(q);
                    const others = snapshot.docs.filter(d => d.id !== qRef.id);

                    if (others.length > 0) {
                        const target = others[0];
                        const targetData = target.data();

                        try {
                            // Lock both sides
                            await updateDoc(doc(db, "matchQueue", target.id), {
                                status: "matched",
                                matchedWith: user.uid,
                                matchedWithData: myEntry
                            });
                            await updateDoc(doc(db, "matchQueue", qRef.id), {
                                status: "matched",
                                matchedWith: targetData.userId,
                                matchedWithData: targetData
                            });
                            startWebRTC(targetData.userId, targetData, true);
                        } catch (e) { console.log("Retrying match..."); }
                    }
                };

                searchInterval = setInterval(searchForOthers, 3000);
            } catch (err) { console.error("Match error:", err); }
        };

        const startWebRTC = async (partnerId, partnerData, isCaller) => {
            setIsSearching(false);
            setPartner(partnerData);
            setSafetyBlur(true);
            setTimeout(() => setSafetyBlur(false), 3000);

            setMessages([{ id: "sys", text: `Connected with ${partnerData.name}. Feel safe!`, sender: "system" }]);

            const peer = new RTCPeerConnection(servers);
            pc.current = peer;

            // Push tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => peer.addTrack(track, streamRef.current));
            }

            // Receive tracks
            peer.ontrack = (event) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
            };

            // Signaling via doc
            const callId = [user.uid, partnerId].sort().join("_");
            const callDoc = doc(db, "calls", callId);

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    const candCol = collection(callDoc, isCaller ? "callerCandidates" : "calleeCandidates");
                    addDoc(candCol, event.candidate.toJSON());
                }
            };

            if (isCaller) {
                const offerDescription = await peer.createOffer();
                await peer.setLocalDescription(offerDescription);
                await setDoc(callDoc, { offer: { sdp: offerDescription.sdp, type: offerDescription.type } });

                onSnapshot(callDoc, (snapshot) => {
                    const data = snapshot.data();
                    if (!peer.currentRemoteDescription && data?.answer) {
                        peer.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                });

                onSnapshot(collection(callDoc, "calleeCandidates"), (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            peer.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                        }
                    });
                });
            } else {
                // Wait for offer
                const offerUnsub = onSnapshot(callDoc, async (snapshot) => {
                    const data = snapshot.data();
                    if (data?.offer && !peer.currentRemoteDescription) {
                        await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const answerDescription = await peer.createAnswer();
                        await peer.setLocalDescription(answerDescription);
                        await updateDoc(callDoc, { answer: { sdp: answerDescription.sdp, type: answerDescription.type } });
                        offerUnsub();
                    }
                });

                onSnapshot(collection(callDoc, "callerCandidates"), (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            peer.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                        }
                    });
                });
            }
        };

        findMatch();
        return () => {
            if (myUnsub) myUnsub();
            if (searchInterval) clearInterval(searchInterval);
        };
    }, [user, isSearching]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => { if (!isSearching) setChatTime(t => t + 1); }, 1000);
        return () => clearInterval(timer);
    }, [isSearching]);

    // Auto scroll chat
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMessages(prev => [...prev, { id: Date.now(), text: input.trim(), sender: "me" }]);
        setInput("");
    };

    const handleNext = () => {
        cleanupQueue();
        setIsSearching(true);
        setPartner(null);
        setMessages([]);
        setChatTime(0);
        setSafetyBlur(true);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const handleStop = () => {
        stopCamera();
        cleanupQueue();
        router.push("/dashboard");
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "100vh", width: "100vw", background: "#050505", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
            <main style={{ display: "flex", flexDirection: "column", height: "100vh", position: "relative" }}>
                {/* ── Partner Profile HUD ── */}
                {partner && (
                    <div style={{ position: "absolute", top: "30px", right: "30px", zIndex: 10, display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.6)", padding: "10px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ color: "white", fontWeight: 800, fontSize: "14px" }}>{partner.name}</div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", textTransform: "uppercase" }}>{partner.college || "Verified Student"}</div>
                        </div>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", textTransform: "uppercase" }}>
                            {partner.name[0]}
                        </div>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, gap: "1px", background: "#1a1a1a" }}>
                    {/* Remote Video */}
                    <div style={{ position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: isSearching ? "none" : "block" }} />

                        {(isSearching || !partner) && (
                            <div style={{ textAlign: "center", opacity: 0.5 }}>
                                <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "3px", color: "#8b5cf6" }}>WAITING_FOR_PEER...</div>
                            </div>
                        )}

                        {!isSearching && partner && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                                <div style={{ textAlign: "center", opacity: 0.3, filter: safetyBlur ? "blur(20px)" : "none", transition: "filter 1s ease" }}>
                                    <Icons.GraduationCap size={80} color="#fff" />
                                    <div style={{ fontSize: "14px", marginTop: "10px", fontWeight: 700, letterSpacing: "1px" }}>PEER CONNECTION</div>
                                </div>
                                {safetyBlur && (
                                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(40px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
                                        <div style={{ textAlign: "center" }}>
                                            <Icons.Shield size={32} color="#8b5cf6" />
                                            <div style={{ fontSize: "11px", color: "#8b5cf6", letterSpacing: "2px", fontWeight: 800, marginTop: "10px" }}>AI_SAFETY_SCANNING</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div style={{ position: "absolute", bottom: "30px", left: "30px", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", zIndex: 6 }}>MATCH</div>
                    </div>

                    {/* Local Video */}
                    <div style={{ position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", filter: isCameraOff ? "brightness(0)" : "none" }} />
                        <div style={{ position: "absolute", bottom: "30px", right: "30px", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, letterSpacing: "1px" }}>YOU (LIVE)</div>
                    </div>
                </div>

                <div style={{ height: "120px", background: "#080808", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", padding: "0 50px", gap: "25px" }}>
                    <button onClick={handleNext} style={{ background: "#fff", color: "#000", border: "none", fontWeight: 900, padding: "18px 50px", fontSize: "15px", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}>
                        SKIP / NEXT →
                    </button>
                    <button onClick={handleStop} style={{ background: "transparent", color: "#ff4757", border: "1px solid #333", padding: "18px 30px", fontSize: "13px", textTransform: "uppercase", cursor: "pointer", fontWeight: 700 }}>Close</button>

                    <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
                        <button onClick={() => setIsMuted(!isMuted)} style={{ background: isMuted ? "#ff4757" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "10px", cursor: "pointer" }}><Icons.Mic size={18} /></button>
                        <button onClick={() => setIsCameraOff(!isCameraOff)} style={{ background: isCameraOff ? "#ff4757" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "11px" }}><Icons.Camera size={18} /> {isCameraOff ? "OFF" : "ON"}</button>
                    </div>

                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#444", letterSpacing: "2px", marginBottom: "4px" }}>SESSION DURATION</div>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "24px", fontWeight: 800, color: "#fff" }}>{formatTime(chatTime)}</div>
                    </div>
                </div>
            </main>

            <aside style={{ borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", background: "#080808" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#666", fontWeight: 800, letterSpacing: "2px" }}>MESSAGES</span>
                    <button style={{ background: "transparent", border: "none", color: "#ff4757", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><Icons.Shield size={12} /> REPORT</button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{ alignSelf: m.sender === "me" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                            {m.sender === "system" ? (
                                <div style={{ fontSize: "10px", color: "#8b5cf6", textAlign: "center", fontStyle: "italic", margin: "10px 0", background: "rgba(139,92,246,0.1)", padding: "10px", borderRadius: "4px" }}>{m.text}</div>
                            ) : (
                                <div style={{ background: m.sender === "me" ? "#fff" : "#1a1a1c", color: m.sender === "me" ? "#000" : "#fff", padding: "12px 18px", borderRadius: "16px", borderBottomRightRadius: m.sender === "me" ? "2px" : "16px", borderBottomLeftRadius: m.sender === "me" ? "16px" : "2px", fontSize: "14px", lineHeight: 1.5 }}>{m.text}</div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendMessage} style={{ padding: "24px", background: "#050505", borderTop: "1px solid #1a1a1a" }}>
                    <input type="text" placeholder="Send a message..." value={input} onChange={(e) => setInput(e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid #222", color: "white", padding: "14px 20px", borderRadius: "12px", fontSize: "13px", outline: "none" }} />
                </form>
            </aside>
        </div>
    );
}
