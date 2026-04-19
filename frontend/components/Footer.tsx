import Link from 'next/link'
import Container from './Container'

export default function Footer() {
  const year = new Date().getFullYear()

  const sections = [
    {
      title: 'Платформа',
      links: [
        { label: 'Как это работает', href: '#' },
        { label: 'Тарифы', href: '#' },
        { label: 'Безопасность', href: '#' },
        { label: 'API документация', href: '#' },
      ],
    },
    {
      title: 'Пользователям',
      links: [
        { label: 'Создать сделку', href: '/deals/new' },
        { label: 'Мои сделки', href: '/deals' },
        { label: 'KYC верификация', href: '#' },
        { label: 'Поддержка', href: '#' },
      ],
    },
    {
      title: 'Правовое',
      links: [
        { label: 'Условия использования', href: '#' },
        { label: 'Конфиденциальность', href: '#' },
        { label: 'Лицензии', href: '#' },
        { label: 'Документы', href: '#' },
      ],
    },
  ]

  return (
    <footer style={{ borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
      <style>{`
        .ft-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 40px;
        }
        .ft-bottom {
          padding-top: 24px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        @media (max-width: 900px) {
          .ft-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 540px) {
          .ft-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .ft-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>

      <Container>
        <div style={{ padding: '48px 0 32px' }}>
          <div className="ft-grid">
            {/* Brand */}
            <div>
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,119,255,0.25)',
                }}>
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L18 6V10.5C18 14.9 14.5 19 10 20.5C5.5 19 2 14.9 2 10.5V6L10 2Z" fill="rgba(255,255,255,0.95)" />
                    <path d="M7 10.5L9.5 13L13 8.5" stroke="#0077FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ lineHeight: 1 }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', display: 'block' }}>MSPro</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginTop: '1px' }}>ESCROW</span>
                </div>
              </Link>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, maxWidth: '260px', marginBottom: '20px' }}>
                Безопасная платформа для эскроу-сделок с гарантированной защитой средств и арбитражем.
              </p>
              <a href="https://t.me/MSPro_Escrow_Bot" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '8px',
                border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC',
                fontSize: '13px', fontWeight: 500, color: '#0F172A', textDecoration: 'none',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#229ED9">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                @MSPro_Escrow_Bot
              </a>
            </div>

            {sections.map((section) => (
              <div key={section.title}>
                <h4 style={{
                  fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px',
                }}>
                  {section.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} style={{ fontSize: '14px', color: '#64748B', textDecoration: 'none' }}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="ft-bottom">
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>
              © {year} MSPro Escrow. Все права защищены.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span style={{ fontSize: '13px', color: '#64748B' }}>Система работает в штатном режиме</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}
