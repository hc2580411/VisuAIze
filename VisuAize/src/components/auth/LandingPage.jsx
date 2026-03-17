import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Code, MessageCircle, BarChart, Zap, BookOpen, ArrowRight, ChevronRight } from 'lucide-react';
import './Auth.css';

export default function LandingPage() {
    const navigate = useNavigate();

    const features = [
        { icon: Play, title: 'Step-by-Step Playback', desc: 'Watch algorithms execute frame by frame with full variable tracking and state history.' },
        { icon: Code, title: 'Custom Code Evaluation', desc: 'Write your own implementations and see them interpreted into live visualizations.' },
        { icon: MessageCircle, title: 'AI-Powered Tutor', desc: 'Get instant explanations tailored to the exact algorithm you are exploring.' },
        { icon: BarChart, title: 'Complexity Insights', desc: 'Visualize Big-O time and space complexity curves side by side.' },
        { icon: Zap, title: 'Zero Setup', desc: 'Runs entirely in your browser — no installs, no downloads, just open and learn.' },
        { icon: BookOpen, title: 'Curated Library', desc: 'From arrays and linked lists to heaps and BSTs — all in one place.' },
    ];

    return (
        <div className="lp">
            {/* Nav */}
            <nav className="lp-nav">
                <div className="lp-brand">
                    <img src="/favicon.png" alt="VisuAize" className="lp-brand-icon" />
                    <span>Visu<span className="lp-accent">Aize</span></span>
                </div>
                <div className="lp-nav-actions">
                    <button className="lp-nav-signin" onClick={() => navigate('/login')}>Sign In</button>
                    <button className="lp-nav-cta" onClick={() => navigate('/signup')}>
                        Get Started <ChevronRight size={16} />
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="lp-hero">
                <div className="lp-hero-badge">
                    <Zap size={14} /> Interactive Algorithm Visualizer
                </div>
                <h1 className="lp-hero-title">
                    See Algorithms <span className="lp-primary-text">Come Alive</span>
                </h1>
                <p className="lp-hero-sub">
                    An interactive platform that transforms abstract code into vivid, step-by-step visual stories. Built for students, educators, and curious minds.
                </p>
                <div className="lp-hero-btns">
                    <button className="lp-btn-primary" onClick={() => navigate('/signup')}>
                        Start Learning <ArrowRight size={18} />
                    </button>
                    <button className="lp-btn-ghost" onClick={() => navigate('/login')}>
                        Returning User
                    </button>
                </div>

                {/* Visual element */}
                <div className="lp-hero-visual">
                    <div className="lp-code-mockup">
                        <div className="lp-mockup-bar">
                            <span className="lp-dot red"></span>
                            <span className="lp-dot yellow"></span>
                            <span className="lp-dot green"></span>
                            <span className="lp-mockup-title">bubbleSort.js</span>
                        </div>
                        <pre className="lp-mockup-code"><code>{`function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      }
    }
  }
  return arr;
}`}</code></pre>
                    </div>
                    <div className="lp-bars-mockup">
                        {[35, 65, 20, 80, 50, 45, 70, 30].map((h, i) => (
                            <div
                                key={i}
                                className="lp-bar"
                                style={{
                                    height: `${h}%`,
                                    animationDelay: `${i * 0.12}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="lp-features">
                <div className="lp-features-header">
                    <h2>Everything you need to <span className="lp-primary-text">understand algorithms</span></h2>
                    <p>A complete toolkit that turns algorithmic complexity into visual simplicity.</p>
                </div>
                <div className="lp-features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="lp-feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="lp-feature-icon">
                                <f.icon size={20} />
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Band */}
            <section className="lp-cta-band">
                <h2>Ready to visualize?</h2>
                <p>Create a free account and start exploring algorithms in seconds.</p>
                <button className="lp-btn-primary" onClick={() => navigate('/signup')}>
                    Create Free Account <ArrowRight size={18} />
                </button>
            </section>

            {/* Footer */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-brand">
                        <img src="/favicon.png" alt="VisuAize" style={{ height: 20, width: 20, objectFit: 'contain' }} />
                        <span>VisuAize</span>
                    </div>
                    <span className="lp-footer-copy">© 2026 VisuAize — Educational Platform</span>
                </div>
            </footer>
        </div>
    );
}
