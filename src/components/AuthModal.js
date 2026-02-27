"use client";

import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getCollegeNameFromEmail } from "@/lib/collegeDomains";
import Link from "next/link";

export default function AuthModal({ isOpen, onClose, initialMode = "login", onSuccess }) {
    const [mode, setMode] = useState(initialMode); // login, signup
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [form, setForm] = useState({ name: "", gender: "Male", college: "", branch: "", year: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        setMode(initialMode);
        setStep(1);
        setStatus("");
    }, [initialMode, isOpen]);

    useEffect(() => {
        if (mode === "signup" && email.includes("@")) {
            const college = getCollegeNameFromEmail(email);
            if (college) updateForm("college", college);
        }
    }, [email, mode]);

    useEffect(() => {
        if (resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendTimer]);

    const updateForm = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("Verifying credentials...");
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await updateDoc(doc(db, "users", userCredential.user.uid), {
                isOnline: true,
                lastLogin: new Date(),
            }).catch(() => { });
            setStatus("Success! Redirecting...");
            onSuccess?.();
            onClose();
        } catch (err) {
            setLoading(false);
            setStatus(err.message);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setStatus("Enter your email address first.");
            return;
        }
        setLoading(true);
        setStatus("Initiating reset pulse...");
        try {
            await sendPasswordResetEmail(auth, email);
            setStatus("Reset link transmitted. Check your inbox.");
            setLoading(false);
            setTimeout(() => setMode("login"), 3000);
        } catch (err) {
            setLoading(false);
            setStatus(err.message);
        }
    };

    const sendOtp = async () => {
        if (!email) {
            setStatus("Enter your email first.");
            return;
        }
        setOtpLoading(true);
        setStatus("Sending verification code...");
        try {
            const res = await fetch("/api/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setOtpSent(true);
                setResendTimer(60);
                setStatus("Code sent! Check your email.");
            } else {
                const data = await res.json();
                setStatus(data.error || "Failed to send code.");
            }
        } catch (err) {
            setStatus("Error sending OTP.");
        }
        setOtpLoading(false);
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[value.length - 1];
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otpCode];
        newOtp[index] = value;
        setOtpCode(newOtp);
        if (value && index < 5) otpRefs[index + 1].current?.focus();
        if (newOtp.every(d => d !== "")) verifyOtp(newOtp.join(""));
    };

    const verifyOtp = async (code) => {
        setOtpLoading(true);
        setStatus("Verifying...");
        try {
            const res = await fetch("/api/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: code }),
            });
            if (res.ok) {
                setOtpVerified(true);
                setStatus("Verified ✓");
                setTimeout(() => setStep(2), 600);
            } else {
                setStatus("Invalid code.");
                setOtpCode(["", "", "", "", "", ""]);
                otpRefs[0].current?.focus();
            }
        } catch (err) { setStatus("Verification failed."); }
        setOtpLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (step === 1) {
            if (!otpVerified) {
                if (!otpSent) sendOtp();
                else setStatus("Verify your email first.");
                return;
            }
            setStep(2);
            return;
        }
        if (step === 2) {
            setStep(3);
            return;
        }
        if (step === 3) {
            if (password !== form.confirmPassword) {
                setStatus("Passwords don't match.");
                return;
            }
            setLoading(true);
            setStatus("Creating account...");
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    name: form.name,
                    email,
                    gender: form.gender,
                    college: form.college,
                    branch: form.branch,
                    year: form.year,
                    emailVerified: true,
                    createdAt: serverTimestamp(),
                    bio: "",
                    interests: [],
                    karma: 100,
                    isOnline: true,
                });
                onSuccess?.();
                onClose();
            } catch (err) {
                setLoading(false);
                setStatus(err.message);
            }
        }
    };

    if (!isOpen) return null;

    const navBtnStyle = (active) => ({
        background: "none",
        border: "none",
        color: active ? "#fff" : "#444",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1px",
        fontSize: "11px",
        cursor: "pointer",
        transition: "0.3s",
        position: "relative",
        paddingBottom: "8px",
        borderBottom: active ? "2px solid #8b5cf6" : "2px solid transparent"
    });

    const labelStyle = {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        display: "block",
        marginBottom: "8px"
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 14px",
        background: "rgba(0,0,0,0.3)",
        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#e0e0e0",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        outline: "none",
        transition: "border-color 0.3s"
    };

    const btnMonolithStyle = (disabled, isBack = false) => ({
        width: isBack ? "60px" : "100%",
        height: "50px",
        padding: "14px",
        background: isBack ? "transparent" : (disabled ? "rgba(139,92,246,0.5)" : "white"),
        color: isBack ? "#fff" : (disabled ? "#e0e0e0" : "black"),
        fontWeight: 900,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "1px",
        border: isBack ? "1px solid #333" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        clipPath: isBack ? "none" : "polygon(5% 0, 100% 0, 100% 75%, 95% 100%, 0 100%, 0 25%)",
        transition: "all 0.3s",
        marginTop: "4px"
    });

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            {/* Grain Overlay */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.04,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }} onClick={onClose} />

            <div style={{
                width: "100%",
                maxWidth: "460px",
                background: "#0a0a0b",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "48px",
                position: "relative",
                zIndex: 2,
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                overflow: "hidden"
            }}>
                {/* Visual Grid for interior */}
                <div style={{
                    position: "absolute", inset: 0, zIndex: -1, opacity: 0.2,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }} />

                <button style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#444", fontSize: "24px", cursor: "pointer" }} onClick={onClose}>×</button>

                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                    <div style={{ display: "flex", gap: "24px" }}>
                        <button style={navBtnStyle(mode === "login" || mode === "forgot-password")} onClick={() => { setMode("login"); setStatus(""); }}>Login</button>
                        <button style={navBtnStyle(mode === "signup")} onClick={() => { setMode("signup"); setStatus(""); }}>Signup</button>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: "14px", border: "1.5px solid #fff", padding: "2px 6px", transform: "rotate(-5deg)" }}>CC</div>
                </header>

                <div className="content-area">
                    {mode === "login" ? (
                        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div>
                                <h1 style={{ fontSize: "2.4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-2px", lineHeight: 0.9, marginBottom: "8px" }}>Log In.</h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Access your verified campus network.</p>
                            </div>

                            <div style={{ background: "#1a1a1c", border: "1px solid rgba(255,255,255,0.08)", padding: "30px", position: "relative", boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.05)" }}>
                                <div style={{ position: "absolute", top: "-1px", left: "-1px", width: "12px", height: "12px", borderTop: "2px solid #8b5cf6", borderLeft: "2px solid #8b5cf6" }} />
                                <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "12px", height: "12px", borderBottom: "2px solid #8b5cf6", borderRight: "2px solid #8b5cf6" }} />

                                <div style={{ marginBottom: "20px" }}>
                                    <label style={labelStyle}>College Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@college.edu" style={inputStyle} required />
                                </div>
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={labelStyle}>Secret Key</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} required />
                                </div>

                                <button type="submit" style={btnMonolithStyle(loading)} disabled={loading}
                                    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; } }}
                                    onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; } }}
                                >
                                    {loading ? "Decrypting..." : "Enter App →"}
                                </button>

                                <div style={{ textAlign: "center", marginTop: "16px" }}>
                                    <button type="button" onClick={() => setMode("forgot-password")} style={{ background: "none", border: "none", color: "#666", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", textDecoration: "underline" }}>
                                        Forgotten Access Key?
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : mode === "forgot-password" ? (
                        <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div>
                                <h1 style={{ fontSize: "2.4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-2px", lineHeight: 0.9, marginBottom: "8px" }}>Reset.</h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Recover your campus identity access.</p>
                            </div>

                            <div style={{ background: "#1a1a1c", border: "1px solid rgba(255,255,255,0.08)", padding: "30px", position: "relative" }}>
                                <div style={{ position: "absolute", top: "-1px", left: "-1px", width: "12px", height: "12px", borderTop: "2px solid #8b5cf6", borderLeft: "2px solid #8b5cf6" }} />
                                <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "12px", height: "12px", borderBottom: "2px solid #8b5cf6", borderRight: "2px solid #8b5cf6" }} />

                                <div style={{ marginBottom: "20px" }}>
                                    <label style={labelStyle}>College Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@college.edu" style={inputStyle} required />
                                </div>

                                <button type="submit" style={btnMonolithStyle(loading)} disabled={loading}
                                    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; } }}
                                    onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; } }}
                                >
                                    {loading ? "Transmitting..." : "Send Reset Link →"}
                                </button>

                                <div style={{ textAlign: "center", marginTop: "16px" }}>
                                    <button type="button" onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "#666", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", textDecoration: "underline" }}>
                                        Back to Login
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
                                    STEP 0{step} / 03
                                </div>
                                <h1 style={{ fontSize: "2.4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-2px", lineHeight: 0.9, marginBottom: "8px" }}>
                                    {step === 1 ? "Verify." : step === 2 ? "Profile." : "Secure."}
                                </h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                                    {step === 1 ? "Start with your identity." : step === 2 ? "Tell us where you study." : "Set your private access key."}
                                </p>
                            </div>

                            <div style={{ background: "#1a1a1c", border: "1px solid rgba(255,255,255,0.08)", padding: "30px", position: "relative", minHeight: "260px" }}>
                                <div style={{ position: "absolute", top: "-1px", left: "-1px", width: "12px", height: "12px", borderTop: "2px solid #8b5cf6", borderLeft: "2px solid #8b5cf6" }} />
                                <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "12px", height: "12px", borderBottom: "2px solid #8b5cf6", borderRight: "2px solid #8b5cf6" }} />

                                {step === 1 && (
                                    <>
                                        {!otpSent ? (
                                            <>
                                                <div style={{ marginBottom: "16px" }}>
                                                    <label style={labelStyle}>Full Name</label>
                                                    <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="Aryan S." style={inputStyle} required />
                                                </div>
                                                <div style={{ marginBottom: "16px" }}>
                                                    <label style={labelStyle}>College Email (OTP Required)</label>
                                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" style={inputStyle} required />
                                                </div>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    {["Male", "Female", "Other"].map(g => (
                                                        <button key={g} type="button" onClick={() => updateForm("gender", g)} style={{
                                                            flex: 1, padding: "10px", background: form.gender === g ? "rgba(139,92,246,0.1)" : "rgba(0,0,0,0.2)",
                                                            border: `1px solid ${form.gender === g ? "#8b5cf6" : "rgba(255,255,255,0.08)"}`, color: form.gender === g ? "#fff" : "#555",
                                                            fontSize: "10px", textTransform: "uppercase", cursor: "pointer", transition: "0.3s", fontFamily: "'JetBrains Mono', monospace"
                                                        }}>{g}</button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : !otpVerified ? (
                                            <div style={{ textAlign: "center", padding: "10px 0" }}>
                                                <label style={{ ...labelStyle, textAlign: "center", marginBottom: "20px" }}>Enter 6-Digit Code</label>
                                                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
                                                    {otpCode.map((d, i) => (
                                                        <input key={i} ref={otpRefs[i]} type="text" maxLength={1} value={d}
                                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                                            onKeyDown={(e) => e.key === "Backspace" && !d && i > 0 && otpRefs[i - 1].current.focus()}
                                                            style={{ width: "45px", height: "55px", textAlign: "center", fontSize: "24px", fontWeight: 900, background: "rgba(0,0,0,0.4)", border: "1px solid #333", color: "#fff", outline: "none", borderColor: d ? "#8b5cf6" : "#333" }}
                                                        />
                                                    ))}
                                                </div>
                                                <button type="button" disabled={resendTimer > 0} onClick={sendOtp} style={{ background: "none", border: "none", color: "#666", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", textDecoration: "underline" }}>
                                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Verification Code"}
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px" }}>
                                                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(0,255,102,0.1)", border: "2px solid #00ff66", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ff66", fontSize: "30px", marginBottom: "15px" }}>✓</div>
                                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>IDENTITY VERIFIED</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <div style={{ marginBottom: "16px" }}>
                                            <label style={labelStyle}>Institution Name</label>
                                            <input value={form.college} onChange={(e) => updateForm("college", e.target.value)} placeholder="IIT Bombay" style={inputStyle} required />
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                                            <div>
                                                <label style={labelStyle}>Major / Branch</label>
                                                <input value={form.branch} onChange={(e) => updateForm("branch", e.target.value)} placeholder="B.Tech CS" style={inputStyle} required />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Year</label>
                                                <select value={form.year} onChange={(e) => updateForm("year", e.target.value)} style={inputStyle} required>
                                                    <option value="">Select</option>
                                                    <option value="1">1st Year</option>
                                                    <option value="2">2nd Year</option>
                                                    <option value="3">3rd Year</option>
                                                    <option value="4">4th Year</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step === 3 && (
                                    <>
                                        <div style={{ marginBottom: "16px" }}>
                                            <label style={labelStyle}>Master Password</label>
                                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} required />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Confirm Access Key</label>
                                            <input type="password" value={form.confirmPassword} onChange={(e) => updateForm("confirmPassword", e.target.value)} placeholder="••••••••" style={inputStyle} required />
                                        </div>
                                    </>
                                )}

                                <div style={{ display: "flex", gap: "12px", marginTop: "30px" }}>
                                    {step > 1 && <button type="button" onClick={() => setStep(step - 1)} style={btnMonolithStyle(false, true)}>BACK</button>}
                                    <button type="submit" style={btnMonolithStyle(loading || (step === 1 && otpSent && !otpVerified))} disabled={loading || (step === 1 && otpSent && !otpVerified)}
                                        onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; } }}
                                        onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; } }}
                                    >
                                        {loading ? "Syncing..." : step === 1 && !otpSent ? "Verify Email" : step < 3 ? "Next Step →" : "Finalize Account"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {status && (
                    <div style={{ marginTop: "24px", padding: "12px", background: "rgba(139,92,246,0.05)", borderLeft: "2px solid #8b5cf6", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#8b5cf6" }}>
                        › {status.toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    );
}
