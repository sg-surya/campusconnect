"use client";

import Link from "next/link";

export default function TermsPage() {
    return (
        <div style={{ minHeight: "100vh", background: "#050505", color: "#e2e2e2", fontFamily: "'Inter', sans-serif", padding: "80px 40px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link href="/" style={{ color: "#8b5cf6", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", textDecoration: "none", display: "inline-block", marginBottom: "40px" }}>← Back to CampusConnect</Link>

                <h1 style={{ fontSize: "3rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-3px", marginBottom: "30px" }}>Terms of Use</h1>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#444", marginBottom: "60px", letterSpacing: "2px" }}>STATUS: ENFORCED_GLOBAL_v1.0</div>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>1. Eligibility</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        CampusConnect is strictly for current university students. You must have a valid and active college email address from a supported institution. Impersonation or using unauthorized access keys is a violation of our terms.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>2. Prohibited Conduct</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        You agree not to engage in:
                        <ul style={{ marginTop: "15px", listStyleType: "'› '" }}>
                            <li>Broadcasting illegal or copyrighted content.</li>
                            <li>Harassment, bullying, or hate speech toward other students.</li>
                            <li>Recording other users without explicit written consent.</li>
                            <li>Using automated bots or scraping tools.</li>
                        </ul>
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>3. Accountability</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        Since every account is tied to a verified college identity, CampusConnect reserves the right to report serious policy violations to the respective university administration or law enforcement if required for safety.
                    </p>
                </section>

                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "1.2rem", color: "#fff", fontWeight: 800, marginBottom: "20px", textTransform: "uppercase" }}>4. Termination</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}>
                        CampusConnect reserves the right to suspend or terminate accounts that lower community standards or violate safety protocols. Social Karma scores reflect your standing within the community.
                    </p>
                </section>

                <footer style={{ marginTop: "100px", paddingTop: "40px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#333" }}>© 2026 CAMPUSCONNECT. TERMS_v1.</span>
                    <Link href="https://discord.gg/zNUtGNNmRG" target="_blank" style={{ color: "#8b5cf6", fontSize: "12px" }}>Legal Support</Link>
                </footer>
            </div>

            <style jsx global>{`
                body { margin: 0; background: #050505; }
            `}</style>
        </div>
    );
}
