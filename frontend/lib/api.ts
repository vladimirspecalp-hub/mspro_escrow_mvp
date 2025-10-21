// Automatically determine API base URL based on environment
function getApiBaseUrl(): string {
  // 1. Use explicit environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // 2. In browser, derive from current origin (for Replit deployments)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    
    // Replit uses port-mapped domains: xxx-5000.replit.dev (frontend) and xxx-3000.replit.dev (backend)
    if (hostname.includes('replit.dev')) {
      // Replace frontend port with backend port in hostname
      const backendHostname = hostname.replace(/-\d{4}\.replit\.dev/, '-3000.replit.dev')
      return `https://${backendHostname}`
    }
    
    // Local development: use same hostname with port 3000
    return `${protocol}//${hostname}:3000`
  }
  
  // 3. Server-side fallback (for SSR)
  return process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS}` 
    : 'http://localhost:3000'
}

const API_BASE = getApiBaseUrl()

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error occurred')
  }
}

export async function getDeals() {
  return apiRequest('/api/v1/deals')
}

export async function getDealById(id: number) {
  return apiRequest(`/api/v1/deals/${id}`)
}

export async function createDeal(data: {
  buyerId: number
  sellerId: number
  amount: number
  description: string
}) {
  return apiRequest('/api/v1/deals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fundDeal(dealId: number, data: { paymentMethod: string }) {
  return apiRequest(`/api/v1/deals/${dealId}/fund`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function releaseFunds(dealId: number) {
  return apiRequest(`/api/v1/deals/${dealId}/release`, {
    method: 'POST',
  })
}

export async function openDispute(dealId: number, data: { reason: string }) {
  return apiRequest(`/api/v1/deals/${dealId}/dispute`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export { API_BASE }
