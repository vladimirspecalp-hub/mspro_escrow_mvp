'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDeals } from '@/lib/api'
import Container from '@/components/Container'
import { useAuth } from '@/context/AuthContext'

interface Deal {
  id: number
  buyerId: number
  sellerId: number
  title?: string
  amount: number | string
  currency?: string
  status: string
  createdAt: string
  buyer?: { username?: string; email?: string }
  seller?: { username?: string; email?: string }
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING:        { label: 'Ожидание',     className: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]' },
  PENDING_REVIEW: { label: 'На проверке',  className: 'bg-[#FFF7ED] text-[#9A3412] border border-[#FDBA74]' },
  FUNDED:         { label: 'Пополнена',    className: 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]' },
  IN_PROGRESS:    { label: 'Выполняется',  className: 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]' },
  DISPUTED:       { label: 'Спор',         className: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' },
  COMPLETED:      { label: 'Завершена',    className: 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]' },
  CANCELLED:      { label: 'Отменена',     className: 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L20 6V10C20 15.523 16.527 20.637 12 22C7.473 20.637 4 15.523 4 10V6L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Надёжная защита',
    description: 'Средства заморожены на эскроу-счёте до выполнения всех условий сделки',
    color: 'text-[#0077FF]',
    bg: 'bg-[#EFF6FF]',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Быстрые сделки',
    description: 'Автоматизированный процесс эскроу — от создания до выплаты за минуты',
    color: 'text-[#F59E0B]',
    bg: 'bg-[#FFFBEB]',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Арбитраж споров',
    description: 'Опытная команда модераторов разрешает спорные ситуации справедливо',
    color: 'text-[#10B981]',
    bg: 'bg-[#ECFDF5]',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Создайте сделку', desc: 'Укажите условия, сумму и стороны сделки' },
  { step: '02', title: 'Покупатель вносит средства', desc: 'Деньги замораживаются на безопасном эскроу-счёте' },
  { step: '03', title: 'Продавец выполняет условия', desc: 'Исполнитель подтверждает выполнение своих обязательств' },
  { step: '04', title: 'Средства переводятся', desc: 'После подтверждения покупателем деньги поступают продавцу' },
]

export default function HomePage() {
  const { user } = useAuth()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDeals() {
      try {
        const data = await getDeals()
        setDeals(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }
    loadDeals()
  }, [])

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] py-20 md:py-28">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-[#0077FF]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#0056CC]/10 blur-3xl" />

        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0077FF]/30 bg-[#0077FF]/10 px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-medium text-[#94A3B8]">Защищённые эскроу-сделки</span>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Безопасные сделки{' '}
              <span className="bg-gradient-to-r from-[#0077FF] to-[#60AEFF] bg-clip-text text-transparent">
                с гарантией
              </span>
            </h1>
            <p className="mb-10 text-lg text-[#94A3B8] leading-relaxed">
              MSPro Escrow защищает ваши средства на каждом этапе сделки. 
              Полная автоматизация, арбитраж споров и мгновенные уведомления.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/deals/new"
                    className="w-full sm:w-auto rounded-xl bg-[#0077FF] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0077FF]/25 transition-all hover:bg-[#0056CC] hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Создать сделку
                  </Link>
                  <Link
                    href="/deals"
                    className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    Мои сделки
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="w-full sm:w-auto rounded-xl bg-[#0077FF] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0077FF]/25 transition-all hover:bg-[#0056CC] hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Начать бесплатно
                  </Link>
                  <Link
                    href="/auth/login"
                    className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    Войти в аккаунт
                  </Link>
                </>
              )}
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-[#64748B]">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11.667 3.5L5.833 9.333 2.333 5.833" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Без скрытых комиссий
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11.667 3.5L5.833 9.333 2.333 5.833" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                KYC верификация
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11.667 3.5L5.833 9.333 2.333 5.833" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Telegram уведомления
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 bg-[#F8FAFC]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-base font-bold text-[#0F172A]">{feature.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 bg-white">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Как это работает</h2>
            <p className="mt-2 text-[#64748B]">Простой и прозрачный процесс в четыре шага</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, index) => (
              <div key={item.step} className="relative">
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-[#E2E8F0] to-transparent z-0 -translate-x-1/2" />
                )}
                <div className="relative z-10 text-center p-6 rounded-2xl border border-[#E2E8F0] bg-white">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]">
                    <span className="text-lg font-black text-[#0077FF]">{item.step}</span>
                  </div>
                  <h4 className="mb-2 text-sm font-bold text-[#0F172A]">{item.title}</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 bg-[#F8FAFC]">
        <Container>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Активные сделки</h2>
              <p className="mt-1 text-sm text-[#64748B]">Последние сделки на платформе</p>
            </div>
            {user && (
              <Link
                href="/deals/new"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#0077FF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0056CC] hover:shadow-md"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.167V12.833M1.167 7h11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Новая сделка
              </Link>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#E2E8F0] border-t-[#0077FF]" style={{borderWidth: '3px'}} />
              <p className="mt-3 text-sm text-[#64748B]">Загрузка сделок...</p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEE2E2]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 7V10M10 13H10.01M2.93 16.07A2 2 0 012 14.41V5.59a2 2 0 01.93-1.66L9 .33a2 2 0 012 0l6.07 3.6A2 2 0 0118 5.59v8.82a2 2 0 01-.93 1.66L11 19.67a2 2 0 01-2 0L2.93 16.07z" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#991B1B]">Не удалось загрузить сделки</p>
              <p className="mt-1 text-xs text-[#EF4444]">{error}</p>
            </div>
          )}

          {!loading && !error && deals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2.333L25.667 8.167V13.3C25.667 19.9 20.533 26.017 14 27.667C7.467 26.017 2.333 19.9 2.333 13.3V8.167L14 2.333Z" stroke="#0077FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.333 14L12.333 17L18.667 11" stroke="#0077FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-[#0F172A]">Нет активных сделок</p>
              <p className="mt-1 text-sm text-[#64748B]">Создайте первую сделку, чтобы начать</p>
              {!user && (
                <Link
                  href="/auth/register"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0077FF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0056CC]"
                >
                  Зарегистрироваться
                </Link>
              )}
            </div>
          )}

          {!loading && !error && deals.length > 0 && (
            <div className="space-y-3">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1] hover:-translate-y-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-sm font-bold text-[#0077FF]">
                      #{deal.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {deal.title || `Сделка #${deal.id}`}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {deal.buyer?.username || `Покупатель #${deal.buyerId}`}
                        {' → '}
                        {deal.seller?.username || `Продавец #${deal.sellerId}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-4">
                    <StatusBadge status={deal.status} />
                    <div className="text-right hidden sm:block">
                      <p className="text-base font-bold text-[#0F172A]">
                        {Number(deal.amount).toLocaleString('ru-RU', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-[#94A3B8]">{deal.currency || 'USD'}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#CBD5E1] group-hover:text-[#0077FF] transition-colors flex-shrink-0">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {!user && (
        <section className="py-16 bg-gradient-to-br from-[#0077FF] to-[#0056CC]">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-white md:text-3xl tracking-tight">
                Готовы провести безопасную сделку?
              </h2>
              <p className="mt-3 text-[#BFDBFE] text-base">
                Зарегистрируйтесь бесплатно и создайте первую эскроу-сделку уже сегодня
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/register"
                  className="w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-[#0077FF] shadow-lg transition-all hover:bg-[#F8FAFC] hover:shadow-xl hover:-translate-y-0.5"
                >
                  Создать аккаунт
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Уже есть аккаунт?
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}
    </div>
  )
}
