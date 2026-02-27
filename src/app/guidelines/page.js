"use client";

import Link from "next/link";

export default function GuidelinesPage() {
    return (
        <div className="guidelines-wrapper" style={{ minHeight: "100vh", background: "#050505", color: "#e2e2e2", fontFamily: "'Inter', sans-serif", padding: "80px 40px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link href="/" style={{ color: "#8b5cf6", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", textDecoration: "none", display: "inline-block", marginBottom: "40px" }}>← Back to CampusConnect</Link>

                <h1 style={{ fontSize: "3rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px", marginBottom: "30px" }}>Community Guidelines</h1>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#444", marginBottom: "60px", letterSpacing: "2px" }}>CODE_OF_CONDUCT: STUDENT_PROTOCOL</div>

                <div style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", padding: "30px", marginBottom: "50px", borderRadius: "10px" }}>
                    <p style={{ color: "#8b5cf6", fontWeight: 700, fontSize: "14px", fontFamily: "'JetBrains Mono', monospace" }}>
                        CampusConnect is built on trust. As a verified student, you represent your institution. Act with dignity.
                    </p>
                </div>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>1. Respect the Match</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        Treat every peer you meet with professional respect. Whether it&apos;s a study partner or a co-founder, the goal is mutual growth. Negative behavior reflects poorly on your Social Karma.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>2. Zero-Tolerance for Toxicity</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        We have a zero-tolerance policy for hate speech, sexual harassment, and discriminatory behavior. Accounts reported for these violations will be permanently blacklisted across the CampusConnect network.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>3. Academic Integrity</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        While "Study Buddies" is for collaboration, do not use the platform for unauthorized assistance or cheating. Use the network to discuss concepts, not to compromise academic honesty.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>4. Reporting Violations</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        Use the built-in reporting features to alert moderators about inappropriate conduct. Our safety algorithms work 24/7, but community vigilence helps keep CampusConnect elite.
                    </p>
                </section>

                <footer style={{ marginTop: "100px", paddingTop: "40px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#333" }}>© 2026 CAMPUSCONNECT. CONDUCT_v1.</span>
                    <Link href="https://discord.gg/zNUtGNNmRG" target="_blank" style={{ color: "#8b5cf6", fontSize: "12px" }}>Report Conduct Issue</Link>
                </footer>
            </div>

            <style jsx global>{`
                body { margin: 0; background: #050505; }
                @media (max-width: 768px) {
                    .guidelines-wrapper { padding: 40px 20px !important; }
                    h1 { font-size: 2rem !important; }
                }
            `}</style>
        </div>
    );
}
