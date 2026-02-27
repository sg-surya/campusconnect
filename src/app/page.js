"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AuthModal from "@/components/AuthModal";

export default function LandingPage() {
  const gridRef = useRef(null);
  const [totalUsers, setTotalUsers] = useState("...");
  const [onlineCount, setOnlineCount] = useState("...");
  const [activeMatches, setActiveMatches] = useState("...");
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "login" });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/app");
    }
  }, [loading, user, router]);

  const openAuth = (mode) => setAuthModal({ isOpen: true, mode });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const totalSnap = await getCountFromServer(collection(db, "users"));
        setTotalUsers(totalSnap.data().count.toLocaleString());

        const onlineQ = query(collection(db, "users"), where("isOnline", "==", true));
        const onlineSnap = await getCountFromServer(onlineQ);
        setOnlineCount(onlineSnap.data().count.toLocaleString());

        const matchQ = query(collection(db, "matchQueue"), where("status", "==", "matched"));
        const matchSnap = await getCountFromServer(matchQ);
        setActiveMatches(Math.floor(matchSnap.data().count / 2).toLocaleString());
      } catch (err) {
        console.error("Stats error:", err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const move = (e) => {
      if (!gridRef.current) return;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      gridRef.current.style.backgroundPosition = `${x * 0.1}px ${y * 0.1}px`;
    };
    window.addEventListener("mousemove", move);

    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
        } else {
          en.target.classList.remove("visible");
        }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll("section, .etch-reveal").forEach((el) => {
      el.classList.add("reveal-node");
      io.observe(el);
    });
    return () => { window.removeEventListener("mousemove", move); io.disconnect(); };
  }, []);

  const navItems = ["Discover", "Modes", "Protocols", "Network"];

  const Icons = {
    Globe: ({ size = 24, color = "currentColor" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
    ),
    Campus: ({ size = 24, color = "currentColor" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
    ),
    Rocket: ({ size = 24, color = "currentColor" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" /><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" /></svg>
    ),
    Book: ({ size = 24, color = "currentColor" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
    ),
    Shield: ({ size = 24, color = "currentColor" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
    Discord: ({ size = 20, color = "currentColor" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm6 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" /><path d="M10.19 2.5a1 1 0 0 0-.69.29L7.15 5.1a1 1 0 0 0-.29.69v1.44a11 11 0 0 0-4.47 5.77 1 1 0 0 0 .54 1.14l2.58 1.15.22.13a1 1 0 0 0 .58-.4l.65-.96c.21-.31.32-.68.32-1.06V11a8 8 0 0 1 10.32-3.41 1 1 0 0 0 1.25-.4l1.32-2.14a1 1 0 0 0-.29-1.29l-3.32-2a1 1 0 0 0-.69-.29H10.19z" /></svg>
    )
  };

  const modes = [
    { icon: <Icons.Globe size={32} color="#8b5cf6" />, tag: "Random", title: "Global Match", desc: "Connect with verified students from any college across India." },
    { icon: <Icons.Campus size={32} color="#8b5cf6" />, tag: "Campus", title: "Same College", desc: "Digital hallway for your own campus. Find your classmates." },
    { icon: <Icons.Rocket size={32} color="#8b5cf6" />, tag: "Founder", title: "Co-Founder", desc: "Meet other ambitious entrepreneurs and builders." },
    { icon: <Icons.Book size={32} color="#8b5cf6" />, tag: "Partner", title: "Study Buddy", desc: "Connect with people studying the same branch or subjects." },
  ];

  const features = [
    {
      num: "01",
      title: "Closed Network",
      tag: "Verification",
      desc: "Unlike other platforms, CampusConnect is an exclusive space. We verify every user via their college email (OTP) to ensure 0% bots and 100% real students.",
    },
    {
      num: "02",
      title: "Mode-Based Matching",
      tag: "Connectivity",
      desc: "Don't just talk to anyone. Choose your vibe — whether you want a random chat, a study partner, or a co-founder for your next big startup idea.",
    },
    {
      num: "03",
      title: "Ironclad Safety",
      tag: "Protection",
      desc: "Our AI-powered moderation scans for NSFW content and harassment in real-time. Plus, every participant is tied to a real college identity for accountability.",
    },
    {
      num: "04",
      title: "Real-time Presence",
      tag: "Live Data",
      desc: "See exactly how many people are online right now. Our live metrics pull directly from Firestore to give you an active view of the national student landscape.",
    }
  ];

  return (
    <>
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onSuccess={() => router.push("/app")}
      />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <div ref={gridRef} style={{
        position: "fixed", inset: 0, zIndex: -1,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)`,
        backgroundSize: "120px 120px, 120px 120px, 20px 20px, 20px 20px",
      }} />

      {/* Radial Glows */}
      <div style={{
        position: "fixed", top: "-10vh", right: "-10vw", width: "60vw", height: "60vw",
        background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        zIndex: -1, pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", bottom: "-20vh", left: "-10vw", width: "50vw", height: "50vw",
        background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
        zIndex: -1, pointerEvents: "none"
      }} />

      <div style={{ display: "flex", minHeight: "100vh", width: "100vw" }}>

        {/* ══ LEFT SIDEBAR ══ */}
        <aside style={{
          width: "80px", flexShrink: 0, borderRight: "1px solid #242424",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "28px 0", background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, height: "100vh",
        }}>
          <div style={{ fontWeight: 900, fontSize: "22px", letterSpacing: "-2px", border: "2px solid #e0e0e0", padding: "4px 6px", transform: "rotate(-5deg)", marginBottom: "50px", userSelect: "none" }}>CC</div>
          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {navItems.map((item, i) => (
              <a key={item} href={item === "Support" ? "https://discord.gg/zNUtGNNmRG" : `#${item.toLowerCase()}`}
                target={item === "Support" ? "_blank" : "_self"}
                rel={item === "Support" ? "noopener noreferrer" : ""}
                style={{
                  margin: "18px 0", writingMode: "vertical-rl", textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "2px",
                  color: item === "Support" ? "#8b5cf6" : "#666", textDecoration: "none", transition: "all 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = item === "Support" ? "#a78bfa" : "#e0e0e0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = item === "Support" ? "#8b5cf6" : "#666")}
              >{item}</a>
            ))}
          </nav>
          <div style={{ marginTop: "auto", marginBottom: "12px", width: "6px", height: "6px", borderRadius: "50%", background: "#00ff66", boxShadow: "0 0 8px rgba(0,255,102,0.5)" }} />
        </aside>

        {/* ══ MAIN CONTENT ══ */}
        <main style={{ flex: 1, overflowX: "hidden" }}>

          {/* Header */}
          <header style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0 48px", height: "72px", borderBottom: "1px solid #1a1a1a",
            background: "rgba(10,10,10,0.7)", backdropFilter: "blur(12px)",
            position: "sticky", top: 0, zIndex: 50,
          }}>
            <span style={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "-0.5px", fontStyle: "italic" }}>
              CampusConnect
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              {!loading && (
                <>
                  {user ? (
                    <Link href="/app" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#4ade80", textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px" }}>Enter App →</Link>
                  ) : (
                    <>
                      <button onClick={() => openAuth("login")} style={{ background: "none", border: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.45)", textDecoration: "none", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>Log In</button>
                      <button onClick={() => openAuth("signup")} style={{
                        background: "white", color: "black", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                        textTransform: "uppercase", letterSpacing: "1px", padding: "10px 20px", border: "none", cursor: "pointer",
                        clipPath: "polygon(8% 0, 100% 0, 100% 68%, 92% 100%, 0 100%, 0 32%)", transition: "all 0.3s",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; }}
                      >Get Started</button>
                    </>
                  )}
                </>
              )}
            </div>
          </header>


          {/* Hero */}
          <section id="discover" style={{ padding: "80px", position: "relative", minHeight: "85vh", display: "flex", alignItems: "center" }}>
            <div style={{ maxWidth: "1600px", margin: "0 auto", width: "100%" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "80px", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: "1 1 500px" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "30px",
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)",
                    padding: "8px 16px", borderRadius: "4px"
                  }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", animation: "pulse 2s infinite" }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "2px", color: "#a78bfa", textTransform: "uppercase" }}>
                      NEW: Real-time Video Matching
                    </span>
                  </div>

                  <h1 style={{ fontSize: "clamp(3.5rem, 8vw, 7.5rem)", fontWeight: 900, lineHeight: 0.8, letterSpacing: "-6px", textTransform: "uppercase", marginBottom: "30px", position: "relative" }}>
                    Network.<br />
                    <span style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,0.4)", filter: "drop-shadow(0 0 20px rgba(139,92,246,0.3))" }}>Collaborate.</span><br />
                    Safely.
                  </h1>

                  <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.5)", maxWidth: "520px", lineHeight: 1.8, marginBottom: "45px" }}>
                    CampusConnect is India&apos;s first exclusive video-networking platform built specifically for university students. No strangers, no bots — just verified student identities.
                  </p>

                  <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                    <button
                      onClick={() => user ? router.push("/app") : openAuth("signup")}
                      style={{
                        background: "white", color: "black", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "13px", textTransform: "uppercase", letterSpacing: "1.5px", padding: "20px 48px", border: "none", cursor: "pointer",
                        clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)", transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                        boxShadow: "0 10px 30px rgba(255,255,255,0.1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#8b5cf6";
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.transform = "translateY(-5px)";
                        e.currentTarget.style.boxShadow = "0 20px 40px rgba(139,92,246,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.color = "#000";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,255,255,0.1)";
                      }}
                    >{user ? "Open Dashboard" : "Join the Identity"}</button>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.3)" }}>PLATFORM_VERSION</div>
                      <div style={{ fontSize: "14px", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>CC_CORE_v1.0.4</div>
                    </div>
                  </div>
                </div>

                {/* Creative Idea #3: Floating "Live-Preview" Wireframe HUD */}
                <div className="etch-reveal" style={{
                  width: "100%", maxWidth: "520px", flexShrink: 0, perspective: "1000px"
                }}>
                  <div style={{
                    background: "rgba(10,10,10,0.4)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: "12px",
                    position: "relative",
                    overflow: "hidden",
                    aspectRatio: "1.4 / 1",
                    backdropFilter: "blur(40px)",
                    boxShadow: "0 40px 100px rgba(0,0,0,0.8), inset 0 0 40px rgba(139,92,246,0.1)",
                    transform: "rotateY(-5deg) rotateX(2deg)",
                    padding: "30px"
                  }}>
                    {/* Scanning Line Animation */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.1), transparent)",
                      height: "100px", width: "100%", zIndex: 2,
                      animation: "scanLine 4s linear infinite",
                      pointerEvents: "none"
                    }} />

                    {/* HUD Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "40px", position: "relative", zIndex: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff4757", animation: "pulse 1.5s infinite" }} />
                          <span style={{ fontSize: "10px", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#e0e0e0", letterSpacing: "2px" }}>LIVE_RADAR_SCANNING</span>
                        </div>
                        <div style={{ fontSize: "9px", color: "#444", fontFamily: "'JetBrains Mono', monospace" }}>LOC: MUMBAI_SERVER_NODE_4</div>
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(139,92,246,0.6)", border: "1px solid rgba(139,92,246,0.3)", padding: "4px 8px", borderRadius: "2px", fontFamily: "'JetBrains Mono', monospace" }}>
                        SECURE_P2P_E2EE
                      </div>
                    </div>

                    {/* Main HUD Visuals */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", position: "relative", zIndex: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                        {[
                          { val: totalUsers, label: "VERIFIED_IDENTITIES", color: "#fff" },
                          { val: onlineCount, label: "ACTIVE_NODES_ONLINE", color: "#00ff66" },
                          { val: activeMatches, label: "PEER_CHANNELS_OPEN", color: "#8b5cf6" },
                        ].map((s, i) => (
                          <div key={s.label}>
                            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                            <div style={{ fontSize: "8px", color: "#444", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px", fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Waveform Visualization */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "rgba(255,255,255,0.02)", borderRadius: "8px", position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "40px" }}>
                          {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <div key={i} style={{
                              width: "3px",
                              background: "#8b5cf6",
                              borderRadius: "4px",
                              animation: `waveform 1.2s ease-in-out infinite alternate`,
                              animationDelay: `${i * 0.15}s`
                            }} />
                          ))}
                        </div>
                        <div style={{ position: "absolute", bottom: "12px", fontSize: "7px", color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>VOICE_DATA_STREAM</div>
                      </div>
                    </div>

                    {/* Corner Decorations */}
                    <div style={{ position: "absolute", top: "10px", left: "10px", width: "4px", height: "4px", borderTop: "1px solid #333", borderLeft: "1px solid #333" }} />
                    <div style={{ position: "absolute", top: "10px", right: "10px", width: "4px", height: "4px", borderTop: "1px solid #333", borderRight: "1px solid #333" }} />
                    <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "4px", height: "4px", borderBottom: "1px solid #333", borderLeft: "1px solid #333" }} />
                    <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "4px", height: "4px", borderBottom: "1px solid #333", borderRight: "1px solid #333" }} />
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* Modes Section */}
          <section id="modes" style={{ padding: "100px 80px" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: "60px" }}>
                <h2 style={{ fontSize: "3.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px" }}>Discover Your Mode</h2>
                <p style={{ color: "#444", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", letterSpacing: "2px" }}>PICK YOUR VIBE. START A CONNECTION.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                {modes.map(m => (
                  <div key={m.tag} className="etch-reveal" style={{
                    background: "rgba(10,10,10,0.4)", padding: "48px 40px", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "16px", backdropFilter: "blur(20px)",
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", cursor: "pointer",
                    display: "flex", flexDirection: "column", gap: "20px"
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)";
                      e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                      e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ background: "rgba(139,92,246,0.1)", width: "56px", height: "56px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {m.icon}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: "1.25rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>{m.title}</h3>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", lineHeight: 1.6 }}>{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* THE PROTOCOLS — NEW CRAZY SECTIONS */}
          <section id="protocols" style={{ padding: "120px 80px", background: "linear-gradient(to bottom, #050505, #0a0a0a)" }}>
            <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
              <div style={{ textAlign: "left", marginBottom: "80px" }}>
                <div style={{ fontSize: "12px", color: "#8b5cf6", fontWeight: 900, letterSpacing: "4px", marginBottom: "15px", fontFamily: "'JetBrains Mono', monospace" }}>SYSTEM_OPERATIONS_v2.0</div>
                <h2 style={{ fontSize: "4.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-5px", lineHeight: 0.9 }}>THE CORE<br /><span style={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}>PROTOCOLS.</span></h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "40px" }}>

                {/* 1. SOCIAL KARMA PROGRESSION */}
                <div className="etch-reveal" style={{ gridColumn: "span 2", background: "rgba(139,92,246,0.02)", border: "1px solid rgba(139,92,246,0.1)", padding: "60px", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: "20px", right: "20px", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "rgba(139,92,246,0.4)" }}>[KARMA_TIER_VISUALIZER]</div>
                  <h3 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "40px", textTransform: "uppercase" }}>Social Karma Progression</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
                    {[
                      { tier: "ROOKIE", color: "#444", height: "40px", karma: "0+" },
                      { tier: "BRONZE", color: "#cd7f32", height: "60px", karma: "500+" },
                      { tier: "SILVER", color: "#C0C0C0", height: "80px", karma: "1500+" },
                      { tier: "GOLD", color: "#FFD700", height: "100px", karma: "5000+" },
                      { tier: "OBSIDIAN", color: "#8b5cf6", height: "140px", karma: "10000+", glow: true },
                    ].map((t) => (
                      <div key={t.tier} style={{ flex: 1, minWidth: "120px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: "100%", height: t.height, background: t.color, opacity: t.glow ? 1 : 0.3,
                          boxShadow: t.glow ? "0 0 40px rgba(139,92,246,0.4)" : "none",
                          clipPath: "polygon(20% 0, 80% 0, 100% 100%, 0% 100%)",
                          transition: "0.3s"
                        }} />
                        <div style={{ marginTop: "15px", fontSize: "11px", fontWeight: 900, color: t.glow ? "#fff" : "#444" }}>{t.tier}</div>
                        <div style={{ fontSize: "9px", color: t.glow ? "#8b5cf6" : "#222", fontFamily: "'JetBrains Mono', monospace" }}>{t.karma} PTS</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. FOUNDERS COMPLEMENTARITY */}
                <div className="etch-reveal" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "50px", position: "relative" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "15px", textTransform: "uppercase" }}>Skill-Pairing Engine</h3>
                  <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.6, marginBottom: "40px" }}>Our deterministic algorithm doesn&apos;t match similar skills. It matches complementary ones—pairing builders with architects.</p>
                  <div style={{ height: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(139,92,246,0.1)", border: "1px dashed #8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>TECH</div>
                    <div style={{ fontSize: "20px", color: "#8b5cf6", animation: "pulse 1.2s infinite" }}>+</div>
                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(0,255,102,0.1)", border: "1px dashed #00ff66", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>BIZ</div>
                  </div>
                </div>

                {/* 3. GHOST-PURGE TECHNOLOGY */}
                <div className="etch-reveal" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "50px", position: "relative", overflow: "hidden" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "15px", textTransform: "uppercase" }}>Ghost-Purge Tech</h3>
                  <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.6, marginBottom: "40px" }}>Zero Latency. Zero Wait. Our system purges inactive nodes every 200ms to ensure you only meet 100% active students.</p>
                  <div style={{ position: "absolute", right: "-20px", bottom: "-20px", opacity: 0.1 }}>
                    <div style={{ width: "200px", height: "200px", border: "2px solid #fff", borderRadius: "50%", animation: "ping-large 3s infinite" }} />
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#00ff66" }}>› PURGING_STALE_NODES... [DONE]</div>
                </div>

                {/* 4. VERIFIED DIGITAL ID CARDS */}
                <div className="etch-reveal" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "50px", position: "relative" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "15px", textTransform: "uppercase" }}>Identity Verification</h3>
                  <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.6, marginBottom: "30px" }}>Your college ID is your access key. Verified profiles carry the CC-Silver Badge of Authenticity.</p>
                  <div style={{ display: "flex", gap: "15px" }}>
                    {["IITB", "BITS", "NITW"].map(t => (
                      <div key={t} style={{
                        padding: "10px 15px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                        fontSize: "12px", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.4)"
                      }}>{t}</div>
                    ))}
                  </div>
                </div>

                {/* 5. NODE-TO-NODE P2P PRIVACY */}
                <div className="etch-reveal" style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "50px", position: "relative" }}>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: "15px", textTransform: "uppercase" }}>Serverless-P2P</h3>
                  <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.6, marginBottom: "40px" }}>We don&apos;t store your video. Data is encrypted and routed directly between students using WebRTC protocol.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ width: "10px", height: "10px", background: "#8b5cf6" }} />
                    <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, #8b5cf6, transparent)" }} />
                    <Icons.Shield size={24} color="#8b5cf6" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Supported Institutions Section */}
          <section id="network" style={{ padding: "100px 80px", background: "#080808", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ marginBottom: "60px" }}>
                <div style={{ fontSize: "12px", color: "#8b5cf6", fontWeight: 900, letterSpacing: "4px", marginBottom: "15px", fontFamily: "'JetBrains Mono', monospace" }}>NETWORK_COVERAGE_v1.0</div>
                <h2 style={{ fontSize: "3.5rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px" }}>Supported Institutions.</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", maxWidth: "600px", lineHeight: 1.6, marginTop: "15px" }}>
                  CampusConnect is strictly for verified students. We currently support 100+ prestigious Indian institutions. Use your official college email ID to gain access.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2px", background: "#1a1a1a", border: "1px solid #1a1a1a" }}>
                {[
                  { title: "Indian Institutes of Technology", prefix: "IIT", domains: ["iitb", "iitd", "iitk", "iitm", "iitkgp", "iitr", "iitg", "iith", "iitj", "iitgn", "iitp", "iitbbs", "iitindore", "iitmandi", "iitrpr", "iitv", "iitbhilai", "iitgoa", "iitpkd", "iittp", "iitdh", "iitjammu", "iitbhw"] },
                  { title: "National Institutes of Technology", prefix: "NIT", domains: ["nitw", "nitt", "nitk", "nitrkl", "nitc", "vnit", "nitjsr", "nitp", "nitkurukshetra", "nits", "nitdgp", "nithamirpur", "nitrr", "nitmz", "nitmanipur", "nitm", "nitnagaland", "nitpy", "nitsikkim", "nitap", "nitdelhi", "nitgoa", "nituk", "nith"] },
                  { title: "IIITs & BITS", prefix: "Specialty", domains: ["iiit", "iiitd", "iiitb", "iiita", "iiitdmj", "iiitdm", "iiitg", "iiitkota", "iiitn", "iiitp", "iiitvadodara", "iiits", "iiitk", "bits-pilani", "bits-hyderabad", "bits-goa"] },
                  { title: "Major Private & Central", prefix: "University", domains: ["vit", "manipal", "srmist", "thapar", "amity", "lpu", "sharda", "kiit", "du", "jnu", "bhu", "uohyd", "annauniv", "amu", "mu", "osmania", "aiims"] },
                  { isCTA: true }
                ].map((group) => {
                  if (group.isCTA) {
                    return (
                      <div key="discord-cta" style={{
                        gridColumn: "span 2",
                        background: "linear-gradient(135deg, #5865F2 0%, #8b5cf6 100%)",
                        padding: "40px", display: "flex", flexDirection: "column",
                        justifyContent: "center", alignItems: "center", textAlign: "center",
                        position: "relative", overflow: "hidden"
                      }}>
                        {/* Decorative Background Icon */}
                        <div style={{ position: "absolute", right: "-20px", bottom: "-20px", opacity: 0.1, transform: "rotate(-15deg)" }}>
                          <Icons.Discord size={200} />
                        </div>

                        <h4 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "-1.5px", marginBottom: "15px", position: "relative" }}>Join the Hub.</h4>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginBottom: "30px", maxWidth: "240px", lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>
                          GET REAL-TIME SUPPORT, SUGGEST COLLEGES, AND MEET THE COMMUNITY.
                        </p>
                        <a href="https://discord.gg/zNUtGNNmRG" target="_blank" rel="noopener noreferrer" style={{
                          background: "#fff", color: "#5865F2", padding: "14px 30px", fontSize: "11px", fontWeight: 900,
                          textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace",
                          textDecoration: "none", borderRadius: "2px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                          transition: "all 0.3s"
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.3)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)"; }}
                        >
                          JOIN DISCORD →
                        </a>
                      </div>
                    );
                  }
                  return (
                    <div key={group.title} style={{ background: "#0a0a0a", padding: "30px" }}>
                      <h4 style={{ fontSize: "11px", color: "#8b5cf6", fontWeight: 800, letterSpacing: "2px", marginBottom: "20px", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{group.title}</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {group.domains.map(dom => (
                          <div key={dom} style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", padding: "8px", border: "1px solid rgba(255,255,255,0.02)", background: "rgba(255,255,255,0.01)" }}>
                            {dom.toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div id="support" style={{ marginTop: "40px", padding: "30px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", textAlign: "center", borderRadius: "8px", position: "relative", overflow: "hidden" }}>
                <div style={{ marginBottom: "15px" }}>
                  <span style={{ fontSize: "11px", color: "#8b5cf6", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                    › Don&apos;t see your college? We are adding 50+ new institutions every month.
                  </span>
                </div>
                <a href="https://discord.gg/zNUtGNNmRG" target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: "10px", background: "#8b5cf6", color: "#fff",
                  padding: "12px 24px", borderRadius: "4px", fontSize: "12px", fontWeight: 900, textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", transition: "all 0.3s",
                  clipPath: "polygon(5% 0, 100% 0, 100% 70%, 95% 100%, 0 100%, 0 30%)"
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#000"; e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#8b5cf6"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                  Request Institution via Discord
                </a>
              </div>
            </div>
          </section>


          {/* Footer */}
          <footer style={{ padding: "80px", borderTop: "1px solid #1a1a1a" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "40px" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: "24px", border: "2px solid white", padding: "2px 6px", display: "inline-block", transform: "rotate(-5deg)", marginBottom: "20px" }}>CC</div>
                <p style={{ color: "#444", fontSize: "12px", maxWidth: "260px" }}>The digital hallway for the modern Indian student. Redefining how we build networks.</p>
              </div>
              <div style={{ display: "flex", gap: "80px" }}>
                <div>
                  <h5 style={{ fontSize: "10px", color: "#8b5cf6", letterSpacing: "2px", marginBottom: "20px" }}>PRODUCT</h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#666" }}>
                    <Link href="#modes">Modes</Link>
                    <Link href="#protocols">Protocols</Link>
                    <Link href="#network">Network</Link>
                    <a href="https://discord.gg/zNUtGNNmRG" target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6" }}>Support (Discord)</a>
                  </div>
                </div>
                <div>
                  <h5 style={{ fontSize: "10px", color: "#8b5cf6", letterSpacing: "2px", marginBottom: "20px" }}>LEGAL</h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#666" }}>
                    <Link href="/privacy">Privacy Policy</Link>
                    <Link href="/terms">Terms of Use</Link>
                    <Link href="/guidelines">Community Guidelines</Link>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ maxWidth: "1200px", margin: "60px auto 0", borderTop: "1px solid #0f0f0f", paddingTop: "30px", fontSize: "10px", color: "#333", display: "flex", justifyContent: "space-between" }}>
              <span>© 2026 CAMPUSCONNECT. ALL RIGHTS RESERVED.</span>
              <span style={{ letterSpacing: "1px" }}>BUILT BY <a href="https://vasudev.online" target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6", fontWeight: 800, textDecoration: "none" }}>VASUDEV AI</a> & THE COMMUNITY.</span>
            </div>
          </footer>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; cursor: crosshair; }
        body { background-color: #050505; color: #e2e2e2; font-family: 'Inter', sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #222; }
        @keyframes waveform { 
          from { height: 10px; opacity: 0.3; }
          to { height: 40px; opacity: 1; }
        }
        @keyframes scanLine {
          from { transform: translateY(-100%); }
          to { transform: translateY(400%); }
        }
        @keyframes ping-large {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(30px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .reveal-node { opacity: 0; }
        .reveal-node.visible { animation: revealUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; border: 2px solid #050505; }
        ::-webkit-scrollbar-thumb:hover { background: #8b5cf6; }

        /* Smooth Anchor Scroll */
        html { scroll-behavior: smooth; }
      `}</style>
    </>
  );
}
