"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignupPage() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: "", email: "", college: "", branch: "", year: "", password: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("Fill in your details to begin.");
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const gridRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const move = (e) => {
            if (!gridRef.current) return;
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            gridRef.current.style.backgroundPosition = `${x * 0.1}px ${y * 0.1}px`;
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendTimer]);

    const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

    // Send OTP to email
    const sendOtp = async () => {
        if (!form.email) {
            setStatus("Please enter your email first.");
            return;
        }
        setOtpLoading(true);
        setStatus("Sending verification code...");
        try {
            const res = await fetch("/api/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                setResendTimer(60);
                setStatus("Verification code sent! Check your email.");
            } else {
                setStatus(data.error || "Failed to send code.");
            }
        } catch (err) {
            setStatus("Network error. Try again.");
        }
        setOtpLoading(false);
    };

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[value.length - 1];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otpCode];
        newOtp[index] = value;
        setOtpCode(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs[index + 1].current?.focus();
        }

        // Auto-verify when all 6 digits entered
        if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
            verifyOtp(newOtp.join(""));
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpCode[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    // Verify OTP
    const verifyOtp = async (code) => {
        setOtpLoading(true);
        setStatus("Verifying code...");
        try {
            const res = await fetch("/api/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, otp: code }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpVerified(true);
                setStatus("Email verified ✓ Now enter your academic details.");
                // Move to step 2
                setTimeout(() => setStep(2), 800);
            } else {
                setStatus(data.error || "Invalid code. Try again.");
                setOtpCode(["", "", "", "", "", ""]);
                otpRefs[0].current?.focus();
            }
        } catch (err) {
            setStatus("Verification failed. Try again.");
        }
        setOtpLoading(false);
    };

    const nextStep = async (e) => {
        e.preventDefault();

        // Step 1: Must verify email first
        if (step === 1) {
            if (!otpVerified) {
                if (!otpSent) {
                    sendOtp();
                } else {
                    setStatus("Please verify your email first.");
                }
                return;
            }
            setStep(2);
            setStatus("Great! Now your academic details.");
            return;
        }

        // Step 2 -> Step 3
        if (step === 2) {
            setStep(3);
            setStatus("Almost there — set your password.");
            return;
        }

        // Step 3: Create account
        if (step === 3) {
            if (form.password !== form.confirmPassword) {
                setStatus("Passwords don't match. Try again.");
                return;
            }
            if (form.password.length < 6) {
                setStatus("Password must be at least 6 characters.");
                return;
            }

            setLoading(true);
            setStatus("Creating your account...");

            try {
                // Create Firebase Auth user
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    form.email,
                    form.password
                );
                const user = userCredential.user;

                // Save profile to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    name: form.name,
                    email: form.email,
                    college: form.college,
                    branch: form.branch,
                    year: form.year,
                    emailVerified: true,
                    createdAt: serverTimestamp(),
                    bio: "",
                    interests: [],
                    isOnline: true,
                });

                setStatus("Account created! Redirecting...");
                setTimeout(() => router.push("/dashboard"), 1000);
            } catch (err) {
                setLoading(false);
                if (err.code === "auth/email-already-in-use") {
                    setStatus("This email is already registered. Try logging in.");
                } else if (err.code === "auth/weak-password") {
                    setStatus("Password is too weak. Use at least 6 characters.");
                } else {
                    setStatus("Sign up failed: " + err.message);
                }
            }
        }
    };

    const navItems = ["Home", "Features", "Modes", "Safety"];

    const inputStyle = {
        width: "100%", padding: "12px 14px",
        background: "rgba(0,0,0,0.3)",
        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#e0e0e0", fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px", outline: "none", transition: "border-color 0.3s",
    };

    const labelStyle = {
        fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
        color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
        letterSpacing: "0.15em", display: "block", marginBottom: "8px",
    };

    const handleFocus = (e) => (e.target.style.borderColor = "#8b5cf6");
    const handleBlur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)");

    // Total steps now 4: 1=Info+OTP, 2=College, 3=Password
    const totalSteps = 3;

    return (
        <>
            {/* Grain */}
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, opacity: 0.04,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }} />

            {/* Grid */}
            <div ref={gridRef} style={{
                position: "fixed", inset: 0, zIndex: -1,
                backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
                backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
            }} />

            <div style={{ display: "flex", height: "100vh", maxWidth: "1600px", margin: "0 auto", borderLeft: "1px solid #242424", borderRight: "1px solid #242424" }}>

                {/* ── Sidebar ── */}
                <aside style={{
                    width: "80px", flexShrink: 0, borderRight: "1px solid #242424",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "28px 0", background: "rgba(10,10,10,0.85)",
                    backdropFilter: "blur(12px)",
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
                <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Header */}
                    <header style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0 48px", height: "72px", borderBottom: "1px solid #1a1a1a",
                        background: "rgba(10,10,10,0.7)", backdropFilter: "blur(12px)", flexShrink: 0,
                    }}>
                        <span style={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "-0.5px", fontStyle: "italic" }}>
                            CampusConnect
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                                Creating Account
                            </span>
                            <Link href="/login">
                                <button style={{
                                    background: "transparent", color: "#e0e0e0", fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                                    textTransform: "uppercase", letterSpacing: "1px",
                                    padding: "9px 18px", border: "1px solid #333",
                                    cursor: "pointer", transition: "all 0.3s",
                                }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#fff"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#e0e0e0"; }}
                                >Log In Instead</button>
                            </Link>
                        </div>
                    </header>

                    {/* Content */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", overflowY: "auto" }}>
                        <div style={{ width: "100%", maxWidth: "480px" }}>

                            {/* Title */}
                            <div style={{ marginBottom: "32px" }}>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: "16px" }}>
                                    02 / Registration — Step {step} of {totalSteps}
                                </div>
                                <h1 style={{ fontSize: "2.8rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px", lineHeight: 0.9, marginBottom: "12px" }}>
                                    {step === 1 ? (otpSent && !otpVerified ? "Verify." : "Sign Up.") : step === 2 ? "Your College." : "Secure It."}
                                </h1>
                                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: 1.6 }}>
                                    {step === 1
                                        ? (otpSent && !otpVerified
                                            ? `We sent a 6-digit code to ${form.email}`
                                            : "Join 15,000+ verified students.")
                                        : step === 2 ? "We need this to verify you." : "Set a strong password."}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div style={{ display: "flex", gap: "4px", marginBottom: "28px" }}>
                                {[1, 2, 3].map((s) => (
                                    <div key={s} style={{
                                        flex: 1, height: "3px",
                                        background: s <= step ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                                        transition: "background 0.4s",
                                    }} />
                                ))}
                            </div>

                            {/* Form card */}
                            <div style={{
                                background: "#1a1a1c",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.6), 10px 10px 30px rgba(0,0,0,0.5)",
                                padding: "36px", position: "relative",
                            }}>
                                {/* Corner brackets */}
                                <div style={{ position: "absolute", top: "-1px", left: "-1px", width: "16px", height: "16px", borderTop: "2px solid #8b5cf6", borderLeft: "2px solid #8b5cf6" }} />
                                <div style={{ position: "absolute", bottom: "-1px", right: "-1px", width: "16px", height: "16px", borderBottom: "2px solid #8b5cf6", borderRight: "2px solid #8b5cf6" }} />

                                <form onSubmit={nextStep} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                                    {/* STEP 1 — Name & Email + OTP */}
                                    {step === 1 && !otpSent && (
                                        <>
                                            <div>
                                                <label style={labelStyle}>Full Name</label>
                                                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
                                                    placeholder="Aryan Sharma" required
                                                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>College Email</label>
                                                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                                                    placeholder="you@college.edu" required
                                                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* OTP Verification UI */}
                                    {step === 1 && otpSent && !otpVerified && (
                                        <div>
                                            <label style={labelStyle}>Enter 6-Digit Code</label>
                                            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                                                {otpCode.map((digit, i) => (
                                                    <input
                                                        key={i}
                                                        ref={otpRefs[i]}
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={1}
                                                        value={digit}
                                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                        style={{
                                                            ...inputStyle,
                                                            width: "48px", height: "56px",
                                                            textAlign: "center", fontSize: "20px",
                                                            fontWeight: 700, padding: "0",
                                                            borderColor: digit ? "#8b5cf6" : "rgba(255,255,255,0.08)",
                                                        }}
                                                        onFocus={handleFocus}
                                                        onBlur={(e) => {
                                                            if (!digit) e.target.style.borderColor = "rgba(255,255,255,0.08)";
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            {/* Resend button */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>
                                                    Didn't receive it?
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={resendTimer > 0 || otpLoading}
                                                    onClick={sendOtp}
                                                    style={{
                                                        background: "transparent", border: "1px solid #333",
                                                        color: resendTimer > 0 ? "#555" : "#a78bfa",
                                                        fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                                                        padding: "6px 12px", cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                                                        textTransform: "uppercase", transition: "all 0.3s",
                                                    }}
                                                >
                                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email verified badge */}
                                    {step === 1 && otpVerified && (
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: "12px",
                                            padding: "16px", background: "rgba(0,255,102,0.05)",
                                            border: "1px solid rgba(0,255,102,0.2)",
                                        }}>
                                            <div style={{
                                                width: "32px", height: "32px", borderRadius: "50%",
                                                background: "rgba(0,255,102,0.15)", display: "flex",
                                                alignItems: "center", justifyContent: "center", fontSize: "16px",
                                            }}>✓</div>
                                            <div>
                                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#4ade80" }}>Email Verified</div>
                                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{form.email}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2 — College Details */}
                                    {step === 2 && (
                                        <>
                                            <div>
                                                <label style={labelStyle}>College Name</label>
                                                <input type="text" value={form.college} onChange={(e) => update("college", e.target.value)}
                                                    placeholder="IIT Delhi" required
                                                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                <div>
                                                    <label style={labelStyle}>Branch</label>
                                                    <input type="text" value={form.branch} onChange={(e) => update("branch", e.target.value)}
                                                        placeholder="CSE" required
                                                        style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>Year</label>
                                                    <select value={form.year} onChange={(e) => update("year", e.target.value)} required
                                                        style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}
                                                        onFocus={handleFocus} onBlur={handleBlur}
                                                    >
                                                        <option value="" style={{ background: "#1a1a1c", color: "#888" }}>Select</option>
                                                        <option value="1" style={{ background: "#1a1a1c" }}>1st Year</option>
                                                        <option value="2" style={{ background: "#1a1a1c" }}>2nd Year</option>
                                                        <option value="3" style={{ background: "#1a1a1c" }}>3rd Year</option>
                                                        <option value="4" style={{ background: "#1a1a1c" }}>4th Year</option>
                                                        <option value="5" style={{ background: "#1a1a1c" }}>5th Year</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* STEP 3 — Password */}
                                    {step === 3 && (
                                        <>
                                            <div>
                                                <label style={labelStyle}>Password</label>
                                                <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)}
                                                    placeholder="••••••••" required minLength={6}
                                                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Confirm Password</label>
                                                <input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)}
                                                    placeholder="••••••••" required minLength={6}
                                                    style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Buttons Row */}
                                    <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                        {step > 1 && (
                                            <button type="button" onClick={() => setStep(step - 1)}
                                                style={{
                                                    padding: "14px 20px", background: "transparent",
                                                    border: "1px solid #333", color: "#888",
                                                    fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                                                    textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s",
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#e0e0e0"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#888"; }}
                                            >← Back</button>
                                        )}
                                        {/* Hide main button when showing OTP input */}
                                        {!(step === 1 && otpSent && !otpVerified) && (
                                            <button type="submit" disabled={loading || otpLoading}
                                                style={{
                                                    flex: 1, padding: "14px",
                                                    background: (loading || otpLoading) ? "rgba(139,92,246,0.5)" : "white",
                                                    color: (loading || otpLoading) ? "#e0e0e0" : "black",
                                                    fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                                                    fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px",
                                                    border: "none", cursor: (loading || otpLoading) ? "not-allowed" : "pointer",
                                                    clipPath: "polygon(4% 0, 100% 0, 100% 75%, 96% 100%, 0 100%, 0 25%)",
                                                    transition: "all 0.3s",
                                                }}
                                                onMouseEnter={(e) => { if (!loading && !otpLoading) { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; } }}
                                                onMouseLeave={(e) => { if (!loading && !otpLoading) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; } }}
                                            >
                                                {loading ? "Creating..." : otpLoading ? "Sending..." : step === 1 && !otpSent ? "Verify Email →" : step < 3 ? "Continue →" : "Create Account →"}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Status */}
                            <div style={{ marginTop: "20px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: (loading || otpLoading) ? "#007aff" : otpVerified ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
                                › {status}
                            </div>

                            {/* Login link */}
                            <div style={{ marginTop: "24px", textAlign: "center" }}>
                                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>Already have an account? </span>
                                <Link href="/login" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#a78bfa", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Log in →
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                {/* ── Right Panel ── */}
                <aside style={{
                    width: "300px", flexShrink: 0, borderLeft: "1px solid #242424",
                    background: "rgba(10,10,10,0.9)", padding: "0 28px",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                    {/* Steps overview */}
                    <div style={{ marginBottom: "36px" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.2em", borderBottom: "1px solid #242424", paddingBottom: "10px", marginBottom: "20px" }}>
                            Registration Steps
                        </div>
                        {[
                            { num: "01", label: "Your Details", sub: "Name, Email & Verification" },
                            { num: "02", label: "College Info", sub: "College, Branch & Year" },
                            { num: "03", label: "Set Password", sub: "Secure your account" },
                        ].map((s, i) => (
                            <div key={s.num} style={{
                                display: "flex", gap: "16px", alignItems: "flex-start",
                                padding: "14px 0",
                                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                opacity: step >= i + 1 ? 1 : 0.35,
                                transition: "opacity 0.4s",
                            }}>
                                <div style={{
                                    width: "28px", height: "28px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700,
                                    flexShrink: 0,
                                    background: step === i + 1 ? "#8b5cf6" : step > i + 1 ? "rgba(139,92,246,0.2)" : "rgba(0,0,0,0.3)",
                                    color: step === i + 1 ? "#fff" : step > i + 1 ? "#a78bfa" : "#555",
                                    boxShadow: step === i + 1 ? "0 0 12px rgba(139,92,246,0.3)" : "none",
                                    transition: "all 0.4s",
                                }}>{step > i + 1 ? "✓" : s.num}</div>
                                <div>
                                    <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "2px" }}>{s.label}</div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{s.sub}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Promise card */}
                    <div style={{
                        background: "rgba(0,0,0,0.2)",
                        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)",
                        padding: "20px", marginBottom: "20px",
                    }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: "12px" }}>
                            Our Promise
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {["🔒 Encrypted data", "🕵️ Anonymous by default", "✅ College-verified only", "🚫 Zero tolerance for abuse"].map((p) => (
                                <span key={p} style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{p}</span>
                            ))}
                        </div>
                    </div>

                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.15)", lineHeight: 1.8 }}>
                        › CampusConnect v1.0<br />
                        › Secure Registration
                    </div>
                </aside>
            </div>

            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; cursor: crosshair; }
        body { background: #0a0a0b; color: #e2e2e2; font-family: 'Inter', sans-serif; overflow: hidden; -webkit-font-smoothing: antialiased; }
        input::placeholder, select { color: rgba(255,255,255,0.2); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #242424; }
        @media (max-width: 960px) { aside:last-of-type { display: none !important; } }
        @media (max-width: 640px) { aside:first-of-type { width: 56px !important; } header { padding: 0 20px !important; } }
      `}</style>
        </>
    );
}
