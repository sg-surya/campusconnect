"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardView({ user, profile, onStartMatch }) {
    const gridCanvasRef = useRef(null);
    const [statusLine, setStatusLine] = useState("Ready to connect...");
    const [matchLine, setMatchLine] = useState("Choose a mode to get started.");
    const [btnStates, setBtnStates] = useState({});

    const [onlineCount, setOnlineCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeMatches, setActiveMatches] = useState(0);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "users"), where("isOnline", "==", true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOnlineCount(snapshot.size);
        });

        const fetchStats = async () => {
            try {
                const totalSnap = await getCountFromServer(collection(db, "users"));
                setTotalUsers(totalSnap.data().count);
            } catch (err) { }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 60000);

        const matchQ = query(collection(db, "matchQueue"), where("status", "==", "matched"));
        const unsubMatches = onSnapshot(matchQ, (snapshot) => {
            setActiveMatches(Math.floor(snapshot.size / 2));
        });

        return () => {
            unsubscribe();
            unsubMatches();
            clearInterval(interval);
        };
    }, [user]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (gridCanvasRef.current) {
                const x = (e.clientX / window.innerWidth) * 100;
                const y = (e.clientY / window.innerHeight) * 100;
                gridCanvasRef.current.style.backgroundPosition = `${x * 0.1}px ${y * 0.1}px`;
            }
        };
        document.addEventListener("mousemove", handleMouseMove);
        return () => document.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const triggerMatch = (mode, label) => {
        setStatusLine(`Finding someone for ${label}...`);
        setMatchLine("Searching online students...");
        setBtnStates((prev) => ({
            ...prev,
            [mode]: { text: "Connecting...", phase: "connecting" },
        }));
        setTimeout(() => {
            onStartMatch(mode);
        }, 1200);
    };

    const modes = [
        { key: "LOCAL", title: "Same College", desc: "Connect with verified students from your own campus network.", btnDefault: "Connect Local" },
        { key: "FOUNDER", title: "Co-Founder", desc: "Network with ambitious student entrepreneurs and builders.", btnDefault: "Find Founders" },
        { key: "GLOBAL", title: "Cross-College", desc: "Expand your reach to students across all verified institutions.", btnDefault: "Global Meet" },
        { key: "ACADEMIC", title: "Study Sync", desc: "Find peers studying similar subjects for collaboration.", btnDefault: "Partner Up" },
        { key: "RANDOM", title: "Blind Match", desc: "Instant connection with any active verified student.", btnDefault: "Roll Dice" }
    ];

    const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
    const displayCollege = profile ? `${profile.branch || "B.Tech"} · ${profile.college || "Institute"}` : "";
    const displayYear = profile?.year ? `Batch ${2024 + (5 - parseInt(profile.year))}` : "Verified Student";

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "100%", width: "100%", background: "#050505", position: "relative", overflow: "hidden" }}>
            {/* Interactive Background Grid */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.03) 1.5px, transparent 1.5px),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1.5px, transparent 1.5px),
                    linear-gradient(rgba(139,92,246,0.01) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(139,92,246,0.01) 1px, transparent 1px)
                `,
                backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",
                backgroundPosition: "center center"
            }} ref={gridCanvasRef} />

            {/* Grain Overlay */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, opacity: 0.04,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            <main style={{ padding: "60px", overflowY: "auto", position: "relative", zIndex: 5 }}>
                <header style={{ marginBottom: "80px" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#8b5cf6", letterSpacing: "4px", marginBottom: "20px", textTransform: "uppercase" }}>
                        SYSTEM_DASHBOARD_V1.0
                    </div>
                    <h1 style={{ fontSize: "5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-4px", lineHeight: 0.85, color: "#fff" }}>
                        CAMPUS<br /><span style={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}>CONNECT.</span>
                    </h1>
                </header>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" }}>
                    {modes.map((m, i) => (
                        <div key={m.key} className="mode-card" style={{
                            background: "rgba(15,15,17,0.8)", padding: "40px", border: "1px solid rgba(255,255,255,0.05)",
                            position: "relative", transition: "0.4s cubic-bezier(0.19, 1, 0.22, 1)", backdropFilter: "blur(10px)",
                            overflow: "hidden"
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-5px)";
                                e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)";
                                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(139,92,246,0.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                                e.currentTarget.style.boxShadow = "none";
                            }}>
                            {/* Card Decorative Corners */}
                            <div style={{ position: "absolute", top: "-1px", left: "-1px", width: "12px", height: "12px", borderTop: "2px solid #333", borderLeft: "2px solid #333" }} />
                            <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "12px", height: "12px", borderBottom: "2px solid #333", borderRight: "2px solid #333" }} />

                            <div style={{ fontSize: "9px", fontFamily: "'JetBrains Mono', monospace", color: "#444", marginBottom: "12px" }}>0{i + 1} // ACCESS_POINT</div>
                            <h3 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "-1px" }}>{m.title}</h3>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: 1.6, marginBottom: "30px", minHeight: "60px" }}>{m.desc}</p>

                            <button onClick={() => triggerMatch(m.key, m.title)} style={{
                                border: "none", background: "#fff", color: "#000", padding: "16px 25px",
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 900,
                                width: "100%", textAlign: "left", cursor: "pointer", transition: "0.3s",
                                textTransform: "uppercase", letterSpacing: "1px",
                                clipPath: "polygon(5% 0, 100% 0, 100% 70%, 95% 100%, 0 100%, 0 30%)"
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}>
                                {btnStates[m.key]?.text || m.btnDefault}
                                <span style={{ float: "right" }}>→</span>
                            </button>
                        </div>
                    ))}
                </div>
            </main>

            <aside style={{ background: "rgba(8,8,9,0.95)", borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "60px 40px", display: "flex", flexDirection: "column", zIndex: 11, backdropFilter: "blur(40px)" }}>
                <div style={{ marginBottom: "60px" }}>
                    <div style={{ fontSize: "10px", color: "#444", borderBottom: "1px solid #1a1a1a", paddingBottom: "16px", marginBottom: "30px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px" }}>IDENTITY_PROTOCOL</div>
                    <div style={{
                        background: "rgba(255,255,255,0.02)", padding: "30px", border: "1px solid rgba(255,255,255,0.05)", position: "relative",
                        clipPath: "polygon(0 0, 90% 0, 100% 10%, 100% 100%, 10% 100%, 0 90%)"
                    }}>
                        <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", marginBottom: "4px", letterSpacing: "-1px" }}>{displayName}</div>
                        <div style={{ fontSize: "11px", color: "#8b5cf6", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>{displayYear}</div>
                        <div style={{ fontSize: "11px", color: "#444", marginTop: "12px", lineHeight: 1.5 }}>{displayCollege}</div>
                    </div>
                </div>

                <div style={{ marginBottom: "60px" }}>
                    <div style={{ fontSize: "10px", color: "#444", borderBottom: "1px solid #1a1a1a", paddingBottom: "16px", marginBottom: "30px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px" }}>REALTIME_METRICS</div>
                    {[
                        { label: "Network Online", value: onlineCount, color: "#fff", icon: "●" },
                        { label: "Active Nodes", value: activeMatches, color: "#8b5cf6", icon: "≈" },
                        { label: "Social Karma", value: profile?.karma || 100, color: "#facc15", icon: "◈" }
                    ].map(s => (
                        <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ color: s.color, fontSize: "14px", animation: s.label.includes("Online") ? "pulse-dot 2s infinite" : "none" }}>{s.icon}</span>
                                <span style={{ color: "#444", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
                            </div>
                            <span style={{ color: s.color, fontSize: "18px", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
                        </div>
                    ))}
                </div>

                <div style={{ marginBottom: "60px" }}>
                    <div style={{ fontSize: "10px", color: "#444", borderBottom: "1px solid #1a1a1a", paddingBottom: "16px", marginBottom: "30px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px" }}>COMMUNITY_SUPPORT</div>
                    <div style={{ background: "rgba(139,92,246,0.03)", border: "1px solid rgba(139,92,246,0.1)", padding: "20px", borderRadius: "2px" }}>
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: "15px" }}>Need help? Request your institution or report an issue on our official server.</p>
                        <a href="https://discord.gg/zNUtGNNmRG" target="_blank" rel="noopener noreferrer" style={{
                            display: "block", textAlign: "center", background: "#8b5cf6", color: "#fff", padding: "10px",
                            fontSize: "10px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
                            letterSpacing: "1px", textDecoration: "none", transition: "0.3s",
                            clipPath: "polygon(5% 0, 100% 0, 100% 80%, 95% 100%, 0 100%, 0 20%)"
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; }}>
                            Join Official Discord
                        </a>
                    </div>
                </div>

                <div style={{ marginTop: "auto", padding: "25px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.03)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>
                    <div style={{ color: "#8b5cf6", marginBottom: "8px" }}>› STATUS: {statusLine.toUpperCase()}</div>
                    <div style={{ color: "#444" }}>› SYSTEM: {matchLine.toUpperCase()}</div>
                </div>
            </aside>

            <style jsx>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 0.3; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
