'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'

const TRUST_POINTS = [
  'Шифрование банковского уровня AES-256',
  'KYC верификация всех участников',
  'Арбитраж споров 24/7',
  'Telegram-уведомления в реальном времени',
]

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) { router.push('/'); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {/* Left panel */}
      <div style={{
        flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '64px 48px',
        background: 'linear-gradient(160deg, #0B1222 0%, #0F1E3A 50%, #0B1222 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.35,
          backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,119,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '380px', width: '100%' }}>
          {/* Icon */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(0,119,255,0.35)',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 3L31 9V17C31 25.2 25.5 33 18 35.5C10.5 33 5 25.2 5 17V9L18 3Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
              <path d="M12 18L16 22L24 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.15 }}>
            Добро пожаловать в MSPro Escrow
          </h2>
          <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.65, marginBottom: '40px' }}>
            Платформа безопасных сделок с гарантией защиты средств на каждом этапе
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {TRUST_POINTS.map((point) => (
              <div key={point} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '7px', flexShrink: 0,
                  backgroundColor: 'rgba(0,119,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L5 8.5L2 5.5" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.4 }}>{point}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '40px',
          }}>
            {[
              { value: '12K+', label: 'Пользователей' },
              { value: '99.8%', label: 'Успешных сделок' },
            ].map((s) => (
              <div key={s.label} style={{
                padding: '16px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div style={{
        flex: '0 0 480px', width: '480px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px',
        backgroundColor: 'white',
        borderLeft: '1px solid #E2E8F0',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Вход в аккаунт
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              Введите ваши данные для входа на платформу
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '14px 16px', borderRadius: '12px',
                border: '1px solid #FECACA', backgroundColor: '#FEF2F2',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5" />
                  <path d="M8 5V8.5M8 11H8.01" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={loading}
                autoComplete="email"
                style={{
                  width: '100%', padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #E2E8F0',
                  backgroundColor: '#FAFAFA',
                  fontSize: '14px', color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0077FF'
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,119,255,0.12)'
                  e.target.style.backgroundColor = 'white'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0'
                  e.target.style.boxShadow = 'none'
                  e.target.style.backgroundColor = '#FAFAFA'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Пароль</label>
                <a href="#" style={{ fontSize: '12px', color: '#0077FF', textDecoration: 'none' }}>Забыли пароль?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '11px 40px 11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#FAFAFA',
                    fontSize: '14px', color: '#0F172A',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0077FF'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,119,255,0.12)'
                    e.target.style.backgroundColor = 'white'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0'
                    e.target.style.boxShadow = 'none'
                    e.target.style.backgroundColor = '#FAFAFA'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
                    color: '#94A3B8', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                      <path d="M2 2L15 15M7 7A2 2 0 0011 11M5 5C3.8 5.9 2.8 7.1 2.2 8.5c1.5 3.3 4.5 5.5 7.3 5.5.9 0 1.8-.2 2.6-.6M7.7 3.2C8 3.18 8.25 3.17 8.5 3.17c4.2 0 7 3.5 7 5.33 0 .8-.3 1.7-.9 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                      <path d="M1.5 8.5C3.1 5.3 5.7 3.17 8.5 3.17S13.9 5.3 15.5 8.5C13.9 11.7 11.3 13.83 8.5 13.83S3.1 11.7 1.5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <circle cx="8.5" cy="8.5" r="2.17" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '10px',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 700, color: 'white',
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(0,119,255,0.3)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  Входим...
                </>
              ) : 'Войти в аккаунт'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>или</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Register link */}
          <Link href="/auth/register" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '12px',
            borderRadius: '10px',
            border: '1.5px solid #E2E8F0',
            backgroundColor: 'white',
            fontSize: '14px', fontWeight: 600, color: '#0F172A',
            textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}>
            Создать новый аккаунт
          </Link>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '24px', lineHeight: 1.5 }}>
            Входя в систему, вы соглашаетесь с{' '}
            <a href="#" style={{ color: '#64748B', textDecoration: 'underline' }}>условиями использования</a>
          </p>
        </div>
      </div>
    </div>
  )
}
