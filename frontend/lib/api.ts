const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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
