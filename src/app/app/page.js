"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
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
        updateDoc(userRef, { isOnline: true }).catch(() => { });
        return () => {
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
