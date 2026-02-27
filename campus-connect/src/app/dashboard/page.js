"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const gridCanvasRef = useRef(null);
  const [statusLine, setStatusLine] = useState("Ready to connect...");
  const [matchLine, setMatchLine] = useState("Choose a mode to get started.");
  const [btnStates, setBtnStates] = useState({});

  // Real-time data
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeMatches, setActiveMatches] = useState(0);

  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    router.replace("/app");
  }, [router]);

  // Set user as online and handle disconnect
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    // Set online
    updateDoc(userRef, { isOnline: true }).catch(() => { });

    // Set offline on tab close
    const handleBeforeUnload = () => {
      navigator.sendBeacon && updateDoc(userRef, { isOnline: false }).catch(() => { });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updateDoc(userRef, { isOnline: false }).catch(() => { });
    };
  }, [user]);

  // Real-time online users count
  useEffect(() => {
    // We use a simpler query to count all isOnline users
    const q = query(collection(db, "users"), where("isOnline", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Online snapshot size:", snapshot.size);
      setOnlineCount(snapshot.size);
    });

    // Also fetch initial total count and set an interval
    const fetchStats = async () => {
      try {
        const totalSnap = await getCountFromServer(collection(db, "users"));
        setTotalUsers(totalSnap.data().count);
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // refresh total count every minute

    // Active Matches count (status = 'matched')
    const matchQ = query(collection(db, "matchQueue"), where("status", "==", "matched"));
    const unsubMatches = onSnapshot(matchQ, (snapshot) => {
      // Divide by 2 because each match has 2 participants in the queue
      setActiveMatches(Math.floor(snapshot.size / 2));
    });

    return () => {
      unsubscribe();
      unsubMatches();
      clearInterval(interval);
    };
  }, []);

  // Mouse parallax effect
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
      router.push(`/video-match?mode=${mode}`);
    }, 1500);
  };

  const getBtnStyle = (mode) => {
    const state = btnStates[mode];
    if (!state) return {};
    if (state.phase === "connecting") {
      return { borderColor: "#007aff", color: "#007aff" };
    }
    if (state.phase === "connected") {
      return { background: "#007aff", color: "white", borderColor: "#007aff" };
    }
    return {};
  };

  const getBtnText = (mode, defaultText) => {
    const state = btnStates[mode];
    return state ? state.text : defaultText;
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { isOnline: false });
      } catch (e) { }
    }
    await logout();
    router.push("/");
  };

  const modes = [
    {
      key: "LOCAL",
      title: "Same College",
      desc: "Connect with students from your own college. Great for making campus friends.",
      btnDefault: "Connect Now",
    },
    {
      key: "FOUNDER",
      title: "Find a Co-Founder",
      desc: "Looking to start something? Meet other ambitious student entrepreneurs.",
      btnDefault: "Meet Founders",
    },
    {
      key: "GLOBAL",
      title: "Cross-College",
      desc: "Expand your network beyond your campus. Meet verified students from any college.",
      btnDefault: "Explore Network",
    },
    {
      key: "ACADEMIC",
      title: "Study Partner",
      desc: "Find someone studying the same subject or preparing for the same exam.",
      btnDefault: "Find Partner",
    },
    {
      key: "RANDOM",
      title: "Random Match",
      desc: "Connect with any active verified student across the platform randomly.",
      btnDefault: "Connect Now",
    }
  ];

  // Derived profile data
  const displayName = profile?.name || user?.email?.split("@")[0] || "Student";
  const displayCollege = profile ? `${profile.branch || "B.Tech"} ${profile.college ? "· " + profile.college : ""}` : "";
  const displayYear = profile?.year ? `${profile.year}${["st", "nd", "rd"][profile.year - 1] || "th"} Year` : "";
  const displayBio = profile?.bio || "Ready to connect with fellow students.";
  const displayInterests = profile?.interests?.length > 0 ? profile.interests : ["Student", "Campus Connect"];

  const maskEmail = (email) => {
    if (!email) return "—";
    const [name, domain] = email.split("@");
    if (!domain) return email;
    const maskedName = name.substring(0, 2) + "*".repeat(Math.max(0, name.length - 2));
    return `${maskedName}@${domain}`;
  };

  // Loading state
  if (authLoading) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0a0a", color: "#888",
        fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "32px", height: "32px", border: "2px solid #333",
            borderTop: "2px solid #8b5cf6", borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }} />
          Loading your dashboard...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {/* Noise Overlay */}
      <svg
        style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          pointerEvents: "none", zIndex: 9999, opacity: 0.03,
        }}
      >
        <filter id="grainy">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grainy)" />
      </svg>

      {/* Grid Canvas */}
      <div ref={gridCanvasRef} style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
        zIndex: -1,
      }} />

      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 350px",
        height: "100vh",
        width: "100vw",
        position: "relative",
      }}>

        {/* Sidebar */}
        <aside style={{
          borderRight: "1px solid #242424",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "30px 0",
          background: "rgba(10,10,10,0.8)",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{
            fontWeight: 900, fontSize: "24px", letterSpacing: "-2px",
            marginBottom: "60px",
            border: "2px solid #e0e0e0", padding: "5px",
            transform: "rotate(-5deg)",
          }}>CC</div>
          <nav style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {[
              { label: "Match", active: true },
              { label: "History", active: false },
              { label: "Explore", active: false },
              { label: "Settings", active: false },
            ].map((item) => (
              <div key={item.label} style={{
                margin: "20px 0",
                writingMode: "vertical-rl",
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                letterSpacing: "2px",
                color: item.active ? "#e0e0e0" : "#888888",
                cursor: "pointer",
                transition: "color 0.3s",
              }}>
                {item.label}
              </div>
            ))}
          </nav>

          {/* Logout button at bottom */}
          <div style={{ marginTop: "auto" }}>
            <button
              onClick={handleLogout}
              style={{
                writingMode: "vertical-rl",
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                letterSpacing: "2px",
                color: "#ff4444",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                transition: "color 0.3s",
                marginBottom: "20px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff6666")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ff4444")}
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ padding: "40px", overflowY: "auto", position: "relative" }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: "60px",
            animation: "slideDown 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div>
              <h1 style={{
                fontSize: "3.5rem", fontWeight: 900, textTransform: "uppercase",
                lineHeight: 0.9, letterSpacing: "-3px",
              }}>
                Campus<br />Connect.
              </h1>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#888888", fontSize: "12px", marginTop: "10px",
              }}>
                Find your people. Start a conversation.
              </p>
            </div>

            {/* Verified Badge */}
            <div style={{
              border: "1px solid #333333", padding: "10px 15px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <div style={{
                width: "12px", height: "12px", background: "#00ff66",
                borderRadius: "50%", boxShadow: "0 0 10px rgba(0,255,102,0.4)",
              }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>
                Identity Verified<br />
                <span style={{ color: "#888888" }}>Logged in as {displayName}</span>
              </div>
            </div>
          </div>

          {/* Mode Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1px",
            background: "#242424",
            border: "1px solid #242424",
            animation: "fadeIn 1s cubic-bezier(0.16,1,0.3,1) 0.2s both",
          }}>
            {modes.map((m, index) => (
              <div key={m.key} style={{
                background: "#0a0a0a", padding: "40px",
                position: "relative", overflow: "hidden",
                transition: "background 0.3s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#111"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#0a0a0a"}
              >
                {/* Card number */}
                <span style={{
                  position: "absolute", top: "10px", right: "10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px", color: "#333",
                }}>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 style={{
                  fontSize: "1.5rem", fontWeight: 700, marginBottom: "10px",
                  textTransform: "uppercase",
                }}>
                  {m.title}
                </h3>
                <p style={{
                  color: "#888888", fontSize: "13px", lineHeight: 1.6,
                  marginBottom: "25px",
                }}>
                  {m.desc}
                </p>
                <button
                  style={{
                    border: "1px solid #e0e0e0", background: "transparent",
                    color: "#e0e0e0", padding: "12px 20px",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                    width: "100%", textAlign: "left", position: "relative",
                    transition: "all 0.3s", cursor: "pointer",
                    ...getBtnStyle(m.key),
                  }}
                  onClick={() => triggerMatch(m.key, m.title)}
                  onMouseEnter={(e) => {
                    if (!btnStates[m.key]) {
                      e.currentTarget.style.background = "#e0e0e0";
                      e.currentTarget.style.color = "#0a0a0a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!btnStates[m.key]) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#e0e0e0";
                    }
                  }}
                >
                  {getBtnText(m.key, m.btnDefault)}
                  <span style={{ position: "absolute", right: "20px" }}>→</span>
                </button>
              </div>
            ))}
          </div>

          {/* Coordinates watermark */}
          <div style={{
            position: "absolute", bottom: "20px", right: "20px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px", color: "#333", textAlign: "right",
          }}>
            CampusConnect v1.0<br />
            Secure · Verified · Anonymous
          </div>
        </main>

        {/* Right Panel */}
        <aside style={{
          background: "rgba(10,10,10,0.9)",
          borderLeft: "1px solid #242424",
          padding: "40px 30px",
          display: "flex", flexDirection: "column",
        }}>
          {/* Active Profile — Real Data */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
              color: "#888888", borderBottom: "1px solid #242424",
              paddingBottom: "10px", marginBottom: "20px",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>YOUR PROFILE</span>
              <span>001</span>
            </div>
            <div style={{
              border: "1px dashed #333333", padding: "20px", position: "relative",
            }}>
              {/* Corner bracket */}
              <div style={{
                position: "absolute", top: "-5px", left: "-5px",
                width: "10px", height: "10px",
                borderTop: "1px solid #888", borderLeft: "1px solid #888",
              }} />
              <h4 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", marginBottom: "5px" }}>
                {displayName}
              </h4>
              <span style={{ fontSize: "11px", color: "#888888", display: "block", marginBottom: "15px" }}>
                {displayYear} {displayCollege}
              </span>
              <p style={{ fontSize: "12px", lineHeight: 1.5, color: "#888888", marginBottom: "20px" }}>
                {displayBio}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {displayInterests.map((tag) => (
                  <span key={tag} style={{
                    fontSize: "9px", fontFamily: "'JetBrains Mono', monospace",
                    border: "1px solid #242424", padding: "4px 8px",
                    textTransform: "uppercase",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Live Metrics — Real-time Data */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
              color: "#888888", borderBottom: "1px solid #242424",
              paddingBottom: "10px", marginBottom: "20px",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>LIVE STATS</span>
              <span style={{ color: "#00ff66", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{
                  width: "6px", height: "6px", background: "#00ff66",
                  borderRadius: "50%", display: "inline-block",
                  animation: "pulse 2s ease-in-out infinite",
                }} />
                LIVE
              </span>
            </div>
            {[
              { label: "Students Online", value: onlineCount.toLocaleString(), color: "#e0e0e0" },
              { label: "Active Matches", value: activeMatches.toLocaleString(), color: "#8b5cf6" },
              { label: "Total Users", value: totalUsers.toLocaleString(), color: "#888888" },
              { label: "Campus Karma", value: profile?.karma || 100, color: "#facc15" },
              { label: "Your Status", value: "Active", color: "#4ade80", showCheck: true },
            ].map((stat, i) => (
              <div key={stat.label} style={{
                display: "flex", justifyContent: "space-between",
                marginTop: i === 0 ? 0 : "8px",
                color: stat.color,
                fontSize: "12px",
              }}>
                <span style={{ color: "#888888" }}>{stat.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                  {stat.value}
                  {stat.showCheck && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* User Info */}
          <div style={{ marginBottom: "40px" }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
              color: "#888888", borderBottom: "1px solid #242424",
              paddingBottom: "10px", marginBottom: "20px",
            }}>
              ACCOUNT
            </div>
            <div style={{ fontSize: "11px", color: "#555", lineHeight: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Verified</span>
                <span style={{ color: "#4ade80", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                  {profile?.emailVerified ? "Verified" : "Pending"}
                  {profile?.emailVerified && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>College</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#888", fontSize: "10px" }}>
                  {profile?.college || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Status Ticker */}
          <div style={{ marginTop: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#007aff" }}>
            <div style={{ marginBottom: "4px" }}>› {statusLine}</div>
            <div style={{ color: "#888888" }}>› {matchLine}</div>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { cursor: crosshair; box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #0a0a0a; color: #e0e0e0; font-family: 'Inter', sans-serif; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #242424; }
        @media (max-width: 1024px) {
          .app-container { grid-template-columns: 60px 1fr !important; }
        }
      `}</style>
    </>
  );
}
