'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Container from './Container'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'

const HDR_CSS = `
  .hdr-nav { display: flex; align-items: center; gap: 4px; }
  .hdr-auth { display: flex; align-items: center; gap: 8px; }
  .hdr-burger { display: none !important; }
  .hdr-mobile-panel { display: none; }
  @media (max-width: 768px) {
    .hdr-nav { display: none !important; }
    .hdr-auth { display: none !important; }
    .hdr-burger { display: flex !important; }
    .hdr-mobile-panel { display: block; }
  }
`

export default function Header() {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const isActive = (href: string) => pathname === href

  const navLinks = [
    { href: '/', label: 'Главная' },
    ...(user ? [{ href: '/deals', label: 'Сделки' }] : []),
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Панель' }] : []),
  ]

  return (
    <>
      <style>{HDR_CSS}</style>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: `1px solid ${scrolled || menuOpen ? '#E2E8F0' : 'transparent'}`,
        backgroundColor: scrolled || menuOpen ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'all 0.2s ease',
      }}>
        <Container>
          <div style={{ display: 'flex', height: '60px', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,119,255,0.3)', flexShrink: 0,
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

            {/* Desktop Nav */}
            <nav className="hdr-nav">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '6px 14px', borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: isActive(link.href) ? 600 : 500,
                  color: isActive(link.href) ? '#0077FF' : '#64748B',
                  backgroundColor: isActive(link.href) ? 'rgba(0,119,255,0.08)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hdr-auth">
              {!loading && (
                user ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '5px 10px 5px 6px', borderRadius: '10px',
                      border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC',
                    }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '7px',
                        background: 'linear-gradient(135deg, #0077FF, #0056CC)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {(user.name || user.email || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ lineHeight: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                          {user.name || user.email?.split('@')[0]}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '1px' }}>
                          {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => logout()} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px', borderRadius: '8px',
                      border: '1px solid #E2E8F0', backgroundColor: 'white',
                      fontSize: '13px', fontWeight: 500, color: '#64748B', cursor: 'pointer',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M5.25 12.25H2.917A1.167 1.167 0 011.75 11.083V2.917A1.167 1.167 0 012.917 1.75H5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        <path d="M9.333 10.5L12.25 7l-2.917-3.5M12.25 7H5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Выйти
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link href="/auth/login" style={{
                      padding: '7px 14px', borderRadius: '8px',
                      fontSize: '14px', fontWeight: 500, color: '#64748B', textDecoration: 'none',
                    }}>
                      Войти
                    </Link>
                    <Link href="/auth/register" style={{
                      padding: '7px 16px', borderRadius: '8px',
                      fontSize: '14px', fontWeight: 600, color: 'white',
                      background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                      textDecoration: 'none',
                      boxShadow: '0 1px 4px rgba(0,119,255,0.3)',
                    }}>
                      Регистрация
                    </Link>
                  </div>
                )
              )}
            </div>

            {/* Hamburger button — CSS shows only on mobile */}
            <button
              className="hdr-burger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Меню"
              style={{
                width: '40px', height: '40px', borderRadius: '10px',
                border: '1px solid #E2E8F0', backgroundColor: menuOpen ? '#F1F5F9' : 'white',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '5px', cursor: 'pointer', padding: '0',
              }}
            >
              <span style={{
                display: 'block', width: '16px', height: '2px', borderRadius: '1px',
                backgroundColor: '#374151',
                transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
                transition: 'transform 0.2s',
              }} />
              <span style={{
                display: 'block', width: '16px', height: '2px', borderRadius: '1px',
                backgroundColor: '#374151',
                opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s',
              }} />
              <span style={{
                display: 'block', width: '16px', height: '2px', borderRadius: '1px',
                backgroundColor: '#374151',
                transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
                transition: 'transform 0.2s',
              }} />
            </button>
          </div>
        </Container>

        {/* Mobile dropdown — only visible on mobile via CSS + state */}
        {menuOpen && (
          <div className="hdr-mobile-panel" style={{ borderTop: '1px solid #F1F5F9', backgroundColor: 'white' }}>
            <Container>
              <div style={{ padding: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} style={{
                    display: 'block', padding: '12px 14px', borderRadius: '10px',
                    fontSize: '15px', fontWeight: isActive(link.href) ? 600 : 500,
                    color: isActive(link.href) ? '#0077FF' : '#374151',
                    backgroundColor: isActive(link.href) ? 'rgba(0,119,255,0.07)' : 'transparent',
                    textDecoration: 'none',
                  }}>
                    {link.label}
                  </Link>
                ))}

                <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '8px', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!loading && (
                    user ? (
                      <>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px', borderRadius: '12px',
                          backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                        }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #0077FF, #0056CC)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 700, color: 'white',
                          }}>
                            {(user.name || user.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{user.name || user.email?.split('@')[0]}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</div>
                          </div>
                        </div>
                        <button onClick={() => { logout(); setMenuOpen(false) }} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                          width: '100%', padding: '12px', borderRadius: '10px',
                          border: '1px solid #E2E8F0', backgroundColor: 'white',
                          fontSize: '14px', fontWeight: 500, color: '#64748B', cursor: 'pointer',
                        }}>
                          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                            <path d="M5.25 12.25H2.917A1.167 1.167 0 011.75 11.083V2.917A1.167 1.167 0 012.917 1.75H5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            <path d="M9.333 10.5L12.25 7l-2.917-3.5M12.25 7H5.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Выйти из аккаунта
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth/login" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '12px', borderRadius: '10px',
                          border: '1px solid #E2E8F0', backgroundColor: 'white',
                          fontSize: '15px', fontWeight: 600, color: '#0F172A', textDecoration: 'none',
                        }}>
                          Войти в аккаунт
                        </Link>
                        <Link href="/auth/register" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '12px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0077FF 0%, #0056CC 100%)',
                          fontSize: '15px', fontWeight: 700, color: 'white', textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(0,119,255,0.3)',
                        }}>
                          Регистрация
                        </Link>
                      </>
                    )
                  )}
                </div>
              </div>
            </Container>
          </div>
        )}
      </header>
    </>
  )
}
