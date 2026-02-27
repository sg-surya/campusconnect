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
        <div style={{
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
            {/* Minimal Sidebar for view switching */}
            <aside style={{
                borderRight: "1px solid #1a1a1a",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "40px 0",
                background: "rgba(10,10,10,0.9)",
                backdropFilter: "blur(20px)",
                zIndex: 100
            }}>
                <div style={{
                    fontWeight: 900,
                    fontSize: "20px",
                    border: "2px solid #fff",
                    padding: "4px 6px",
                    transform: "rotate(-5deg)",
                    marginBottom: "60px",
                    userSelect: "none"
                }}>CC</div>

                <nav style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "40px"
                }}>
                    <button
                        onClick={() => setCurrentView("dashboard")}
                        style={{
                            background: "none", border: "none",
                            color: currentView === "dashboard" ? "#8b5cf6" : "#444",
                            textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "10px", fontWeight: currentView === "dashboard" ? 900 : 400,
                            letterSpacing: "2px", writingMode: "vertical-rl", cursor: "pointer", transition: "0.3s"
                        }}
                    >MATCH</button>

                    <button
                        onClick={() => setCurrentView("profile")}
                        style={{
                            background: "none", border: "none",
                            color: currentView === "profile" ? "#8b5cf6" : "#444",
                            textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "10px", fontWeight: currentView === "profile" ? 900 : 400,
                            letterSpacing: "2px", writingMode: "vertical-rl", cursor: "pointer", transition: "0.3s"
                        }}
                    >PROFILE</button>

                    <button
                        onClick={() => { /* Possible History or other views */ }}
                        style={{
                            background: "none", border: "none",
                            color: "#222",
                            textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "10px", letterSpacing: "2px", writingMode: "vertical-rl", cursor: "not-allowed"
                        }}
                    >HISTORY</button>
                </nav>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                    style={{
                        color: "#ff4757", background: "none", border: "none",
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                        letterSpacing: "1px", cursor: "pointer", fontWeight: 700
                    }}
                >LOGOUT</button>
            </aside>

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
        </div>
    );
}
