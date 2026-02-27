"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

import DashboardView from "@/components/app-views/DashboardView";
import VideoMatchView from "@/components/app-views/VideoMatchView";
import ProfileView from "@/components/app-views/ProfileView";

export default function AppShell() {
    const { user, profile, loading, logout } = useAuth();
    const router = useRouter();
    const [currentView, setCurrentView] = useState("dashboard"); // dashboard, matching, profile
    const [selectedMode, setSelectedMode] = useState(null);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/");
        }
    }, [loading, user, router]);

    useEffect(() => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);

        // 1. Mark as online
        updateDoc(userRef, { isOnline: true }).catch(() => { });

        // 2. ABSOLUTE ENFORCEMENT: Listen for Admin Actions
        const unsub = onSnapshot(userRef, (snap) => {
            if (!snap.exists()) {
                // User deleted by admin
                handleLogout();
                return;
            }
            const data = snap.data();
            if (data.isOnline === false) {
                // Session killed by admin
                handleLogout();
                alert("SESSION_TERMINATED: Your access has been revoked by the Super Admin.");
            }
        });

        return () => {
            unsub();
            updateDoc(userRef, { isOnline: false }).catch(() => { });
        };
    }, [user]);

    const handleStartMatch = (mode) => {
        setSelectedMode(mode);
        setCurrentView("matching");
    };

    const handleLogout = async () => {
        if (user) await updateDoc(doc(db, "users", user.uid), { isOnline: false }).catch(() => { });
        await logout();
        router.replace("/");
    };

    const [broadcast, setBroadcast] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "system_config", "broadcast"), (snap) => {
            if (snap.exists()) setBroadcast(snap.data());
            else setBroadcast(null);
        });
        return () => unsub();
    }, []);

    if (loading || !user) {
        return (
            <div className="loader-screen">
                <div className="spinner" />
                <span>SECURE ACCESS INITIALIZING...</span>
                <style jsx>{`
                    .loader-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050505; color: #555; font-family: monospace; gap: 20px; }
                    .spinner { width: 40px; height: 40px; border: 2px solid #1a1a1a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className={`app-container ${currentView === 'matching' ? 'fullscreen-mode' : ''}`} style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr",
            height: "100vh",
            width: "100vw",
            background: "#050505",
            overflow: "hidden"
        }}>
            {/* Broadcast Overlay */}
            {broadcast && broadcast.active && (
                <div style={{
                    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
                    zIndex: 2000, background: "rgba(139,92,246,0.95)", color: "#fff",
                    padding: "15px 40px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", gap: "20px", width: "max-content", maxWidth: "80vw"
                }}>
                    <div style={{ fontSize: "10px", fontWeight: 900, background: "#000", padding: "4px 8px", borderRadius: "4px" }}>BROADCAST</div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{broadcast.message}</div>
                    <button
                        onClick={() => setBroadcast(null)}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontWeight: 900 }}
                    >×</button>
                </div>
            )}
            {/* Mobile Top Header (App Feel) */}
            {currentView !== "matching" && (
                <header className="mobile-header" style={{
                    position: "fixed", top: 0, left: 0, right: 0, height: "60px",
                    background: "rgba(10,10,10,0.8)", backdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)", zHeight: 1000,
                    display: "none", alignItems: "center", justifyContent: "space-between",
                    padding: "0 20px", zIndex: 1000
                }}>
                    <div style={{ fontWeight: 900, fontSize: "18px", letterSpacing: "-1px" }}>CAMPUS<span style={{ color: "#8b5cf6" }}>CONNECT</span></div>
                    <div onClick={() => setCurrentView("profile")} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                </header>
            )}

            {/* Minimal Sidebar for desktop / Bottom Nav for mobile */}
            {currentView !== "matching" && (
                <aside className="app-sidebar" style={{
                    borderRight: "1px solid #1a1a1a",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "40px 0",
                    background: "rgba(10,10,10,0.9)",
                    backdropFilter: "blur(20px)",
                    zIndex: 100
                }}>
                    <div className="logo-small" style={{
                        fontWeight: 900, fontSize: "20px", border: "2px solid #fff",
                        padding: "4px 6px", transform: "rotate(-5deg)", marginBottom: "60px", userSelect: "none"
                    }}>CC</div>

                    <nav className="sidebar-nav" style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "40px"
                    }}>
                        <button
                            onClick={() => setCurrentView("dashboard")}
                            className={`nav-item ${currentView === "dashboard" ? "active" : ""}`}
                            style={{
                                background: "none", border: "none",
                                color: currentView === "dashboard" ? "#8b5cf6" : "#444",
                                textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "10px", fontWeight: currentView === "dashboard" ? 900 : 400,
                                letterSpacing: "2px", writingMode: "vertical-rl", cursor: "pointer", transition: "0.3s",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: "8px"
                            }}
                        >
                            <span className="mobile-icon" style={{ display: "none" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </span>
                            <span className="nav-label">MATCH</span>
                        </button>

                        <button
                            onClick={() => setCurrentView("profile")}
                            className={`nav-item ${currentView === "profile" ? "active" : ""}`}
                            style={{
                                background: "none", border: "none",
                                color: currentView === "profile" ? "#8b5cf6" : "#444",
                                textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "10px", fontWeight: currentView === "profile" ? 900 : 400,
                                letterSpacing: "2px", writingMode: "vertical-rl", cursor: "pointer", transition: "0.3s",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: "8px"
                            }}
                        >
                            <span className="mobile-icon" style={{ display: "none" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                            </span>
                            <span className="nav-label">PROFILE</span>
                        </button>
                    </nav>

                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        style={{
                            color: "#ff4757", background: "none", border: "none",
                            fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                            letterSpacing: "1px", cursor: "pointer", fontWeight: 700
                        }}
                    >
                        <span className="mobile-icon" style={{ display: "none" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </span>
                        <span className="nav-label">LOGOUT</span>
                    </button>
                </aside>
            )}

            {/* View Render Area */}
            <main style={{ position: "relative", overflow: "hidden", height: "100%" }}>
                {currentView === "dashboard" && (
                    <DashboardView user={user} profile={profile} onStartMatch={handleStartMatch} />
                )}
                {currentView === "matching" && (
                    <VideoMatchView user={user} profile={profile} mode={selectedMode} onEnd={() => setCurrentView("dashboard")} />
                )}
                {currentView === "profile" && (
                    <ProfileView user={user} profile={profile} />
                )}
            </main>
            <style jsx>{`
                .loader-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050505; color: #555; font-family: monospace; gap: 20px; }
                .spinner { width: 40px; height: 40px; border: 2px solid #1a1a1a; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .app-container {
                        grid-template-columns: 1fr !important;
                        padding-top: 60px !important; /* Header space */
                        padding-bottom: 80px !important; /* Nav space */
                    }
                    .app-container.fullscreen-mode {
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                    }
                    .mobile-header {
                        display: flex !important;
                    }
                    .app-sidebar {
                        position: fixed !important;
                        bottom: 15px !important;
                        left: 15px !important;
                        right: 15px !important;
                        width: calc(100% - 30px) !important;
                        height: 65px !important;
                        flex-direction: row !important;
                        padding: 0 20px !important;
                        border-right: none !important;
                        border: 1px solid rgba(255,255,255,0.08) !important;
                        border-radius: 20px !important;
                        background: rgba(15,15,15,0.9) !important;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
                        justify-content: space-around !important;
                        z-index: 1000 !important;
                    }
                    .logo-small { display: none !important; }
                    .sidebar-nav {
                        flex-direction: row !important;
                        justify-content: space-around !important;
                        width: 100% !important;
                        gap: 0 !important;
                    }
                    .nav-item {
                        writing-mode: horizontal-tb !important;
                        font-size: 10px !important;
                        height: 100% !important;
                        flex: 1 !important;
                        opacity: 0.5;
                    }
                    .nav-item.active {
                        opacity: 1;
                        color: #8b5cf6 !important;
                    }
                    .mobile-icon {
                        display: block !important;
                    }
                    .nav-label {
                        font-size: 8px !important;
                        font-weight: 700 !important;
                    }
                    .logout-btn {
                        display: none !important; /* Move to profile or hide on mobile nav */
                    }
                }
            `}</style>
        </div>
    );
}
