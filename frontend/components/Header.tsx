import Link from 'next/link'
import Container from './Container'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">MS</span>
            </div>
            <span className="text-xl font-bold text-secondary">
              Pro Escrow
            </span>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Главная
            </Link>
            <Link href="/deals" className="text-sm font-medium hover:text-primary">
              Сделки
            </Link>
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary">
              Войти
            </Link>
            <Link 
              href="/auth/register" 
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Регистрация
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  )
}
