'use client'

import { useEffect, useState } from 'react'
import { getDeals } from '@/lib/api'
import Container from '@/components/Container'

interface Deal {
  id: number
  buyerId: number
  sellerId: number
  amount: number | string  // Prisma returns Decimal as string
  status: string
  createdAt: string
}

export default function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDeals() {
      try {
        const data = await getDeals()
        console.log('✅ API Response:', data)
        setDeals(data)
      } catch (err) {
        console.error('❌ API Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load deals')
      } finally {
        setLoading(false)
      }
    }

    loadDeals()
  }, [])

  return (
    <Container>
      <div className="py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary mb-4">
            MSPro Escrow Platform
          </h1>
          <p className="text-lg text-gray-600">
            Платформа безопасных эскроу-сделок
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Активные сделки</h2>
          
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Загрузка...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
              <p className="font-semibold">Ошибка загрузки</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && deals.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Нет активных сделок
            </p>
          )}

          {!loading && !error && deals.length > 0 && (
            <div className="space-y-4">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Сделка #{deal.id}</p>
                      <p className="text-sm text-gray-600">
                        Покупатель: #{deal.buyerId} | Продавец: #{deal.sellerId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        ${Number(deal.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        {deal.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold mb-2">Безопасность</h3>
            <p className="text-sm text-gray-600">
              Защита средств на всех этапах сделки
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">Быстро</h3>
            <p className="text-sm text-gray-600">
              Автоматизация процессов эскроу
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-semibold mb-2">Гарантия</h3>
            <p className="text-sm text-gray-600">
              Арбитраж и защита прав сторон
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}
