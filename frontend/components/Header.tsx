'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Container from './Container'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Главная' },
    ...(user ? [{ href: '/deals', label: 'Сделки' }] : []),
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Администрирование' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0077FF] to-[#0056CC] shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 1L16 5V9C16 12.866 12.866 16 9 16C5.134 16 2 12.866 2 9V5L9 1Z" fill="white" fillOpacity="0.9"/>
                <path d="M6 9L8 11L12 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-[#0F172A] tracking-tight">MSPro</span>
              <span className="text-[10px] font-medium text-[#64748B] tracking-wider uppercase">Escrow</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname === link.href
                    ? 'bg-[#EFF6FF] text-[#0077FF]'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0077FF] text-[11px] font-bold text-white">
                      {(user.name || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-[#0F172A] leading-tight">{user.name || user.email}</p>
                      <p className="text-[10px] text-[#64748B] leading-tight">{user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#64748B] transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5.25 12.25H2.917A1.167 1.167 0 011.75 11.083V2.917A1.167 1.167 0 012.917 1.75H5.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.333 10.5L12.25 7l-2.917-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12.25 7H5.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <span className="hidden sm:inline">Выйти</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="rounded-xl px-4 py-2 text-sm font-medium text-[#64748B] transition-all duration-150 hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-xl bg-[#0077FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#0056CC] hover:shadow-md"
                  >
                    Регистрация
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}
