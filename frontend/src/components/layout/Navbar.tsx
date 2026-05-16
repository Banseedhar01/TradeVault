import { useStore } from '../../store';
import { useIsMobile } from '../../hooks/useIsMobile';

export const Navbar = () => {
  const { activeSection, setActiveSection } = useStore();
  const isMobile = useIsMobile();

  return (
    <nav
      className="glass-nav"
      style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: isMobile ? '0 16px' : '0 24px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/favicon.svg" width={isMobile ? 28 : 34} height={isMobile ? 28 : 34} style={{ flexShrink: 0 }} />
          {!isMobile && (
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.06em', lineHeight: 1, userSelect: 'none' }}>
              <span style={{ color: 'var(--text-1)' }}>TRADE</span>
              <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>VAULT</span>
            </span>
          )}
        </div>

        {/* Market toggle */}
        <div className="pill-group">
          <button
            className={`pill-tab ${activeSection === 'forex' ? 'active' : ''}`}
            onClick={() => setActiveSection('forex')}
            style={activeSection === 'forex' ? { color: '#60a5fa' } : {}}
          >
            {isMobile ? 'Forex' : 'Forex Prop'}
          </button>
          <button
            className={`pill-tab ${activeSection === 'futures' ? 'active' : ''}`}
            onClick={() => setActiveSection('futures')}
            style={activeSection === 'futures' ? { color: '#fbbf24' } : {}}
          >
            {isMobile ? 'Futures' : 'US Futures'}
          </button>
        </div>

        {/* Live dot */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: isMobile ? '6px 10px' : '6px 12px', borderRadius: 8,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.18)',
        }}>
          <span style={{ position: 'relative', display: 'flex', width: 7, height: 7 }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981',
              animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.6,
            }} />
            <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
          </span>
          {!isMobile && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Live
            </span>
          )}
        </div>

      </div>

      <style>{`
        @keyframes ping {
          75%,100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </nav>
  );
};
