import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '◈', title: 'Track Loans', desc: 'Monitor money given and taken with full transaction history' },
  { icon: '⊛', title: 'Auto Interest', desc: 'Calculate simple & compound interest dynamically in real-time' },
  { icon: '◫', title: 'Smart Reports', desc: 'Export transactions as PDF or Excel with one click' },
  { icon: '⊕', title: 'Reminders', desc: 'Never miss a due date with scheduled payment reminders' },
];

export default function WelcomePage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 99, 255, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Radial glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 48px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
      }}>
        <div>
          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>₹</span>
          <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginLeft: '8px' }}>Interest Calculator</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '100px 24px 80px',
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
          background: 'var(--accent-glow)', border: '1px solid rgba(108,99,255,0.3)',
          color: 'var(--accent)', fontSize: '13px', fontWeight: '600',
          marginBottom: '28px', letterSpacing: '0.5px',
        }}>
          ✦ Smart Finance Tracking
        </div>

        <h1 style={{
          fontSize: 'clamp(42px, 7vw, 88px)',
          fontWeight: '800',
          lineHeight: 1.05,
          letterSpacing: '-2px',
          marginBottom: '24px',
          maxWidth: '800px',
        }}>
          <span style={{ color: 'var(--text-primary)' }}>Track Every</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--green) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Rupee & Interest</span>
        </h1>

        <p style={{
          fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '520px',
          lineHeight: 1.7, marginBottom: '40px',
        }}>
          A complete loan management system. Track money lent and borrowed, auto-calculate interest, and stay on top of every due date.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started Free →
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            Sign In
          </Link>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: '0', marginTop: '72px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', overflow: 'hidden',
        }}>
          {[
            { label: 'Simple Interest', value: 'Auto-Calc' },
            { label: 'Compound Interest', value: 'Auto-Calc' },
            { label: 'Due Reminders', value: 'Built-in' },
            { label: 'PDF & Excel Export', value: '1-Click' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '20px 32px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        position: 'relative', zIndex: 10,
        padding: '0 48px 100px',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        <div className="grid-4" style={{ gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{
              textAlign: 'center',
              background: 'var(--bg-card)',
              animation: `fadeIn 0.4s ease ${i * 0.1}s both`,
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1 }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '0 24px 100px',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '60px 80px',
          maxWidth: '700px',
        }}>
          <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-1px' }}>
            Ready to take control?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
            Start tracking your loans and interest in seconds. No credit card required.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account →
          </Link>
        </div>
      </section>
    </div>
  );
}
