import Link from 'next/link'
import Container from './Container'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#E2E8F0] bg-white mt-auto">
      <Container>
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0077FF] to-[#0056CC] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1L16 5V9C16 12.866 12.866 16 9 16C5.134 16 2 12.866 2 9V5L9 1Z" fill="white" fillOpacity="0.9"/>
                    <path d="M6 9L8 11L12 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-base font-bold text-[#0F172A] tracking-tight">MSPro</span>
                  <span className="text-[10px] font-medium text-[#64748B] tracking-wider uppercase">Escrow</span>
                </div>
              </div>
              <p className="text-sm text-[#64748B] leading-relaxed max-w-xs">
                Безопасная платформа для проведения эскроу-сделок. Защита средств на всех этапах.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <a
                  href="https://t.me/MSPro_Escrow_Bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#64748B] transition-all hover:border-[#0077FF] hover:text-[#0077FF]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  @MSPro_Escrow_Bot
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-4">Платформа</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Как это работает', href: '#' },
                  { label: 'Тарифы', href: '#' },
                  { label: 'Безопасность', href: '#' },
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-[#64748B] hover:text-[#0077FF] transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-4">Пользователям</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Создать сделку', href: '/deals/new' },
                  { label: 'Мои сделки', href: '/deals' },
                  { label: 'Верификация KYC', href: '#' },
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-[#64748B] hover:text-[#0077FF] transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-4">Правовое</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Условия использования', href: '#' },
                  { label: 'Политика конфиденциальности', href: '#' },
                  { label: 'Документы', href: '#' },
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-[#64748B] hover:text-[#0077FF] transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#94A3B8]">
              © {year} MSPro Escrow. Все права защищены.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></div>
              <span className="text-xs text-[#64748B]">Система работает</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}
