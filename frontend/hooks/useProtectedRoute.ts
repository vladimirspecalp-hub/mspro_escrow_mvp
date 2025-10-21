'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export function useProtectedRoute(requiredRole?: 'ADMIN' | 'MODERATOR') {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
        router.push('/')
        return
      }
    }
  }, [user, loading, requiredRole, router])

  return { user, loading }
}
