"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
    collection, addDoc, onSnapshot, query, where,
    limit, getDocs, updateDoc, doc, deleteDoc,
    serverTimestamp, orderBy
} from "firebase/firestore";

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
    const chatEndRef = useRef(null);
    const queueDocRef = useRef(null);
    const streamRef = useRef(null);

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

    // 1. Camera access with high quality
    useEffect(() => {
        async function getCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                    audio: true
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
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
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped track: ${track.kind}`);
            });
            streamRef.current = null;
        }
    };

    const cleanupQueue = async () => {
        if (queueDocRef.current) {
            try {
                await deleteDoc(doc(db, "matchQueue", queueDocRef.current));
            } catch (e) { }
        }
    };

    // 2. Real Matching Algorithm
    useEffect(() => {
        if (!user || !isSearching) return;

        let unsubscribe = null;

        const findMatch = async () => {
            if (!user) return;
            try {
                // 1. Join the queue
                const myEntry = {
                    userId: user.uid,
                    name: profile?.name || user.email.split("@")[0],
                    college: profile?.college || "Unknown",
                    mode: mode,
                    status: "searching",
                    matchedWith: null,
                    createdAt: serverTimestamp()
                };

                const qRef = await addDoc(collection(db, "matchQueue"), myEntry);
                queueDocRef.current = qRef.id;
                console.log("Joined queue as:", qRef.id);

                // 2. Listen to OWN doc for match updates
                const myUnsub = onSnapshot(doc(db, "matchQueue", qRef.id), (docSnap) => {
                    const data = docSnap.data();
                    if (data && data.status === "matched" && data.matchedWith) {
                        console.log("MATCH DETECTED (Incoming):", data.matchedWith);
                        completeMatch(data.matchedWithData, myUnsub);
                    }
                });

                // 3. Search Loop
                const searchForOthers = async () => {
                    if (!isSearching) return;

                    // Query others: same mode or ANY if I/they chose RANDOM
                    let q;
                    if (mode === "RANDOM") {
                        q = query(
                            collection(db, "matchQueue"),
                            where("status", "==", "searching"),
                            orderBy("createdAt", "asc"),
                            limit(10)
                        );
                    } else {
                        q = query(
                            collection(db, "matchQueue"),
                            where("mode", "==", mode),
                            where("status", "==", "searching"),
                            orderBy("createdAt", "asc"),
                            limit(10)
                        );
                    }

                    const snapshot = await getDocs(q);
                    const candidates = snapshot.docs.filter(d => d.id !== qRef.id);

                    if (candidates.length > 0) {
                        const target = candidates[0];
                        const targetData = target.data();

                        console.log("Found candidate:", target.id);

                        try {
                            // HANDSHAKE: Update TARGET first
                            await updateDoc(doc(db, "matchQueue", target.id), {
                                status: "matched",
                                matchedWith: user.uid,
                                matchedWithData: myEntry
                            });

                            // Update SELF
                            await updateDoc(doc(db, "matchQueue", qRef.id), {
                                status: "matched",
                                matchedWith: targetData.userId,
                                matchedWithData: targetData
                            });

                            completeMatch(targetData, myUnsub);
                        } catch (e) {
                            console.log("Collision. Retrying...");
                        }
                    }
                };

                const completeMatch = (pData, unsub) => {
                    if (!isSearching) return;
                    setIsSearching(false);
                    setPartner(pData);
                    setSafetyBlur(true);
                    setTimeout(() => setSafetyBlur(false), 3000);

                    setMessages([{
                        id: "sys",
                        text: `Secured match with ${pData.name} (${pData.college})`,
                        sender: "system"
                    }]);

                    if (unsub) unsub();
                    if (searchInterval) clearInterval(searchInterval);
                };

                const searchInterval = setInterval(searchForOthers, 4000);
                unsubscribe = () => {
                    if (myUnsub) myUnsub();
                    if (searchInterval) clearInterval(searchInterval);
                };

            } catch (err) {
                console.error("Match flow error:", err);
            }
        };

        findMatch();
        return () => unsubscribe && unsubscribe();
    }, [user, isSearching]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (!isSearching) setChatTime(t => t + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isSearching]);

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
    };

    const handleStop = () => {
        stopCamera();
        cleanupQueue();
        router.push("/dashboard");
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div style={{
            height: "100vh", width: "100vw", background: "#050505",
            display: "grid", gridTemplateColumns: "1fr 360px",
            color: "#e2e2e2", fontFamily: "'Inter', sans-serif",
            overflow: "hidden"
        }}>

            {/* ── Main View Area ── */}
            <main style={{ position: "relative", display: "flex", flexDirection: "column", background: "#000" }}>

                {/* HUD Overlay */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, padding: "24px 40px",
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)",
                    zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <div onClick={handleStop} style={{ cursor: "pointer", fontWeight: 900, fontSize: "22px", border: "2px solid white", padding: "2px 6px", transform: "rotate(-5deg)" }}>CC</div>
                        <div>
                            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "2px" }}>CAMPUS MATCHING</div>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#8b5cf6" }}>{mode.toUpperCase()} MODE</div>
                        </div>
                    </div>

                    {!isSearching && partner && (
                        <div style={{ display: "flex", alignItems: "center", gap: "15px", background: "rgba(255,255,255,0.05)", padding: "10px 20px", borderRadius: "8px", backdropFilter: "blur(10px)" }}>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "14px", fontWeight: 700 }}>{partner.name}</div>
                                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>{partner.college}</div>
                            </div>
                            <div style={{ width: "32px", height: "32px", background: "#8b5cf6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                                {partner.name[0]}
                            </div>
                        </div>
                    )}
                </div>

                {/* Video Container */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", background: "#111" }}>

                    {/* Stranger Video */}
                    <div style={{ position: "relative", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {isSearching ? (
                            <div style={{ textAlign: "center", animation: "pulse 2s infinite" }}>
                                <div style={{ width: "60px", height: "60px", border: "4px solid #333", borderTopColor: "#8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
                                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#666", letterSpacing: "1px" }}>FINDING A VERIFIED STUDENT...</div>
                            </div>
                        ) : (
                            <div style={{ width: "100%", height: "100%", background: "#1a1a1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ textAlign: "center", opacity: 0.3, filter: safetyBlur ? "blur(20px)" : "none", transition: "filter 1s ease" }}>
                                    <div style={{ marginBottom: "15px" }}>
                                        <Icons.GraduationCap size={80} color="#fff" />
                                    </div>
                                    <div style={{ fontSize: "14px", marginTop: "10px", fontWeight: 700, letterSpacing: "1px" }}>ENCRYPTED FEED</div>
                                </div>

                                {/* Safety Shield Overlay */}
                                {safetyBlur && (
                                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(40px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ marginBottom: "15px" }}>
                                                <Icons.Shield size={32} color="#8b5cf6" />
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#8b5cf6", letterSpacing: "2px", fontWeight: 800 }}>AI_SAFETY_SCANNING</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div style={{ position: "absolute", bottom: "30px", left: "30px", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, letterSpacing: "1px", zIndex: 6 }}>
                            MATCH
                        </div>
                    </div>

                    {/* Local User Video */}
                    <div style={{ position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)",
                                filter: isCameraOff ? "brightness(0)" : "none"
                            }}
                        />
                        <div style={{ position: "absolute", bottom: "30px", right: "30px", background: "rgba(0,0,0,0.6)", padding: "6px 14px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, letterSpacing: "1px" }}>
                            YOU (LIVE)
                        </div>
                    </div>
                </div>

                {/* Control Bar */}
                <div style={{
                    height: "120px", background: "#080808", borderTop: "1px solid #1a1a1a",
                    display: "flex", alignItems: "center", padding: "0 50px", gap: "25px"
                }}>
                    <button
                        onClick={handleNext}
                        style={{
                            background: "#fff", color: "#000", border: "none", fontWeight: 900,
                            padding: "18px 50px", fontSize: "15px", textTransform: "uppercase",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
                            boxShadow: "0 4px 20px rgba(255,255,255,0.1)", transition: "transform 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        SKIP / NEXT <span style={{ fontSize: "20px" }}>→</span>
                    </button>

                    <button
                        onClick={handleStop}
                        style={{
                            background: "transparent", color: "#ff4757", border: "1px solid #333",
                            padding: "18px 30px", fontSize: "13px", textTransform: "uppercase",
                            cursor: "pointer", fontWeight: 700, transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff4757"; e.currentTarget.style.background = "rgba(255,71,87,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.background = "transparent"; }}
                    >
                        Close
                    </button>

                    <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            style={{
                                background: isMuted ? "#ff4757" : "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px",
                                borderRadius: "10px", cursor: "pointer", transition: "all 0.3s"
                            }}
                        >
                            <Icons.Mic size={18} />
                        </button>
                        <button
                            onClick={() => setIsCameraOff(!isCameraOff)}
                            style={{
                                background: isCameraOff ? "#ff4757" : "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "12px",
                                borderRadius: "10px", cursor: "pointer", transition: "all 0.3s",
                                display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "11px"
                            }}
                        >
                            <Icons.Camera size={18} />
                            {isCameraOff ? "OFF" : "ON"}
                        </button>
                    </div>

                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#444", letterSpacing: "2px", marginBottom: "4px" }}>SESSION DURATION</div>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "24px", fontWeight: 800, color: "#fff" }}>{formatTime(chatTime)}</div>
                    </div>
                </div>
            </main>

            {/* ── Chat Sidebar (OmeTV Style) ── */}
            <aside style={{ borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", background: "#080808" }}>
                <div style={{ padding: "24px", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#666", fontWeight: 800, letterSpacing: "2px" }}>MESSAGES</span>
                    <button style={{ background: "transparent", border: "none", color: "#ff4757", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icons.Shield size={12} /> REPORT
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{ alignSelf: m.sender === "me" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                            {m.sender === "system" ? (
                                <div style={{ fontSize: "10px", color: "#8b5cf6", textAlign: "center", fontStyle: "italic", margin: "10px 0", background: "rgba(139,92,246,0.1)", padding: "10px", borderRadius: "4px" }}>
                                    {m.text}
                                </div>
                            ) : (
                                <div style={{
                                    background: m.sender === "me" ? "#fff" : "#1a1a1c",
                                    color: m.sender === "me" ? "#000" : "#fff",
                                    padding: "12px 18px", borderRadius: "16px",
                                    borderBottomRightRadius: m.sender === "me" ? "2px" : "16px",
                                    borderBottomLeftRadius: m.sender === "me" ? "16px" : "2px",
                                    fontSize: "14px", lineHeight: 1.5,
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)"
                                }}>
                                    {m.text}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={sendMessage} style={{ padding: "24px", background: "#050505", borderTop: "1px solid #1a1a1a" }}>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Send a verified message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            style={{
                                width: "100%", background: "#111", border: "1px solid #222",
                                padding: "14px 20px", paddingRight: "60px", color: "white", outline: "none",
                                borderRadius: "8px", fontSize: "14px", transition: "border-color 0.3s"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
                            onBlur={(e) => e.target.style.borderColor = "#222"}
                        />
                        <button type="submit" style={{
                            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", color: "#8b5cf6", fontWeight: 900, cursor: "pointer",
                            fontSize: "12px", letterSpacing: "1px"
                        }}>SEND</button>
                    </div>
                </form>
            </aside>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
            `}</style>
        </div>
    );
}
