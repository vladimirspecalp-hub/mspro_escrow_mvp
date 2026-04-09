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
  buyer?: { username?: string; email?: string; name?: string }
  seller?: { username?: string; email?: string; name?: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:        { label: 'Ожидание',    color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  PENDING_REVIEW: { label: 'На проверке', color: '#9A3412', bg: '#FFF7ED', border: '#FDBA74' },
  FUNDED:         { label: 'Пополнена',   color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  IN_PROGRESS:    { label: 'В работе',    color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  DISPUTED:       { label: 'Спор',        color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
  COMPLETED:      { label: 'Завершена',   color: '#065F46', bg: '#ECFDF5', border: '#6EE7B7' },
  CANCELLED:      { label: 'Отменена',    color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600,
      color: cfg.color, backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

const STATS = [
  { value: '₽2.4B+', label: 'Объём сделок' },
  { value: '12 000+', label: 'Пользователей' },
  { value: '99.8%', label: 'Успешных сделок' },
  { value: '< 24ч', label: 'Решение споров' },
]

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L20 6V10C20 15.523 16.527 20.637 12 22C7.473 20.637 4 15.523 4 10V6L12 2Z" stroke="#0077FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12L11 14L15 10" stroke="#0077FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Надёжная защита средств',
    description: 'Деньги замораживаются на защищённом счёте до выполнения всех условий. Ни одна сторона не может получить средства без согласия другой.',
    accent: '#0077FF',
    accentBg: '#EFF6FF',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="1.8" />
        <path d="M12 6V12L16 14" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Быстрое проведение',
    description: 'Автоматизированный процесс эскроу — от создания сделки до выплаты за считанные минуты. Никаких задержек и ручной обработки.',
    accent: '#10B981',
    accentBg: '#ECFDF5',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'KYC верификация',
    description: 'Проверка личности всех участников сделки. Автоматическая верификация с риск-скорингом для максимальной безопасности.',
    accent: '#F59E0B',
    accentBg: '#FFFBEB',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 6H21M3 12H21M3 18H21" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="7" cy="6" r="2" fill="#8B5CF6" />
        <circle cx="12" cy="12" r="2" fill="#8B5CF6" />
        <circle cx="17" cy="18" r="2" fill="#8B5CF6" />
      </svg>
    ),
    title: 'Арбитраж споров',
    description: 'Опытная команда арбитров разрешает спорные ситуации в течение 24 часов. Прозрачный процесс с документированными решениями.',
    accent: '#8B5CF6',
    accentBg: '#F5F3FF',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Уведомления в реальном времени',
    description: 'Мгновенные уведомления в Telegram и на email о каждом изменении статуса сделки. Всегда в курсе событий.',
    accent: '#EC4899',
    accentBg: '#FDF2F8',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#0EA5E9" strokeWidth="1.8" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#0EA5E9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Шифрование AES-256',
    description: 'Все чувствительные данные защищены военным шифрованием. Регулярные аудиты безопасности и мониторинг в реальном времени.',
    accent: '#0EA5E9',
    accentBg: '#F0F9FF',
  },
]

const STEPS = [
  { num: '01', title: 'Создайте сделку', desc: 'Укажите стороны, сумму и детальное описание условий' },
  { num: '02', title: 'Внесите средства', desc: 'Покупатель переводит деньги на защищённый эскроу-счёт' },
  { num: '03', title: 'Выполните обязательства', desc: 'Продавец выполняет условия и подтверждает завершение' },
  { num: '04', title: 'Получите оплату', desc: 'После одобрения покупателя средства мгновенно переводятся' },
]

export default function HomePage() {
  const { user } = useAuth()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDeals()
      .then(setDeals)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(160deg, #0B1222 0%, #0F1E3A 40%, #0B1222 100%)',
        padding: '80px 0 72px',
        overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '-80px', left: '20%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,119,255,0.18) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '15%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }} />

        <Container>
          <div style={{ position: 'relative', maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px 5px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(0,119,255,0.3)',
              backgroundColor: 'rgba(0,119,255,0.1)',
              marginBottom: '28px',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', letterSpacing: '0.01em' }}>
                Защищённые эскроу-сделки · Россия
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 62px)',
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              marginBottom: '20px',
            }}>
              Безопасные сделки{' '}
              <span style={{
                background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #0077FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                с гарантией
              </span>
            </h1>

            {/* Subline */}
            <p style={{
              fontSize: '18px', color: '#94A3B8', lineHeight: 1.65,
              maxWidth: '560px', margin: '0 auto 36px',
            }}>
              MSPro Escrow защищает ваши средства на каждом этапе. Полная автоматизация, 
              KYC верификация, арбитраж споров и мгновенные уведомления.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href={user ? '/deals/new' : '/auth/register'} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', borderRadius: '12px',
                fontSize: '15px', fontWeight: 700, color: 'white',
                background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(0,119,255,0.4), 0 1px 4px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
                {user ? 'Создать сделку' : 'Начать бесплатно'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href={user ? '/deals' : '/auth/login'} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 24px', borderRadius: '12px',
                fontSize: '15px', fontWeight: 600, color: '#CBD5E1',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
              }}>
                {user ? 'Мои сделки' : 'Войти в аккаунт'}
              </Link>
            </div>

            {/* Trust chips */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '24px', flexWrap: 'wrap', marginTop: '36px',
            }}>
              {['Без скрытых комиссий', 'KYC верификация', 'Шифрование AES-256'].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M10.5 3.5L5.5 8.5L2.5 5.5" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────── */}
      <section style={{
        borderBottom: '1px solid #E2E8F0',
        backgroundColor: 'white',
        padding: '0',
      }}>
        <Container>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderLeft: '1px solid #F1F5F9',
          }}>
            {STATS.map((stat, i) => (
              <div key={stat.label} style={{
                padding: '24px 32px',
                borderRight: '1px solid #F1F5F9',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', backgroundColor: '#F8FAFC' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: '999px',
              backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
              fontSize: '12px', fontWeight: 600, color: '#0077FF',
              letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px',
            }}>
              Возможности платформы
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '14px' }}>
              Всё для безопасной сделки
            </h2>
            <p style={{ fontSize: '17px', color: '#64748B', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
              Комплексная защита участников сделки на каждом этапе с автоматизацией процессов
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {FEATURES.map((feature) => (
              <div key={feature.title} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '28px',
                transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  backgroundColor: feature.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.65 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section style={{ padding: '80px 0', backgroundColor: 'white' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: '999px',
              backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
              fontSize: '12px', fontWeight: 600, color: '#059669',
              letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '16px',
            }}>
              Процесс
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '14px' }}>
              Как проходит сделка
            </h2>
            <p style={{ fontSize: '17px', color: '#64748B', maxWidth: '460px', margin: '0 auto', lineHeight: 1.6 }}>
              Четыре простых шага от создания до получения средств
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', position: 'relative' }}>
            {/* Connector line */}
            <div style={{
              position: 'absolute', top: '40px', left: '12.5%', right: '12.5%', height: '1px',
              background: 'linear-gradient(90deg, #0077FF 0%, #E2E8F0 100%)',
              zIndex: 0,
            }} />

            {STEPS.map((step, i) => (
              <div key={step.num} style={{ padding: '0 16px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 20px',
                  background: i === 0
                    ? 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)'
                    : 'white',
                  border: `2px solid ${i === 0 ? '#0077FF' : '#E2E8F0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: i === 0 ? '0 4px 16px rgba(0,119,255,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <span style={{
                    fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em',
                    color: i === 0 ? 'white' : '#94A3B8',
                  }}>{step.num}</span>
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── RECENT DEALS ───────────────────────────────────────── */}
      <section style={{ padding: '80px 0', backgroundColor: '#F8FAFC' }}>
        <Container>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '6px' }}>
                Активные сделки
              </h2>
              <p style={{ fontSize: '15px', color: '#64748B' }}>
                Последние транзакции на платформе
              </p>
            </div>
            {user && (
              <Link href="/deals/new" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, color: 'white',
                background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,119,255,0.25)',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5V12.5M1.5 7H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Новая сделка
              </Link>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '3px solid #E2E8F0',
                borderTopColor: '#0077FF',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: '16px', fontSize: '14px', color: '#64748B' }}>Загрузка сделок...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              borderRadius: '16px',
              border: '1px solid #FECACA',
              backgroundColor: '#FEF2F2',
              padding: '32px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                backgroundColor: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#EF4444" strokeWidth="1.5" />
                  <path d="M10 6V11M10 13.5H10.01" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>Сервер недоступен</p>
              <p style={{ fontSize: '13px', color: '#EF4444' }}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && deals.length === 0 && (
            <div style={{
              backgroundColor: 'white', borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '64px 32px', textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 2L25 7V13C25 19.627 20.2 25.8 14 27.667C7.8 25.8 3 19.627 3 13V7L14 2Z" stroke="#0077FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.5 14L12.5 17L18.5 11" stroke="#0077FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                Сделок пока нет
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>
                Создайте первую безопасную сделку уже сегодня
              </p>
              <Link href={user ? '/deals/new' : '/auth/register'} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 24px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, color: 'white',
                background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,119,255,0.25)',
              }}>
                {user ? 'Создать сделку' : 'Зарегистрироваться'}
              </Link>
            </div>
          )}

          {/* Deals table */}
          {!loading && !error && deals.length > 0 && (
            <div style={{
              backgroundColor: 'white', borderRadius: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                padding: '12px 24px',
                borderBottom: '1px solid #F1F5F9',
                backgroundColor: '#FAFAFA',
              }}>
                {['#', 'Название / Участники', 'Сумма', 'Статус', 'Дата'].map((col) => (
                  <span key={col} style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    {col}
                  </span>
                ))}
              </div>
              {/* Rows */}
              {deals.map((deal, idx) => (
                <div key={deal.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr',
                  padding: '16px 24px',
                  borderBottom: idx < deals.length - 1 ? '1px solid #F8FAFC' : 'none',
                  alignItems: 'center',
                  transition: 'background-color 0.12s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#FAFBFF'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#64748B',
                  }}>
                    {deal.id}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '3px' }}>
                      {deal.title || `Сделка #${deal.id}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {deal.buyer?.username || deal.buyer?.email || `#${deal.buyerId}`}
                      {' → '}
                      {deal.seller?.username || deal.seller?.email || `#${deal.sellerId}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                      {Number(deal.amount).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{deal.currency || 'USD'}</div>
                  </div>
                  <div>
                    <StatusBadge status={deal.status} />
                  </div>
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                    {new Date(deal.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
      {!user && (
        <section style={{
          padding: '80px 0',
          background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.1,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
          <Container>
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>
                Готовы к первой безопасной сделке?
              </h2>
              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: '36px' }}>
                Присоединяйтесь к тысячам пользователей, которые уже проводят сделки с полной гарантией
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/auth/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 28px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 700, color: '#0077FF',
                  backgroundColor: 'white',
                  textDecoration: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}>
                  Создать аккаунт бесплатно
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/auth/login" style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '14px 24px', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  textDecoration: 'none',
                  backdropFilter: 'blur(8px)',
                }}>
                  Уже есть аккаунт
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}
    </div>
  )
}
