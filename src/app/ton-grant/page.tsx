// src/app/ton-grant/page.tsx
export default function TONGrantPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 text-sm text-neutral-100 bg-[#0a0a0a]">
      <h1 className="text-2xl font-bold mb-2">🎯 TON Foundation Grant 2025</h1>
      <p className="text-neutral-400 mb-6">
        Чек-лист для получения $50,000 + аудит + трафик
      </p>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          1. Доступные гранты
        </h2>
        <table className="w-full text-left text-neutral-200">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="pb-2">Программа</th>
              <th>Сумма</th>
              <th>Фокус</th>
              <th>Крайний срок</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">TON Champions</td>
              <td>до $50,000</td>
              <td>Mass-adoption в Telegram</td>
              <td>каждый квартал</td>
            </tr>
            <tr>
              <td className="py-1">Memelandia</td>
              <td>до $500,000</td>
              <td>Мем-пады и вирусные токены</td>
              <td>2025-Q4</td>
            </tr>
            <tr>
              <td className="py-1">Ecosystem Partners</td>
              <td>до $10,000</td>
              <td>Инфраструктура TON</td>
              <td>роллинг</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          2. Критерии отбора
        </h2>
        <ul className="list-disc list-inside space-y-1 text-neutral-200">
          <li>✅ Работает на main-net TON</li>
          <li>✅ Unique value – не клон</li>
          <li>✅ Mass-adoption потенциал</li>
          <li>✅ Готовый MVP</li>
          <li>✅ Social/viral механика</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          3. Поэтапный план
        </h2>
        <table className="w-full text-left text-neutral-200">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="pb-2">День</th>
              <th>Действие</th>
              <th>Ссылка</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">0</td>
              <td>Fork экосистемной карты TON</td>
              <td>ton.org/ecosystem</td>
            </tr>
            <tr>
              <td className="py-1">1</td>
              <td>Собрать пакет документов</td>
              <td>≤ 10 МБ</td>
            </tr>
            <tr>
              <td className="py-1">2</td>
              <td>Подать заявку</td>
              <td>builders@ton.org</td>
            </tr>
            <tr>
              <td className="py-1">3</td>
              <td>Публичный тред в Twitter</td>
              <td>#TONChampions</td>
            </tr>
            <tr>
              <td className="py-1">4</td>
              <td>Ответ на вопросы</td>
              <td>&lt; 48 ч</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          4. Пакет документов
        </h2>
        <ul className="list-disc list-inside space-y-1 text-neutral-200">
          <li>Cover Letter (1 стр.)</li>
          <li>Pitch Deck (10 слайдов)</li>
          <li>Technical Architecture</li>
          <li>Financial Model (3-year P&L)</li>
          <li>Roadmap & Milestones (90-day plan)</li>
          <li>Team & Legal</li>
          <li>Links (GitHub, Mini-App, Bot)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          5. Готовые ответы на FAQs
        </h2>
        <table className="w-full text-left text-neutral-200">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="pb-2">Вопрос</th>
              <th>Ответ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">Clone?</td>
              <td>
                No – only music-NFT marketplace inside TG with 2% fee + Stars
                checkout
              </td>
            </tr>
            <tr>
              <td className="py-1">Users?</td>
              <td>MVP deployed with core functionality</td>
            </tr>
            <tr>
              <td className="py-1">Token?</td>
              <td>NDT – deflationary, 2% burn, audited by CertiK</td>
            </tr>
            <tr>
              <td className="py-1">Monetise?</td>
              <td>30% Stars-share → $1.5M/год Telegram доход</td>
            </tr>
            <tr>
              <td className="py-1">Security?</td>
              <td>0-secret checkout, redirect only, CSP, RBAC, Sentry</td>
            </tr>
            <tr>
              <td className="py-1">TON TX?</td>
              <td>≥50k TX/мес после партнёрки → $9.4M NPV для TON</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          6. Cover Letter шаблон
        </h2>
        <div className="bg-neutral-800 p-4 rounded text-neutral-200 text-xs">
          <p>
            Subject: TON Champions – Normal Dance (Music-NFT Marketplace in
            Telegram)
          </p>
          <br />
          <p>Hi TON Foundation team,</p>
          <br />
          <p>
            Normal Dance is the only music-NFT marketplace living inside
            Telegram Mini-App.
          </p>
          <p>- MVP deployed with core functionality</p>
          <p>- 2% fee vs 30% Spotify → mass-adoption hook</p>
          <p>- 15 payment rails (Stars, TON, SBP, cards) – 0 secrets stored</p>
          <p>- Forecast: 50k TON TX/month → $9.4M NPV for TON ecosystem</p>
          <br />
          <p>
            We ask for $50k grant + audit + traffic support to scale to 1M MAU
            within 90 days.
          </p>
          <br />
          <p>Deck & docs attached.</p>
          <br />
          <p>Best,</p>
          <p>[Name] | CEO Normal Dance</p>
          <p>tg: @normaldance_sale</p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          7. Twitter Thread шаблон
        </h2>
        <div className="bg-neutral-800 p-4 rounded text-neutral-200 text-xs">
          <p>1/ We just applied to #TONChampions 🚀</p>
          <p>Normal Dance = music-NFT shop inside @telegram</p>
          <p>2% fee → 30% Spotify</p>
          <p>MVP deployed with core functionality</p>
          <p>🧵👇</p>
          <br />
          <p>2/ Why TON?</p>
          <p>- 5 sec finality</p>
          <p>- 0.005$ fee</p>
          <p>- 900M Telegram users</p>
          <p>- Built-in TON Connect 2 = 1-tap buy</p>
          <br />
          <p>3/ If approved:</p>
          <p>- 50k TON TX/month</p>
          <p>- $1.5M/year to Telegram (Stars)</p>
          <p>- $9.4M NPV for TON ecosystem</p>
          <br />
          <p>4/ Help us bring fair music monetisation to 1B people!</p>
          <p>RT = ❤️</p>
          <p>#TON #Telegram #MusicNFT</p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          8. Timeline после подачи
        </h2>
        <table className="w-full text-left text-neutral-200">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="pb-2">Срок</th>
              <th>Этап</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">48 ч</td>
              <td>Первичный ответ</td>
            </tr>
            <tr>
              <td className="py-1">7 дней</td>
              <td>Техническое интервью</td>
            </tr>
            <tr>
              <td className="py-1">14 дней</td>
              <td>Due-diligence</td>
            </tr>
            <tr>
              <td className="py-1">21 день</td>
              <td>Grant Offer + Audit voucher</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          9. Итог для Normal Dance
        </h2>
        <table className="w-full text-left text-neutral-200">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="pb-2">Результат</th>
              <th>Значение</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1">Грант</td>
              <td>$50,000</td>
            </tr>
            <tr>
              <td className="py-1">Аудит</td>
              <td>$15,000 (оплачивает Foundation)</td>
            </tr>
            <tr>
              <td className="py-1">Трафик</td>
              <td>$10,000 Telegram Ads credits</td>
            </tr>
            <tr>
              <td className="py-1">Время</td>
              <td>21 день от подачи до денег</td>
            </tr>
            <tr>
              <td className="py-1">ROI</td>
              <td>Based on forecasted metrics</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-semibold uppercase tracking-wide text-neutral-300 mb-2">
          10. Следующие шаги
        </h2>
        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded text-green-200">
          <p className="font-semibold">Готовы подать?</p>
          <p>
            Собирайте пакет → отправляйте на builders@ton.org + форма
            ton.org/champions → публикуйте тред → ждите $50k на счёт через 21
            день.
          </p>
        </div>
      </section>
    </main>
  );
}
