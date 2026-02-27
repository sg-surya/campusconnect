"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`} id="navbar">
      <div className="navbar-inner container">
        <Link href="/" className="navbar-brand">
          <img src="/logo.png" alt="CampusConnect" className="navbar-logo" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'contain' }} />
          <span className="navbar-title">
            Campus<span className="gradient-text">Connect</span>
          </span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? "active" : ""}`}>
          <Link href="#features" className="nav-link" onClick={() => setMobileOpen(false)}>
            Features
          </Link>
          <Link href="#how-it-works" className="nav-link" onClick={() => setMobileOpen(false)}>
            How It Works
          </Link>
          <Link href="#safety" className="nav-link" onClick={() => setMobileOpen(false)}>
            Safety
          </Link>
          <Link href="/login" className="btn btn-ghost nav-link-btn">
            Log In
          </Link>
          <Link href="/signup" className="btn btn-primary nav-link-btn">
            🚀 Get Started
          </Link>
        </div>

        <button
          className="navbar-hamburger"
          id="menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${mobileOpen ? "open" : ""}`}></span>
          <span className={`hamburger-line ${mobileOpen ? "open" : ""}`}></span>
          <span className={`hamburger-line ${mobileOpen ? "open" : ""}`}></span>
        </button>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-navbar);
          padding: 1rem 0;
          transition: var(--transition-base);
        }

        .navbar-scrolled {
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          padding: 0.65rem 0;
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          z-index: 60;
        }

        .navbar-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          object-fit: contain;
        }

        .navbar-title {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link {
          padding: 0.5rem 1rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: var(--transition-fast);
          border-radius: var(--radius-sm);
        }

        .nav-link:hover {
          color: var(--text-primary);
        }

        .nav-link-btn {
          margin-left: 0.5rem;
        }

        .navbar-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          z-index: 60;
          padding: 4px;
        }

        .hamburger-line {
          width: 24px;
          height: 2px;
          background: var(--text-primary);
          border-radius: 2px;
          transition: var(--transition-base);
        }

        .hamburger-line.open:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .hamburger-line.open:nth-child(2) {
          opacity: 0;
        }
        .hamburger-line.open:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        @media (max-width: 768px) {
          .navbar-hamburger {
            display: flex;
          }

          .navbar-links {
            position: fixed;
            inset: 0;
            background: var(--bg-primary);
            flex-direction: column;
            justify-content: center;
            gap: 1.5rem;
            opacity: 0;
            pointer-events: none;
            transition: var(--transition-base);
            z-index: 55;
          }

          .navbar-links.active {
            opacity: 1;
            pointer-events: all;
          }

          .nav-link {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </nav>
  );
}
