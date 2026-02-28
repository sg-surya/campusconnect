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
        <div className="dash-container" style={{ height: "100%", width: "100%", background: "#050505", position: "relative", overflow: "hidden" }}>
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

            <main className="dash-main" style={{ overflowY: "auto", position: "relative", zIndex: 5, height: "100%" }}>
                <header className="dash-header" style={{ marginBottom: "100px", position: "relative" }}>
                    <div style={{ position: "absolute", top: "-40px", left: "0", width: "100px", height: "1px", background: "rgba(139,92,246,0.3)" }} />
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#8b5cf6", letterSpacing: "6px", marginBottom: "25px", textTransform: "uppercase", fontWeight: 800 }}>
                        SYSTEM_DASHBOARD_V1.0 // ACCESS_SECURED
                    </div>
                    <h1 style={{ fontSize: "6rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-5px", lineHeight: 0.8, color: "#fff", position: "relative" }}>
                        CAMPUS<br />
                        <span style={{
                            color: "transparent",
                            WebkitTextStroke: "1px rgba(255,255,255,0.15)",
                            position: "relative",
                            display: "inline-block"
                        }}>
                            CONNECT.
                            <div style={{ position: "absolute", right: "-40px", bottom: "20px", fontSize: "12px", color: "#8b5cf6", WebkitTextStroke: "0", letterSpacing: "2px", fontWeight: 800 }}>[EST_2024]</div>
                        </span>
                    </h1>
                </header>

                <div className="modes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "35px" }}>
                    {modes.map((m, i) => (
                        <div key={m.key} className="mode-card" style={{
                            background: "rgba(13,13,14,0.7)", padding: "45px", border: "1px solid rgba(255,255,255,0.06)",
                            position: "relative", transition: "0.5s cubic-bezier(0.23, 1, 0.32, 1)", backdropFilter: "blur(20px)",
                            overflow: "hidden",
                            clipPath: "polygon(35px 0, 100% 0, 100% calc(100% - 35px), calc(100% - 35px) 100%, 0 100%, 0 35px)"
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                                e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)";
                                e.currentTarget.style.background = "rgba(20,20,22,0.9)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0) scale(1)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                                e.currentTarget.style.background = "rgba(13,13,14,0.7)";
                            }}>
                            {/* Tactical Etched Border Effect */}
                            <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(139,92,246,0.1)", pointerEvents: "none", zIndex: 1 }} />

                            <div style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "#666", marginBottom: "15px", fontWeight: 800 }}>
                                <span style={{ color: "#8b5cf6" }}>[{i + 1}]</span> // NODE_ACCESS__{m.key}
                            </div>
                            <h3 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "15px", textTransform: "uppercase", letterSpacing: "-1.5px", color: "#fff" }}>{m.title}</h3>
                            <p className="mobile-hide" style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: 1.6, marginBottom: "35px", minHeight: "60px", fontFamily: "'Inter', sans-serif" }}>{m.desc}</p>

                            <button onClick={() => triggerMatch(m.key, m.title)} className="match-btn" style={{
                                border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#000", padding: "18px 30px",
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", fontWeight: 900,
                                width: "100%", textAlign: "left", cursor: "pointer", transition: "0.3s cubic-bezier(0.23, 1, 0.32, 1)",
                                textTransform: "uppercase", letterSpacing: "1.5px",
                                clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)"
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = "0 0 20px rgba(139,92,246,0.4)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; e.currentTarget.style.boxShadow = "none"; }}>
                                {btnStates[m.key]?.text || m.btnDefault}
                                <span style={{ float: "right", transform: "scale(1.2)" }}>→</span>
                            </button>
                        </div>
                    ))}
                </div>
            </main>

            <aside className="dash-sidebar" style={{ zIndex: 11 }}>
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

                .dash-container {
                    display: grid;
                    grid-template-columns: 1fr 390px;
                    background: #000;
                }
                .dash-main {
                    padding: 80px 60px;
                    background: #000;
                }
                .dash-sidebar {
                    background: #050506;
                    border-left: 2px solid #111;
                    padding: 60px 45px;
                    display: flex;
                    flex-direction: column;
                    backdrop-filter: blur(50px);
                    position: relative;
                    overflow-y: auto;
                }
                .dash-sidebar::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(139,92,246,0.02) 1.5px, transparent 1.5px),
                        linear-gradient(90deg, rgba(139,92,246,0.02) 1.5px, transparent 1.5px);
                    background-size: 40px 40px;
                    pointer-events: none;
                }

                @media (max-width: 768px) {
                    .dash-container {
                        grid-template-columns: 1fr !important;
                        overflow-y: auto !important;
                    }
                    .dash-sidebar {
                        display: none !important;
                    }
                    .dash-main {
                        padding: 24px 16px !important;
                        padding-bottom: 20px !important;
                    }
                    .dash-header {
                        margin-bottom: 40px !important;
                        text-align: center;
                    }
                    .dash-header h1 {
                        font-size: 3.2rem !important;
                        letter-spacing: -2px !important;
                        line-height: 0.8 !important;
                    }
                    .dash-header div {
                        font-size: 8px !important;
                        letter-spacing: 2px !important;
                    }
                    .modes-grid {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                    .mode-card {
                        padding: 24px !important;
                        border-radius: 20px !important;
                        background: rgba(20,20,20,0.6) !important;
                    }
                    .mode-card h3 {
                        font-size: 1.5rem !important;
                        margin-bottom: 12px !important;
                    }
                    .match-btn {
                        padding: 16px 20px !important;
                        border-radius: 12px !important;
                        clip-path: none !important;
                        background: #8b5cf6 !important;
                        color: #fff !important;
                        text-align: center !important;
                        font-size: 12px !important;
                        font-weight: 800 !important;
                    }
                }
            `}</style>
        </div>
    );
}
