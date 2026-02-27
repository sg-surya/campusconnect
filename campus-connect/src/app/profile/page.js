"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);

  const user = {
    name: "Surya Pratap Singh",
    email: "s***@iitd.ac.in",
    college: "IIT Delhi",
    branch: "Computer Science & Engineering",
    year: "3rd Year",
    dob: "2004-05-15",
    gender: "Male",
    bio: "CS student passionate about AI/ML, building startups, and competitive programming. Looking to connect with fellow builders and innovators.",
    karma: 420,
    badges: ["✅ Verified Student", "🏫 College Verified", "🔥 Top Chatter", "🚀 Builder"],
    interests: ["💻 Coding", "🚀 Startups", "🎮 Gaming", "📚 Research", "🎵 Music", "🏀 Sports"],
    stats: {
      totalChats: 156,
      avgDuration: "18 min",
      goodVibes: "96%",
      reportRate: "0%",
      matchAccept: "82%",
      friendsMade: 34,
    },
    joined: "Jan 2026",
  };

  return (
    <div className="profile-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand">
            <img src="/logo.png" alt="CC" className="sidebar-logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <span className="sidebar-title">
              C<span className="gradient-text">C</span>
            </span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => router.push("/dashboard")}>
            <span className="nav-icon">🏠</span><span>Dashboard</span>
          </button>
          <button className="nav-item" onClick={() => router.push("/chat")}>
            <span className="nav-icon">💬</span><span>Active Chat</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">📜</span><span>Chat History</span>
          </button>
          <button className="nav-item active">
            <span className="nav-icon">👤</span><span>Profile</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">🏆</span><span>Leaderboard</span>
          </button>
          <button className="nav-item">
            <span className="nav-icon">⚙️</span><span>Settings</span>
          </button>
        </nav>
      </aside>

      <main className="profile-main">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-cover">
            <div className="cover-gradient" />
          </div>
          <div className="profile-header-content container">
            <div className="profile-avatar-section">
              <div className="avatar avatar-xl">{user.name[0]}{user.name.split(" ")[1]?.[0]}</div>
              <div className="profile-info">
                <h1 className="profile-name">{user.name}</h1>
                <p className="profile-college">{user.college} · {user.branch}</p>
                <p className="profile-year">{user.year} · Joined {user.joined}</p>
                <div className="profile-badges">
                  {user.badges.map((badge) => (
                    <span key={badge} className="badge badge-verified">{badge}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="profile-actions">
              <button className="btn btn-primary" onClick={() => setEditing(!editing)} id="edit-profile">
                {editing ? "Save Changes" : "✏️ Edit Profile"}
              </button>
              <button className="btn btn-secondary" id="share-profile">
                📤 Share
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <div className="container">
            <div className="tabs-row">
              {["overview", "stats", "interests", "settings"].map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  id={`tab-${tab}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="profile-content container">
          {activeTab === "overview" && (
            <div className="tab-content animate-fade-in">
              <div className="overview-grid">
                {/* Bio */}
                <div className="glass-card bio-card">
                  <h3>About Me</h3>
                  {editing ? (
                    <textarea
                      className="input-field bio-input"
                      defaultValue={user.bio}
                      rows={4}
                      id="bio-input"
                    />
                  ) : (
                    <p className="bio-text">{user.bio}</p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="glass-card stats-card">
                  <h3>Quick Stats</h3>
                  <div className="stats-grid">
                    {[
                      { label: "Total Chats", value: user.stats.totalChats, icon: "💬" },
                      { label: "Avg Duration", value: user.stats.avgDuration, icon: "⏱️" },
                      { label: "Good Vibes", value: user.stats.goodVibes, icon: "✨" },
                      { label: "Friends Made", value: user.stats.friendsMade, icon: "🤝" },
                    ].map((stat) => (
                      <div key={stat.label} className="stat-box">
                        <span className="stat-icon">{stat.icon}</span>
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div className="glass-card interests-card">
                  <h3>Interests</h3>
                  <div className="interests-wrap">
                    {user.interests.map((interest) => (
                      <span key={interest} className="tag">{interest}</span>
                    ))}
                  </div>
                </div>

                {/* Karma */}
                <div className="glass-card karma-card">
                  <h3>Karma Score</h3>
                  <div className="karma-display">
                    <span className="karma-big">{user.karma}</span>
                    <span className="karma-label">points</span>
                  </div>
                  <div className="karma-bar-wrap">
                    <div className="karma-bar">
                      <div
                        className="karma-fill"
                        style={{ width: `${Math.min((user.karma / 1000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="karma-next">Next: 500 pts (🏆 Legend)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="tab-content animate-fade-in">
              <div className="full-stats-grid">
                {[
                  { label: "Total Chats", value: user.stats.totalChats, icon: "💬", color: "var(--primary)" },
                  { label: "Avg Duration", value: user.stats.avgDuration, icon: "⏱️", color: "var(--accent)" },
                  { label: "Good Vibes Rate", value: user.stats.goodVibes, icon: "✨", color: "var(--success)" },
                  { label: "Report Rate", value: user.stats.reportRate, icon: "🛡️", color: "var(--success)" },
                  { label: "Match Accept", value: user.stats.matchAccept, icon: "🎯", color: "var(--warning)" },
                  { label: "Friends Made", value: user.stats.friendsMade, icon: "🤝", color: "#fd79a8" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card stat-full-card">
                    <div className="sfc-icon" style={{ background: `${stat.color}22`, border: `1px solid ${stat.color}44` }}>
                      {stat.icon}
                    </div>
                    <div className="sfc-value">{stat.value}</div>
                    <div className="sfc-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "interests" && (
            <div className="tab-content animate-fade-in">
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ marginBottom: "1rem" }}>Your Interests</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                  These help us find better matches for you
                </p>
                <div className="all-interests">
                  {[
                    "💻 Coding", "🚀 Startups", "🎮 Gaming", "📚 Research",
                    "🎵 Music", "🏀 Sports", "🎨 Design", "📸 Photography",
                    "✍️ Writing", "🎬 Film", "🧪 Science", "💰 Finance",
                    "🎭 Arts", "🌍 Travel", "🧘 Fitness", "📖 Reading",
                  ].map((interest) => (
                    <button
                      key={interest}
                      className={`interest-tag-btn ${user.interests.includes(interest) ? "selected" : ""}`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="tab-content animate-fade-in">
              <div className="settings-grid">
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ marginBottom: "1.5rem" }}>Account Settings</h3>
                  <div className="settings-form">
                    <div className="input-group">
                      <label className="input-label">Display Name</label>
                      <input type="text" className="input-field" defaultValue={user.name} id="settings-name" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email</label>
                      <input type="email" className="input-field" defaultValue={user.email} disabled id="settings-email" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Gender</label>
                      <select className="input-field" defaultValue={user.gender} id="settings-gender">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: "1rem" }}>Save Changes</button>
                  </div>
                </div>
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ marginBottom: "1.5rem" }}>Privacy & Safety</h3>
                  <div className="toggle-list">
                    {[
                      { label: "Show online status", checked: true },
                      { label: "Allow same college matches", checked: true },
                      { label: "Show interests on profile", checked: true },
                      { label: "Screenshot detection", checked: true },
                      { label: "Show college name", checked: false },
                    ].map((toggle) => (
                      <div key={toggle.label} className="toggle-item">
                        <span>{toggle.label}</span>
                        <label className="switch">
                          <input type="checkbox" defaultChecked={toggle.checked} />
                          <span className="slider" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .profile-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* Reuse sidebar styles */
        .sidebar {
          width: 240px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 40;
        }

        .sidebar-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sidebar-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .sidebar-title {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: var(--transition-fast);
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-elevated);
        }

        .nav-item.active {
          color: var(--primary-light);
          background: rgba(108, 92, 231, 0.1);
        }

        .nav-icon {
          font-size: 1.1rem;
        }

        /* Main */
        .profile-main {
          flex: 1;
          margin-left: 240px;
        }

        /* Header */
        .profile-header {
          position: relative;
        }

        .profile-cover {
          height: 180px;
          position: relative;
          overflow: hidden;
        }

        .cover-gradient {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3) 0%, rgba(0, 206, 201, 0.15) 100%);
        }

        .profile-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: -50px;
          padding-bottom: 1.5rem;
        }

        .profile-avatar-section {
          display: flex;
          gap: 1.5rem;
          align-items: flex-end;
        }

        .avatar-xl {
          width: 100px;
          height: 100px;
          font-size: 2rem;
          border: 4px solid var(--bg-primary);
          box-shadow: var(--shadow-lg);
        }

        .profile-name {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .profile-college {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .profile-year {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .profile-badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .profile-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        /* Tabs */
        .profile-tabs {
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .tabs-row {
          display: flex;
          gap: 0;
        }

        .tab-btn {
          padding: 1rem 1.5rem;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
          border-bottom: 2px solid transparent;
          transition: var(--transition-fast);
          cursor: pointer;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--primary-light);
          border-bottom-color: var(--primary);
        }

        /* Content */
        .profile-content {
          padding: 2rem;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .bio-card,
        .stats-card,
        .interests-card,
        .karma-card {
          padding: 1.75rem;
        }

        .bio-card h3,
        .stats-card h3,
        .interests-card h3,
        .karma-card h3 {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .bio-text {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .bio-input {
          width: 100%;
          resize: vertical;
          min-height: 80px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .stat-icon {
          font-size: 1.25rem;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 800;
          font-family: var(--font-mono);
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .interests-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .karma-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .karma-big {
          font-size: 3rem;
          font-weight: 900;
          font-family: var(--font-mono);
          background: var(--gradient-text);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .karma-label {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .karma-bar-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .karma-bar {
          height: 8px;
          background: var(--bg-elevated);
          border-radius: 4px;
          overflow: hidden;
        }

        .karma-fill {
          height: 100%;
          background: var(--gradient-button);
          border-radius: 4px;
          transition: width 1s ease;
        }

        .karma-next {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Full Stats */
        .full-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .stat-full-card {
          padding: 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .sfc-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .sfc-value {
          font-size: 2rem;
          font-weight: 900;
          font-family: var(--font-mono);
        }

        .sfc-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        /* Interests Tab */
        .all-interests {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .interest-tag-btn {
          padding: 0.6rem 1.15rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .interest-tag-btn:hover {
          border-color: var(--primary);
          color: var(--text-primary);
        }

        .interest-tag-btn.selected {
          background: rgba(108, 92, 231, 0.15);
          border-color: var(--primary);
          color: var(--primary-light);
        }

        /* Settings */
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .toggle-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .toggle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .switch {
          position: relative;
          width: 44px;
          height: 24px;
          display: inline-block;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 24px;
          transition: var(--transition-base);
        }

        .slider::before {
          content: '';
          position: absolute;
          height: 18px;
          width: 18px;
          left: 2px;
          bottom: 2px;
          background: var(--text-secondary);
          border-radius: 50%;
          transition: var(--transition-base);
        }

        .switch input:checked + .slider {
          background: var(--primary);
          border-color: var(--primary);
        }

        .switch input:checked + .slider::before {
          transform: translateX(20px);
          background: white;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
          .full-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
          .profile-main {
            margin-left: 0;
          }
          .profile-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .profile-avatar-section {
            flex-direction: column;
            align-items: flex-start;
          }
          .profile-content {
            padding: 1rem;
          }
          .full-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
