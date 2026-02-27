import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <img src="/logo.png" alt="CampusConnect" className="footer-logo" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'contain' }} />
              <span className="footer-title">
                Campus<span className="gradient-text">Connect</span>
              </span>
            </div>
            <p className="footer-desc">
              India's first verified college-only random chat & networking platform.
              Safe. Moderated. Built for students.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter" className="social-icon">𝕏</a>
              <a href="#" aria-label="Instagram" className="social-icon">📸</a>
              <a href="#" aria-label="LinkedIn" className="social-icon">in</a>
              <a href="#" aria-label="Discord" className="social-icon">💬</a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Product</h4>
            <Link href="#features">Features</Link>
            <Link href="#safety">Safety</Link>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="/signup">Get Started</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Company</h4>
            <Link href="#">About Us</Link>
            <Link href="#">Blog</Link>
            <Link href="#">Careers</Link>
            <Link href="#">Contact</Link>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Legal</h4>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Use</Link>
            <Link href="#">Community Guidelines</Link>
            <Link href="#">Cookie Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 CampusConnect. All rights reserved.</p>
          <p className="footer-tagline">
            Made with 💜 for students, by students.
          </p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: var(--bg-secondary);
          border-top: 1px solid var(--border);
          padding: 4rem 0 2rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
        }

        .footer-logo-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .footer-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          object-fit: contain;
        }

        .footer-title {
          font-size: 1.2rem;
          font-weight: 800;
        }

        .footer-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.7;
          margin-bottom: 1.25rem;
          max-width: 320px;
        }

        .footer-social {
          display: flex;
          gap: 0.75rem;
        }

        .social-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          transition: var(--transition-fast);
        }

        .social-icon:hover {
          border-color: var(--primary);
          background: rgba(108, 92, 231, 0.1);
          transform: translateY(-2px);
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .footer-heading {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .footer-col a {
          color: var(--text-secondary);
          font-size: 0.9rem;
          transition: var(--transition-fast);
        }

        .footer-col a:hover {
          color: var(--primary-light);
          padding-left: 4px;
        }

        .footer-bottom {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .footer-tagline {
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
