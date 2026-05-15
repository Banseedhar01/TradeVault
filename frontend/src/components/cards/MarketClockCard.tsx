import { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface Session {
  name: string;
  sourceTz: string;
  openH: number; openM: number;
  closeH: number; closeM: number;
  isOpen: boolean;
}

export const MarketClockCard = () => {
  const [now, setNow] = useState(new Date());
  const isMobile = useIsMobile();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Returns a Date whose .getHours()/.getMinutes() reflect the given timezone
  const toZone = (tz: string) => new Date(now.toLocaleString('en-US', { timeZone: tz }));

  // Converts market open/close hours (in sourceTz) → IST string, handling DST automatically
  const toIST = (hour: number, min: number, sourceTz: string): string => {
    const srcNow = toZone(sourceTz);
    const istNow = toZone('Asia/Kolkata');
    const offsetMs = istNow.getTime() - srcNow.getTime(); // IST − source TZ offset in ms

    const srcTime = new Date(srcNow);
    srcTime.setHours(hour, min, 0, 0);

    const istTime = new Date(srcTime.getTime() + offsetMs);
    const h = String(istTime.getHours()).padStart(2, '0');
    const m = String(istTime.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const sessions = (): Session[] => {
    const ny = toZone('America/New_York');
    const ld = toZone('Europe/London');
    const [nyH, nyM, ldH] = [ny.getHours(), ny.getMinutes(), ld.getHours()];
    const nyOpen = (nyH > 9 || (nyH === 9 && nyM >= 30)) && nyH < 16;
    const ldOpen = ldH >= 8 && ldH < 16;
    return [
      { name: 'New York',        sourceTz: 'America/New_York', openH: 9,  openM: 30, closeH: 16, closeM: 0,  isOpen: nyOpen },
      { name: 'London',          sourceTz: 'Europe/London',    openH: 8,  openM: 0,  closeH: 16, closeM: 30, isOpen: ldOpen },
      { name: 'NY/London Overlap', sourceTz: 'America/New_York', openH: 8, openM: 0, closeH: 12, closeM: 0,  isOpen: nyH >= 8 && nyH < 12 && ldOpen },
    ];
  };

  const msUntilOpen = (zone: Date, openH: number, openM: number): number => {
    const h = zone.getHours(), m = zone.getMinutes(), dow = zone.getDay();
    const pastOpen = h > openH || (h === openH && m >= openM);
    let add = 0;
    if (dow === 0) add = 1;
    else if (dow === 6) add = 2;
    else if (dow === 5 && pastOpen) add = 3;
    else if (pastOpen) add = 1;
    const next = new Date(zone);
    next.setDate(next.getDate() + add);
    next.setHours(openH, openM, 0, 0);
    return Math.max(next.getTime() - zone.getTime(), 0);
  };

  const nextSession = (): { name: string; time: string } => {
    const msNY = msUntilOpen(toZone('America/New_York'), 9, 30);
    const msLD = msUntilOpen(toZone('Europe/London'), 8, 0);
    const ms   = msNY <= msLD ? msNY : msLD;
    const name = msNY <= msLD ? 'New York' : 'London';
    const hh = Math.floor(ms / 3600000);
    const mm = Math.floor((ms % 3600000) / 60000);
    const ss = Math.floor((ms % 60000) / 1000);
    return { name, time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` };
  };

  const istTime = now.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const istDate = now.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata', weekday: 'long', month: 'short', day: 'numeric',
  });

  const list = sessions();
  const anyOpen = list.some(s => s.isOpen);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Market Clock</span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
          padding: '4px 10px', borderRadius: 6,
          background: anyOpen ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${anyOpen ? 'rgba(16,185,129,0.22)' : 'var(--border)'}`,
          color: anyOpen ? 'var(--green)' : 'var(--text-3)',
        }}>
          {anyOpen ? 'Market Open' : 'Closed'}
        </span>
      </div>

      <div className="card-body" style={{ gap: 14 }}>

        {/* Hero clock — IST */}
        <div className="panel" style={{ padding: isMobile ? '14px 12px' : '20px 16px', textAlign: 'center' }}>
          <div style={{
            fontFamily: "'SF Mono','Fira Code',monospace",
            fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 700, color: 'var(--text-1)',
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {istTime}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginTop: 6, letterSpacing: '0.04em' }}>
            {istDate} · IST
          </div>
        </div>

        {/* Sessions — times shown in IST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {list.map(s => (
            <div key={s.name} className="session-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: s.isOpen ? 'var(--green)' : 'var(--text-4)',
                  boxShadow: s.isOpen ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
                }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-1)' }}>{s.name}</div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-2)', marginTop: 1 }}>
                    {toIST(s.openH, s.openM, s.sourceTz)} – {toIST(s.closeH, s.closeM, s.sourceTz)} IST
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '3px 8px', borderRadius: 4,
                background: s.isOpen ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                color: s.isOpen ? 'var(--green)' : 'var(--text-4)',
              }}>
                {s.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          ))}
        </div>

        {/* Countdown */}
        {(() => {
          const { name, time } = nextSession();
          return (
            <div className="panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
              <span className="label" style={{ display: 'block', marginBottom: 6 }}>Next {name} Session Opens In</span>
              <span style={{
                fontFamily: "'SF Mono','Fira Code',monospace",
                fontSize: isMobile ? '1.25rem' : '1.625rem', fontWeight: 700, color: 'var(--blue)',
                letterSpacing: '-0.03em',
              }}>
                {time}
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
