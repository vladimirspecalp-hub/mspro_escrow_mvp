'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, AuthState, AuthAction } from '../types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false }
    case 'LOGOUT':
      return { ...state, user: null, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('replit.dev')
    ? `https://${window.location.hostname.replace(/-\d{4}\.replit\.dev/, '-3000.replit.dev')}`
    : 'http://localhost:3000')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  })

  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
        credentials: 'include',
      })

      if (response.ok) {
        const user = await response.json()
        dispatch({ type: 'SET_USER', payload: user })
      } else {
        dispatch({ type: 'LOGOUT' })
      }
    } catch (error) {
      console.error('Failed to get current user:', error)
      dispatch({ type: 'LOGOUT' })
    }
  }

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Ошибка входа')
      }

      const data = await response.json()
      dispatch({ type: 'SET_USER', payload: data.user })
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, phone?: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone }),
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Ошибка регистрации')
      }

      const data = await response.json()
      dispatch({ type: 'SET_USER', payload: data.user })
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
    }
  }

  useEffect(() => {
    getCurrentUser()
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, getCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
