import Container from './Container'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <Container>
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-3">О платформе</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Как это работает</a></li>
                <li><a href="#" className="hover:text-primary">Тарифы</a></li>
                <li><a href="#" className="hover:text-primary">Безопасность</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Для пользователей</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Создать сделку</a></li>
                <li><a href="#" className="hover:text-primary">Мои сделки</a></li>
                <li><a href="#" className="hover:text-primary">Верификация</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Поддержка</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">FAQ</a></li>
                <li><a href="#" className="hover:text-primary">Контакты</a></li>
                <li><a href="#" className="hover:text-primary">Telegram Bot</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Юридическое</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-primary">Условия использования</a></li>
                <li><a href="#" className="hover:text-primary">Политика конфиденциальности</a></li>
                <li><a href="#" className="hover:text-primary">Документы</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2025 MSPro Escrow. Все права защищены.
          </div>
        </div>
      </Container>
    </footer>
  )
}
