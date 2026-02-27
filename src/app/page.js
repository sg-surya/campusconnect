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
      (entries) => entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add("etch-visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".etch-reveal").forEach((el) => io.observe(el));
    return () => { window.removeEventListener("mousemove", move); io.disconnect(); };
  }, []);

  const navItems = ["Discover", "Features", "Modes", "Safety"];

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
              <a key={item} href={`#${item.toLowerCase()}`} style={{
                margin: "18px 0", writingMode: "vertical-rl", textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "2px",
                color: "#666", textDecoration: "none", transition: "color 0.3s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e0e0e0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
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
          <section id="discover" style={{ padding: "120px 80px", position: "relative" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "60px", alignItems: "center" }}>
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

                {/* Stats Slab */}
                <div style={{ width: "100%", maxWidth: "340px" }}>
                  <div className="etch-reveal" style={{
                    background: "#111", border: "1px solid rgba(255,255,255,0.06)", padding: "40px",
                    boxShadow: "20px 20px 60px rgba(0,0,0,0.5)"
                  }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#444", textTransform: "uppercase", marginBottom: "30px", letterSpacing: "2px" }}>NETWORK_STATS_001</div>
                    {[
                      { val: totalUsers, label: "Verified Students", color: "#fff" },
                      { val: onlineCount, label: "Students Online", color: "#00ff66" },
                      { val: activeMatches, label: "Live Matches Now", color: "#8b5cf6" },
                    ].map((s, i) => (
                      <div key={s.label} style={{ marginBottom: i === 2 ? 0 : "30px" }}>
                        <div style={{ fontSize: "2.5rem", fontWeight: 900, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mission / How it works */}
          <section id="features" style={{ padding: "100px 80px", background: "rgba(5,5,5,0.8)" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "100px", alignItems: "start" }}>
                <div>
                  <h2 style={{ fontSize: "3rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px", lineHeight: 1, marginBottom: "30px" }}>
                    One Platform.<br />Elite Community.
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8, marginBottom: "30px" }}>
                    CampusConnect was born out of a simple need: College students needed a place to network without the toxicity of random video apps. By requiring a **.edu** or **Verified College Email**, we ensure that every person you meet is a peer.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {["Direct campus-to-campus networking", "Founders finding builders", "Academic collaboration across India", "Secure, encrypted student identities"].map(text => (
                      <div key={text} style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <div style={{ width: "20px", height: "1px", background: "#8b5cf6" }} />
                        <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {features.map(f => (
                    <div key={f.num} className="etch-reveal" style={{ background: "#111", padding: "30px", border: "1px solid #1a1a1a" }}>
                      <div style={{ fontSize: "10px", color: "#8b5cf6", marginBottom: "15px", fontFamily: "'JetBrains Mono', monospace" }}>{f.num} // {f.tag}</div>
                      <h4 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "10px", textTransform: "uppercase" }}>{f.title}</h4>
                      <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.6 }}>{f.desc}</p>
                    </div>
                  ))}
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
                  { title: "Major Private & Central", prefix: "University", domains: ["vit", "manipal", "srmist", "thapar", "amity", "lpu", "sharda", "kiit", "du", "jnu", "bhu", "uohyd", "annauniv", "amu", "mu", "osmania", "aiims"] }
                ].map((group) => (
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
                ))}
              </div>

              <div style={{ marginTop: "40px", padding: "20px", background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", textAlign: "center", borderRadius: "4px" }}>
                <span style={{ fontSize: "11px", color: "#8b5cf6", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                  › Don&apos;t see your college? We are adding 50+ new institutions every month. Contact support to request yours.
                </span>
              </div>
            </div>
          </section>

          {/* Safety First */}
          <section id="safety" style={{ padding: "100px 80px", background: "linear-gradient(to bottom, transparent, #080808)" }}>
            <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#ff4757", fontWeight: 900, letterSpacing: "4px", marginBottom: "20px" }}>SHIELD_PROTOCOL_ACTIVE</div>
              <h2 style={{ fontSize: "4rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-4px", marginBottom: "40px" }}>Safety Built-In.</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px", textAlign: "left" }}>
                <div>
                  <h4 style={{ color: "#fff", fontWeight: 800, marginBottom: "10px" }}>AI Moderation</h4>
                  <p style={{ fontSize: "12px", color: "#555" }}>Real-time filtering of inappropriate language and visual content using neural networks.</p>
                </div>
                <div>
                  <h4 style={{ color: "#fff", fontWeight: 800, marginBottom: "10px" }}>Verified Pulse</h4>
                  <p style={{ fontSize: "12px", color: "#555" }}>Every student is checked against an active university roster. No outsiders allowed.</p>
                </div>
                <div>
                  <h4 style={{ color: "#fff", fontWeight: 800, marginBottom: "10px" }}>End-to-End</h4>
                  <p style={{ fontSize: "12px", color: "#555" }}>All video sessions are peer-to-peer and encrypted. Privacy isn&apos;t an option, it&apos;s a standard.</p>
                </div>
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
                    <Link href="#features">Features</Link>
                    <Link href="#modes">Modes</Link>
                    <Link href="#safety">Safety</Link>
                  </div>
                </div>
                <div>
                  <h5 style={{ fontSize: "10px", color: "#8b5cf6", letterSpacing: "2px", marginBottom: "20px" }}>LEGAL</h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#666" }}>
                    <span>Privacy Policy</span>
                    <span>Terms of Use</span>
                    <span>Guidelines</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ maxWidth: "1200px", margin: "60px auto 0", borderTop: "1px solid #0f0f0f", paddingTop: "30px", fontSize: "10px", color: "#333", display: "flex", justifyContent: "space-between" }}>
              <span>© 2026 CAMPUSCONNECT. ALL RIGHTS RESERVED.</span>
              <span>BUILT FOR STUDENTS. BY STUDENTS.</span>
            </div>
          </footer>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; cursor: crosshair; }
        body { background-color: #050505; color: #e2e2e2; font-family: 'Inter', sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #222; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .etch-reveal { opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .etch-visible { opacity: 1 !important; transform: translateY(0) !important; }
        a { color: inherit; text-decoration: none; transition: color 0.3s; }
        a:hover { color: #fff; }
      `}</style>
    </>
  );
}
