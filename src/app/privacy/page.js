"use client";

import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="privacy-wrapper" style={{ minHeight: "100vh", background: "#050505", color: "#e2e2e2", fontFamily: "'Inter', sans-serif", padding: "80px 40px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link href="/" style={{ color: "#8b5cf6", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", textDecoration: "none", display: "inline-block", marginBottom: "40px" }}>← Back to CampusConnect</Link>

                <h1 style={{ fontSize: "3rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px", marginBottom: "30px" }}>Privacy Policy</h1>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#444", marginBottom: "60px", letterSpacing: "2px" }}>LAST_UPDATED: 2026_02_27</div>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>1. Data Collection</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        We collect minimal personal data required for platform functionality. This includes your name, college email address, branch of study, and interests. We use college email verification to ensure an exclusive student-only network.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>2. Video Sessions</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        Video matching sessions are peer-to-peer (P2P) in nature. We do not record or store your video streams. AI-based moderation may scan frames locally or in temporary buffers to detect policy violations (NSFW/Harassment) to ensure community safety.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>3. Data Sharing</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        We do not sell your personal information. Your profile data is only visible to your matched partners during active sessions to facilitate networking.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>4. Security</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        We implement industry-standard security measures to protect your account. Since our platform is identity-based, any misuse is traceable to the verified college identity for accountability.
                    </p>
                </section>

                <footer style={{ marginTop: "100px", paddingTop: "40px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#333" }}>© 2026 CAMPUSCONNECT. LEGAL_DOC_V1.</span>
                    <Link href="https://discord.gg/zNUtGNNmRG" target="_blank" style={{ color: "#8b5cf6", fontSize: "12px" }}>Contact Support</Link>
                </footer>
            </div>

            <style jsx global>{`
                body { margin: 0; background: #050505; }
                @media (max-width: 768px) {
                    .privacy-wrapper { padding: 40px 20px !important; }
                    h1 { font-size: 2rem !important; }
                }
            `}</style>
        </div>
    );
}
