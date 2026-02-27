"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("Awaiting credentials...");
    const gridRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        router.replace("/");
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("Verifying identity...");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Mark user as online in Firestore
            try {
                await updateDoc(doc(db, "users", userCredential.user.uid), {
                    isOnline: true,
                    lastLogin: new Date(),
                });
            } catch (err) {
                // Profile may not exist yet, that's ok
                console.log("Could not update online status:", err);
            }

            setStatus("Access granted. Redirecting...");
            setTimeout(() => router.push("/dashboard"), 800);
        } catch (err) {
            setLoading(false);
            if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                setStatus("Invalid email or password. Try again.");
            } else if (err.code === "auth/wrong-password") {
                setStatus("Wrong password. Try again.");
            } else if (err.code === "auth/too-many-requests") {
                setStatus("Too many attempts. Try again later.");
            } else {
                setStatus("Login failed: " + err.message);
            }
        }
    };

    const navItems = ["Home", "Features", "Modes", "Safety"];

    return (
        <>
            {/* Grain */}
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, opacity: 0.04,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            {/* Grid canvas */}
            <div ref={gridRef} style={{
                position: "fixed", inset: 0, zIndex: -1,
                backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
                backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
            }} />

            <div style={{ display: "flex", height: "100vh", width: "100vw" }}>

                {/* ── Sidebar ── */}
                <aside style={{
                    width: "80px", flexShrink: 0, borderRight: "1px solid #242424",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "28px 0", background: "rgba(10,10,10,0.85)",
                    backdropFilter: "blur(12px)", position: "sticky", top: 0, height: "100vh",
                }}>
                    <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{
                            fontWeight: 900, fontSize: "22px", letterSpacing: "-2px",
                            border: "2px solid #e0e0e0", padding: "4px 6px",
                            transform: "rotate(-5deg)", marginBottom: "50px", userSelect: "none",
                        }}>CC</div>
                    </Link>
                    <nav style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        {navItems.map((item, i) => (
                            <Link key={item} href={i === 0 ? "/" : `/#${item.toLowerCase()}`} style={{
                                margin: "18px 0", writingMode: "vertical-rl", textTransform: "uppercase",
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "2px",
                                color: "#555", textDecoration: "none", transition: "color 0.3s",
                            }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#e0e0e0")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                            >{item}</Link>
                        ))}
                    </nav>
                    <div style={{ marginTop: "auto", marginBottom: "12px", width: "6px", height: "6px", borderRadius: "50%", background: "#00ff66", boxShadow: "0 0 8px rgba(0,255,102,0.5)" }} />
                </aside>

                {/* ── Main ── */}
                <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                    {/* Header */}
                    <header style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0 48px", height: "72px", borderBottom: "1px solid #1a1a1a",
                        background: "rgba(10,10,10,0.7)", backdropFilter: "blur(12px)",
                        flexShrink: 0,
                    }}>
                        <span style={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "-0.5px", fontStyle: "italic" }}>
                            CampusConnect
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                                Already logging in
                            </span>
                            <Link href="/signup">
                                <button style={{
                                    background: "transparent", color: "#e0e0e0", fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                                    textTransform: "uppercase", letterSpacing: "1px",
                                    padding: "9px 18px", border: "1px solid #333",
                                    cursor: "pointer", transition: "all 0.3s",
                                }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#fff"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#e0e0e0"; }}
                                >Sign Up Instead</button>
                            </Link>
                        </div>
                    </header>

                    {/* Content */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px" }}>
                        <div style={{ width: "100%", maxWidth: "440px" }}>

                            {/* Title block */}
                            <div style={{ marginBottom: "40px" }}>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: "16px" }}>
                                    01 / Authentication
                                </div>
                                <h1 style={{ fontSize: "2.8rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px", lineHeight: 0.9, marginBottom: "12px" }}>
                                    Log In.
                                </h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: 1.6 }}>
                                    Welcome back. Your verified network is waiting.
                                </p>
                            </div>

                            {/* Form card */}
                            <div style={{
                                background: "#1a1a1c",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.6), 10px 10px 30px rgba(0,0,0,0.5)",
                                padding: "36px",
                                position: "relative",
                            }}>
                                {/* Corner bracket */}
                                <div style={{ position: "absolute", top: "-1px", left: "-1px", width: "16px", height: "16px", borderTop: "2px solid #8b5cf6", borderLeft: "2px solid #8b5cf6" }} />
                                <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "16px", height: "16px", borderBottom: "2px solid #8b5cf6", borderRight: "2px solid #8b5cf6" }} />

                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    {/* Email */}
                                    <div>
                                        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "8px" }}>
                                            College Email
                                        </label>
                                        <input
                                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@college.edu"
                                            required
                                            style={{
                                                width: "100%", padding: "12px 14px",
                                                background: "rgba(0,0,0,0.3)",
                                                boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                color: "#e0e0e0", fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: "12px", outline: "none", transition: "border-color 0.3s",
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                                            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "8px" }}>
                                            Password
                                        </label>
                                        <input
                                            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            style={{
                                                width: "100%", padding: "12px 14px",
                                                background: "rgba(0,0,0,0.3)",
                                                boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)",
                                                border: "1px solid rgba(255,255,255,0.08)",
                                                color: "#e0e0e0", fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: "12px", outline: "none", transition: "border-color 0.3s",
                                            }}
                                            onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                                            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                                        />
                                    </div>

                                    {/* Forgot */}
                                    <div style={{ textAlign: "right", marginTop: "-8px" }}>
                                        <a href="#" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", textDecoration: "none", transition: "color 0.3s" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                                        >Forgot Password?</a>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            width: "100%", padding: "14px",
                                            background: loading ? "rgba(139,92,246,0.5)" : "white",
                                            color: loading ? "#e0e0e0" : "black",
                                            fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px",
                                            border: "none", cursor: loading ? "not-allowed" : "pointer",
                                            clipPath: "polygon(4% 0, 100% 0, 100% 75%, 96% 100%, 0 100%, 0 25%)",
                                            transition: "all 0.3s",
                                            marginTop: "4px",
                                        }}
                                        onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; } }}
                                        onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; } }}
                                    >
                                        {loading ? "Verifying..." : "Log In →"}
                                    </button>
                                </form>
                            </div>

                            {/* Status ticker */}
                            <div style={{ marginTop: "20px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: loading ? "#007aff" : "rgba(255,255,255,0.2)" }}>
                                › {status}
                            </div>

                            {/* Sign up link */}
                            <div style={{ marginTop: "28px", textAlign: "center" }}>
                                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>No account? </span>
                                <Link href="/signup" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#a78bfa", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Create one →
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                {/* ── Right info panel ── */}
                <aside style={{
                    width: "300px", flexShrink: 0, borderLeft: "1px solid #242424",
                    background: "rgba(10,10,10,0.9)", padding: "0 28px",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                    <div style={{ marginBottom: "36px" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.2em", borderBottom: "1px solid #242424", paddingBottom: "10px", marginBottom: "20px" }}>
                            Why Log In
                        </div>
                        {[
                            { icon: "✅", text: "Access your verified profile" },
                            { icon: "🎲", text: "Start matching with students" },
                            { icon: "💬", text: "Continue your conversations" },
                            { icon: "🔒", text: "Secure and encrypted" },
                        ].map((item) => (
                            <div key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                                <span style={{ fontSize: "14px", flexShrink: 0 }}>{item.icon}</span>
                                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: "rgba(0,0,0,0.2)",
                        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)",
                        padding: "20px", marginBottom: "28px",
                    }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "6px" }}>
                            Students Online Now
                        </div>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>Live</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#4ade80", marginTop: "4px" }}>
                            ● Live matches happening
                        </div>
                    </div>

                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", lineHeight: 1.8 }}>
                        › CampusConnect v1.0<br />
                        › Encrypted · Verified · Safe
                    </div>
                </aside>
            </div>

            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; cursor: crosshair; }
        body { background: #0a0a0b; color: #e2e2e2; font-family: 'Inter', sans-serif; overflow: hidden; -webkit-font-smoothing: antialiased; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #242424; }
        @media (max-width: 960px) { aside:last-of-type { display: none !important; } }
        @media (max-width: 640px) { aside:first-of-type { width: 56px !important; } header { padding: 0 20px !important; } }
      `}</style>
        </>
    );
}
