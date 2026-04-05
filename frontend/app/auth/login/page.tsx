'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) {
    router.push('/')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#F8FAFC]">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-20 left-20 h-56 w-56 rounded-full bg-[#0077FF]/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 h-40 w-40 rounded-full bg-[#0056CC]/15 blur-2xl" />
        <div className="relative z-10 max-w-sm text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0077FF] to-[#0056CC] shadow-xl shadow-[#0077FF]/30">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 3.333L36.667 11.667V20C36.667 29.667 29.333 38.667 20 41.667C10.667 38.667 3.333 29.667 3.333 20V11.667L20 3.333Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/>
              <path d="M13 21L17.5 25.5L27 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Добро пожаловать</h2>
          <p className="text-[#94A3B8] text-base leading-relaxed">
            Войдите в свой аккаунт для управления безопасными эскроу-сделками
          </p>
          <div className="mt-10 space-y-4">
            {[
              'Защита средств на каждом этапе',
              'Мгновенные Telegram-уведомления',
              'Арбитраж споров 24/7',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3 text-left">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0077FF]/20">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L5 8L2 5" stroke="#60AEFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-[#94A3B8]">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-8 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0077FF] to-[#0056CC]">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1L16 5V9C16 12.866 12.866 16 9 16C5.134 16 2 12.866 2 9V5L9 1Z" fill="white" fillOpacity="0.9"/>
                  <path d="M6 9L8 11L12 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-base font-bold text-[#0F172A]">MSPro Escrow</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Вход в аккаунт</h1>
            <p className="mt-1.5 text-sm text-[#64748B]">Введите ваши данные для входа</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5"/>
                  <path d="M8 5V8.5M8 11H8.01" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="text-sm text-[#991B1B]">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={loading}
                className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all focus:border-[#0077FF] focus:ring-2 focus:ring-[#0077FF]/20 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 pr-10 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all focus:border-[#0077FF] focus:ring-2 focus:ring-[#0077FF]/20 disabled:bg-[#F8FAFC] disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 2L14 14M6.586 6.586A2 2 0 0010.414 10.414M4.343 4.343C3.022 5.22 1.923 6.504 1.175 8c1.4 3.163 4.135 5.333 6.825 5.333.91 0 1.786-.213 2.596-.603M7.158 2.71C7.437 2.679 7.718 2.667 8 2.667c4 0 6.667 3.333 6.667 5.333 0 .782-.294 1.619-.833 2.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1.333 8c1.4-3.163 4.134-5.333 6.667-5.333S13.267 4.837 14.667 8c-1.4 3.163-4.134 5.333-6.667 5.333S2.733 11.163 1.333 8z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0077FF] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0056CC] hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                    <path d="M12 7C12 4.239 9.761 2 7 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Вход...
                </span>
              ) : 'Войти'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748B]">
            Нет аккаунта?{' '}
            <Link href="/auth/register" className="font-semibold text-[#0077FF] hover:text-[#0056CC] transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
