"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

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

    const videoRef = useRef(null); // Local user
    const chatEndRef = useRef(null);

    // Camera access
    useEffect(() => {
        async function getCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera access denied:", err);
            }
        }
        getCamera();

        // Cleanup
        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (!isSearching) setChatTime(t => t + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isSearching]);

    // Search simulation
    useEffect(() => {
        if (isSearching) {
            const timeout = setTimeout(() => {
                const dummyPartners = [
                    { name: "Aryan", college: "IIT Delhi", branch: "CSE", year: "3rd" },
                    { name: "Sneha", college: "NIT Surat", branch: "ECE", year: "2nd" },
                    { name: "Rahul", college: "BITS Pilani", branch: "Mech", year: "4th" },
                    { name: "Ananya", college: "VIT", branch: "IT", year: "1st" }
                ];
                const p = dummyPartners[Math.floor(Math.random() * dummyPartners.length)];
                setPartner(p);
                setIsSearching(false);
                setMessages([{
                    id: "system",
                    text: `You are now chatting with a verified student from ${p.college}!`,
                    sender: "system"
                }]);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [isSearching]);

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, {
            id: Date.now(),
            text: input.trim(),
            sender: "me"
        }]);
        setInput("");

        // Simulated response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "Hey! Nice to meet you. How's campus life there?",
                sender: "partner"
            }]);
        }, 1500);
    };

    const handleNext = () => {
        setIsSearching(true);
        setPartner(null);
        setMessages([]);
        setChatTime(0);
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div style={{
            height: "100vh", width: "100vw", background: "#050505",
            display: "grid", gridTemplateColumns: "1fr 340px",
            color: "#e2e2e2", fontFamily: "Inter, sans-serif",
            overflow: "hidden"
        }}>

            {/* ── Video Area ── */}
            <main style={{ position: "relative", display: "flex", flexDirection: "column", background: "#000" }}>

                {/* Header */}
                <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, padding: "20px 40px",
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
                    zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <Link href="/dashboard" style={{
                            fontSize: "20px", fontWeight: 900, textDecoration: "none", color: "white",
                            border: "2px solid white", padding: "2px 5px", transform: "rotate(-5deg)"
                        }}>CC</Link>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "2px" }}>
                            {mode} MODE · LIVE
                        </span>
                    </div>
                    {partner && (
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: 700 }}>{partner.name} · {partner.college}</div>
                            <div style={{ fontSize: "10px", color: "#00ff66" }}>● VERIFIED STUDENT</div>
                        </div>
                    )}
                </div>

                {/* Video Grid */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", background: "#111" }}>

                    {/* Partner Video */}
                    <div style={{ position: "relative", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isSearching ? (
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    width: "40px", height: "40px", border: "3px solid #333", borderTopColor: "#8b5cf6",
                                    borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 15px"
                                }} />
                                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#666" }}>SEARCHING FOR MATCH...</div>
                            </div>
                        ) : (
                            <div style={{ width: "100%", height: "100%", background: "#1a1a1c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {/* Simulated Video Feed (Black for now as it's a demo) */}
                                <div style={{ textAlign: "center", opacity: 0.5 }}>
                                    <div style={{ fontSize: "50px", marginBottom: "10px" }}>👤</div>
                                    <div style={{ fontSize: "12px" }}>Remote Video Feed</div>
                                </div>
                            </div>
                        )}
                        <div style={{ position: "absolute", bottom: "20px", left: "20px", background: "rgba(0,0,0,0.5)", padding: "5px 10px", borderRadius: "4px", fontSize: "10px" }}>
                            STRANGER
                        </div>
                    </div>

                    {/* Local Video */}
                    <div style={{ position: "relative", background: "#0a0a0a" }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                        <div style={{ position: "absolute", bottom: "20px", right: "20px", background: "rgba(0,0,0,0.5)", padding: "5px 10px", borderRadius: "4px", fontSize: "10px" }}>
                            YOU
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div style={{
                    height: "100px", background: "#0a0a0a", borderTop: "1px solid #222",
                    display: "flex", alignItems: "center", padding: "0 40px", gap: "20px"
                }}>
                    <button
                        onClick={handleNext}
                        style={{
                            background: "#fff", color: "#000", border: "none", fontWeight: 800,
                            padding: "16px 40px", fontSize: "14px", textTransform: "uppercase",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "10px"
                        }}
                    >
                        Next Match <span style={{ fontSize: "18px" }}>→</span>
                    </button>

                    <button
                        onClick={() => router.push("/dashboard")}
                        style={{
                            background: "transparent", color: "#ff4444", border: "1px solid #333",
                            padding: "16px 30px", fontSize: "12px", textTransform: "uppercase",
                            cursor: "pointer", fontWeight: 700
                        }}
                    >
                        Stop
                    </button>

                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#666", letterSpacing: "1px" }}>SESSION TIME</div>
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 700 }}>{formatTime(chatTime)}</div>
                    </div>
                </div>
            </main>

            {/* ── Chat Side Panel ── */}
            <aside style={{ borderLeft: "1px solid #222", display: "flex", flexDirection: "column", background: "#0a0a0a" }}>
                <div style={{ padding: "20px", borderBottom: "1px solid #222", fontSize: "11px", color: "#666", fontWeight: 700, letterSpacing: "1px" }}>
                    TEXT CHAT
                </div>

                {/* Messages List */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{ alignSelf: m.sender === "me" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                            {m.sender === "system" ? (
                                <div style={{ fontSize: "10px", color: "#8b5cf6", textAlign: "center", fontStyle: "italic", margin: "10px 0" }}>
                                    {m.text}
                                </div>
                            ) : (
                                <div style={{
                                    background: m.sender === "me" ? "#fff" : "#1a1a1c",
                                    color: m.sender === "me" ? "#000" : "#fff",
                                    padding: "10px 15px", borderRadius: "12px",
                                    borderBottomRightRadius: m.sender === "me" ? "2px" : "12px",
                                    borderBottomLeftRadius: m.sender === "me" ? "12px" : "2px",
                                    fontSize: "13px", lineHeight: 1.4
                                }}>
                                    {m.text}
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={sendMessage} style={{ padding: "20px", background: "#050505", borderTop: "1px solid #222" }}>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            style={{
                                width: "100%", background: "#111", border: "1px solid #333",
                                padding: "12px 15px", paddingRight: "50px", color: "white", outline: "none",
                                borderRadius: "4px", fontSize: "13px"
                            }}
                        />
                        <button type="submit" style={{
                            position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", color: "#8b5cf6", fontWeight: 900, cursor: "pointer"
                        }}>SEND</button>
                    </div>
                </form>
            </aside>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 3px; }
                ::-webkit-scrollbar-thumb { background: #333; }
            `}</style>
        </div>
    );
}
