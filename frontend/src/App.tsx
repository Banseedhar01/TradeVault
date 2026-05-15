import { Layout } from './components/layout/Layout'
import { PropFirmCard } from './components/cards/PropFirmCard'
import { MarketClockCard } from './components/cards/MarketClockCard'
import { TradeLogCard } from './components/cards/TradeLogCard'
import { TradingCalendarCard } from './components/cards/TradingCalendarCard'
import { PerformanceCard } from './components/cards/PerformanceCard'
import { RiskCalculatorCard } from './components/cards/RiskCalculatorCard'
import { AccountSelectorBar } from './components/layout/AccountSelectorBar'
import { AddFirmForm } from './components/forms/AddFirmForm'
import { AddAccountForm } from './components/forms/AddAccountForm'
import { AddTradeForm } from './components/forms/AddTradeForm'
import { AccountDetailPage } from './components/pages/AccountDetailPage'
import { useStore } from './store'
import { useFirms } from './hooks/useFirms'
import { useAccounts } from './hooks/useAccounts'
import { useIsMobile } from './hooks/useIsMobile'

function App() {
  const { activeSection, detailAccountId, setAddFirmOpen } = useStore()
  const { data: firms, isLoading: firmsLoading } = useFirms()
  const { data: accounts } = useAccounts()
  const isMobile = useIsMobile()

  const sectionFirms = firms?.filter(f => f.market_type === activeSection) || []
  const sectionAccounts = accounts?.filter(a =>
    firms?.find(f => f.id === a.firm_id)?.market_type === activeSection
  ) || []

  const accentColor = activeSection === 'forex' ? '#3b82f6' : '#f59e0b'

  if (detailAccountId) return <AccountDetailPage />

  return (
    <Layout>
      <div style={{ width: '100%', padding: isMobile ? '16px 16px 32px' : '28px 24px 40px', boxSizing: 'border-box' }}>

        {/* ── Prop Firm Row ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 3, height: 14, borderRadius: 99, background: accentColor, flexShrink: 0, display: 'block' }} />
            <span className="label" style={{ color: accentColor }}>
              {activeSection === 'forex' ? 'Forex Prop Firms' : 'US Futures Prop Firms'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {firmsLoading
              ? Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse" style={{
                    flexShrink: 0, width: 300, height: 280, borderRadius: 14,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }} />
                ))
              : sectionFirms.length === 0
                ? (
                  <div style={{
                    flex: 1, padding: '48px 0', borderRadius: 14,
                    border: '1px dashed rgba(255,255,255,0.08)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
                  }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No prop firms added yet</span>
                    <button
                      onClick={() => setAddFirmOpen(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                        background: accentColor, border: 'none',
                        color: '#fff', fontSize: '0.8125rem', fontWeight: 600,
                      }}
                    >
                      + Add Firm
                    </button>
                  </div>
                )
                : sectionFirms.flatMap(firm => {
                    const firmAccounts = sectionAccounts.filter(a => a.firm_id === firm.id);
                    if (firmAccounts.length === 0) {
                      return [<PropFirmCard key={firm.id} firm={firm} accounts={[]} />];
                    }
                    return firmAccounts.map(account => (
                      <PropFirmCard key={account.id} firm={firm} accounts={[account]} />
                    ));
                  })
            }
          </div>
        </section>

        {/* ── Account Selector ── */}
        <AccountSelectorBar />

        {/* ── Bento Grid ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Market Clock (1/3) + Risk Calculator (2/3) */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 16 }}>
            <MarketClockCard />
            <RiskCalculatorCard />
          </div>

          {/* Row 2: Trade Log full width */}
          <TradeLogCard />

          {/* Row 3: Calendar + Performance — equal width */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <TradingCalendarCard />
            <PerformanceCard />
          </div>
        </div>

      </div>


      <AddFirmForm />
      <AddAccountForm />
      <AddTradeForm />
    </Layout>
  )
}

export default App
