'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Container from './Container'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'

export default function Header() {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => pathname === href

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid',
        borderColor: scrolled ? '#E2E8F0' : 'transparent',
        backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'all 0.2s ease',
      }}
    >
      <Container>
        <div style={{ display: 'flex', height: '64px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,119,255,0.3)',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 6V10.5C18 14.9 14.5 19 10 20.5C5.5 19 2 14.9 2 10.5V6L10 2Z"
                  fill="rgba(255,255,255,0.95)" />
                <path d="M7 10.5L9.5 13L13 8.5" stroke="#0077FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', display: 'block' }}>MSPro</span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginTop: '1px' }}>Escrow</span>
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              { href: '/', label: 'Главная' },
              ...(user ? [{ href: '/deals', label: 'Сделки' }] : []),
              ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Панель' }] : []),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: isActive(link.href) ? 600 : 500,
                  color: isActive(link.href) ? '#0077FF' : '#64748B',
                  backgroundColor: isActive(link.href) ? 'rgba(0,119,255,0.08)' : 'transparent',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth zone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!loading && (
              user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 12px 6px 8px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0077FF, #0056CC)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
                    }}>
                      {(user.name || user.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ lineHeight: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        {user.name || user.email?.split('@')[0]}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => logout()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '9px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      fontSize: '13px', fontWeight: 500, color: '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5.25 12.25H2.917A1.167 1.167 0 011.75 11.083V2.917A1.167 1.167 0 012.917 1.75H5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M9.333 10.5L12.25 7l-2.917-3.5M12.25 7H5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Выйти
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link
                    href="/auth/login"
                    style={{
                      padding: '8px 16px', borderRadius: '9px',
                      fontSize: '14px', fontWeight: 500, color: '#64748B',
                      textDecoration: 'none', transition: 'color 0.15s',
                    }}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/auth/register"
                    style={{
                      padding: '8px 18px', borderRadius: '9px',
                      fontSize: '14px', fontWeight: 600, color: 'white',
                      background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                      textDecoration: 'none',
                      boxShadow: '0 1px 4px rgba(0,119,255,0.3)',
                      transition: 'all 0.15s ease',
                    }}
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
