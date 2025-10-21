export interface User {
  id: number
  email: string
  name: string
  phone: string | null
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  kycStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  riskScore?: number | null
  createdAt?: string
}

export interface Deal {
  id: number
  buyerId: number
  sellerId: number
  amount: number
  description: string
  status: 'PENDING' | 'PENDING_REVIEW' | 'FUNDED' | 'IN_PROGRESS' | 'DISPUTED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  fundedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  resolvedBy: number | null
  resolvedAt: string | null
}

export interface Payment {
  id: number
  dealId: number
  userId: number
  amount: number
  status: 'HELD' | 'CAPTURED' | 'REFUNDED' | 'FAILED'
  paymentMethod: string
  transactionId: string | null
  createdAt: string
}

export interface ApiError {
  statusCode: number
  message: string
  timestamp: string
  path: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
