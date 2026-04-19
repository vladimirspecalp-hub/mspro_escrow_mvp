'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'

const REG_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .reg-layout { display: flex; min-height: calc(100vh - 60px); }
  .reg-left {
    flex: 1;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    padding: 56px 48px;
    background: linear-gradient(160deg, #0B1222 0%, #0F1E3A 50%, #0B1222 100%);
    position: relative; overflow: hidden;
  }
  .reg-right {
    flex: 0 0 480px; width: 480px;
    display: flex; align-items: flex-start; justify-content: center;
    padding: 44px 52px;
    background-color: white;
    border-left: 1px solid #E2E8F0;
    overflow-y: auto;
  }
  .reg-feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .reg-name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 900px) {
    .reg-left { display: none; }
    .reg-right {
      flex: 1; width: 100%; border-left: none;
      padding: 36px 24px;
    }
  }
  @media (max-width: 480px) {
    .reg-right { padding: 24px 20px; }
    .reg-name-row { grid-template-columns: 1fr; gap: 18px; }
  }
`

export default function RegisterPage() {
  const router = useRouter()
  const { register, user } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) { router.push('/'); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.name, form.phone || undefined)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const pwStrength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : form.password.length < 14 ? 3 : 4

  const pwColors = ['#E2E8F0', '#EF4444', '#F59E0B', '#3B82F6', '#10B981']
  const pwLabels = ['', 'Слабый', 'Средний', 'Хороший', 'Отличный']

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #E2E8F0', backgroundColor: '#FAFAFA',
    fontSize: '14px', color: '#0F172A', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#0077FF'
    e.target.style.boxShadow = '0 0 0 3px rgba(0,119,255,0.12)'
    e.target.style.backgroundColor = 'white'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E2E8F0'
    e.target.style.boxShadow = 'none'
    e.target.style.backgroundColor = '#FAFAFA'
  }

  return (
    <>
      <style>{REG_CSS}</style>
      <div className="reg-layout">

        {/* Left panel */}
        <div className="reg-left">
          <div style={{ position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: 'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div style={{ position: 'absolute', top: '15%', left: '-10%', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,119,255,0.12) 0%, transparent 70%)' }} />

          <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
            <div className="reg-feat-grid">
              {[
                { icon: '🔒', title: 'Защита средств', desc: 'Эскроу-счёт до завершения' },
                { icon: '⚡', title: 'Быстро', desc: 'Сделка за минуты' },
                { icon: '✅', title: 'KYC', desc: 'Верификация личности' },
                { icon: '⚖️', title: 'Арбитраж', desc: 'Решение споров 24/7' },
              ].map((item) => (
                <div key={item.title} style={{
                  padding: '18px', borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '3px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: '10px', lineHeight: 1.2 }}>
              Присоединяйтесь к MSPro Escrow
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
              Более 12 000 пользователей уже проводят безопасные сделки с гарантией защиты средств
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="reg-right">
          <div style={{ width: '100%', maxWidth: '380px' }}>
            {/* Mobile logo */}
            <style>{`@media (max-width: 900px) { .reg-mobile-logo { display: flex !important; } }`}</style>
            <div className="reg-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0077FF, #0056CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,119,255,0.3)', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M10 2L18 6V10.5C18 14.9 14.5 19 10 20.5C5.5 19 2 14.9 2 10.5V6L10 2Z" fill="rgba(255,255,255,0.95)" /><path d="M7 10.5L9.5 13L13 8.5" stroke="#0077FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>MSPro Escrow</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Безопасные сделки</div>
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '7px' }}>
                Создать аккаунт
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B' }}>Заполните форму — это займёт меньше минуты</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px', borderRadius: '12px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5" /><path d="M8 5V8.5M8 11H8.01" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  <p style={{ fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              <div className="reg-name-row">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>Имя</label>
                  <input type="text" value={form.name} onChange={set('name')} required placeholder="Иван Иванов" disabled={loading} autoComplete="name" style={inputBase} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>
                    Телефон <span style={{ color: '#94A3B8', fontWeight: 400 }}>(опц.)</span>
                  </label>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+7 999 000-00-00" disabled={loading} autoComplete="tel" style={inputBase} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>Email</label>
                <input type="email" value={form.email} onChange={set('email')} required placeholder="your@email.com" disabled={loading} autoComplete="email" style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>Пароль</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Минимум 6 символов" minLength={6} disabled={loading} autoComplete="new-password" style={{ ...inputBase, paddingRight: '40px' }} onFocus={onFocus} onBlur={onBlur} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                    {showPassword
                      ? <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 2L15 15M7 7A2 2 0 0011 11M5 5C3.8 5.9 2.8 7.1 2.2 8.5c1.5 3.3 4.5 5.5 7.3 5.5.9 0 1.8-.2 2.6-.6M7.7 3.2C8 3.18 8.25 3.17 8.5 3.17c4.2 0 7 3.5 7 5.33 0 .8-.3 1.7-.9 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                      : <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M1.5 8.5C3.1 5.3 5.7 3.17 8.5 3.17S13.9 5.3 15.5 8.5C13.9 11.7 11.3 13.83 8.5 13.83S3.1 11.7 1.5 8.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><circle cx="8.5" cy="8.5" r="2.17" stroke="currentColor" strokeWidth="1.3" /></svg>
                    }
                  </button>
                </div>
                {form.password.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ flex: 1, height: '3px', borderRadius: '999px', backgroundColor: i <= pwStrength ? pwColors[pwStrength] : '#E2E8F0', transition: 'background-color 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: pwColors[pwStrength], fontWeight: 600 }}>{pwLabels[pwStrength]}</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 700, color: 'white',
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                boxShadow: loading ? 'none' : '0 2px 8px rgba(0,119,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px',
              }}>
                {loading
                  ? <><div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />Регистрация...</>
                  : 'Создать аккаунт'
                }
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>или</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            <Link href="/auth/login" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '12px', borderRadius: '10px',
              border: '1.5px solid #E2E8F0', backgroundColor: 'white',
              fontSize: '14px', fontWeight: 600, color: '#0F172A', textDecoration: 'none',
            }}>
              Уже есть аккаунт? Войти
            </Link>

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '18px', lineHeight: 1.5 }}>
              Регистрируясь, вы принимаете{' '}
              <a href="#" style={{ color: '#64748B', textDecoration: 'underline' }}>условия использования</a>
              {' '}и{' '}
              <a href="#" style={{ color: '#64748B', textDecoration: 'underline' }}>политику конфиденциальности</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
