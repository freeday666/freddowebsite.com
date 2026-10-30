# ✨ Freddo Hosting — Discord Bot Dashboard

> **Modern Discord-bot hosting starter** met een responsive dashboard, een donkere glassmorphism-stijl en een basis voor realtime statusupdates.  
> **Languages / Talen / Языки:** Nederlands (NL) · English (US) · Русский (RU)

---

## 🇳🇱 Nederlands

### 🌌 Over het project

Freddo Hosting is een starterproject voor een moderne website waarmee je Discord-bots kunt beheren. De interface is bedoeld als een strak hostingdashboard met een donkere look, duidelijke kaarten en ruimte voor animaties en realtime updates.

### ✨ UI & animaties

Aanbevolen ontwerpstijl voor de interface:

- **Modern dark UI** met glassmorphism-kaarten en subtiele gradients.
- **Responsive layout** voor desktop, tablet en mobiel.
- **Micro-animaties** voor hover-effecten, knoppen, meldingen en het openen van panelen.
- **Smooth transitions** bij navigatie en statuswijzigingen.
- **Live console-look** met tijdstempels en kleurcodering voor logregels.
- **Toegankelijkheid:** voldoende contrast, zichtbare focus-states en ondersteuning voor `prefers-reduced-motion`.

> Let op: een README kan de UI beschrijven, maar voegt zelf geen animaties toe. Controleer de HTML/CSS/JavaScript-bestanden om te zien welke effecten daadwerkelijk zijn geïmplementeerd.

### 🧩 Functies en status

Dit project is een **starter/demo**, geen volledig productie-hostingplatform.

- Dashboard-interface en basisbackend.
- Socket.IO-interface als basis voor realtime communicatie.
- Loginproviders voorbereid via Discord en Google; OAuth werkt pas na geldige configuratie.
- Bot starten/stoppen, opslag, console-output en Discord-commando's moeten aan een echte bot-runtime en persistente opslag worden gekoppeld als ze nog niet zijn geïmplementeerd.
- Moderatie, welkomst-/afscheidsberichten en verificatieknoppen vereisen een actieve Discord-bot met de juiste intents en permissies.

### 🛠️ Benodigdheden

- Node.js (bij voorkeur een actuele LTS-versie).
- Een Discord-app via de Discord Developer Portal.
- Een Google OAuth-client via Google Cloud Console (alleen als Google-login nodig is).
- Een terminal en een code-editor.

### 🚀 Installeren

1. Pak het project uit.
2. Open een terminal in de projectmap.
3. Installeer de dependencies:

   ```bash
   npm init -y
   npm install express socket.io express-session passport passport-discord passport-google-oauth20 dotenv helmet express-rate-limit discord.js
   ```

4. Kopieer `.env.example` naar `.env` en vul de juiste waarden in.
5. Controleer de callback-URL's van Discord en Google in hun ontwikkelaarsportalen.
6. Start de server:

   ```bash
   node server.js
   ```

7. Open de lokale URL die de server in de terminal vermeldt.

### 🔐 Omgevingsvariabelen

Gebruik `.env.example` als uitgangspunt. Namen kunnen verschillen per implementatie; controleer altijd welke variabelen `server.js` werkelijk uitleest.

Typische instellingen:

```env
PORT=3000
SESSION_SECRET=vervang_dit_door_een_lange_willekeurige_geheime_waarde

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Belangrijk:** zet echte geheimen nooit in GitHub, in je HTML of in screenshots. Gebruik HTTPS en veilige cookies in productie. Stel de OAuth-callback-URL's exact in zoals ze in je servercode zijn geconfigureerd.

### 🤖 Discord-botfuncties

Voor een echte implementatie moet de botcode onder meer het volgende afhandelen:

- **Moderatie:** bijvoorbeeld ban, kick, timeout en waarschuwingen, met permissiecontroles en logging.
- **Welkom/afscheid:** berichten bij het toetreden of verlaten van een server.
- **Verificatieknoppen:** buttons met server-side controle en veilige roltoekenning.
- **Realtime console:** logs van de bot-runtime via een geauthenticeerd Socket.IO-kanaal.
- **Botbeheer:** veilige processen starten, stoppen en herstarten; beperk dit tot geautoriseerde gebruikers.

Gebruik nooit willekeurige shell-commando's uit gebruikersinput. Controleer Discord-rechten en gebruikersrollen op de server, niet alleen in de browser.

### 🛡️ Productiebeveiliging

Voordat je de website publiek maakt:

- Voeg database-opslag toe voor gebruikers, bots en instellingen.
- Beveilig sessies, OAuth-callbacks en Socket.IO-events.
- Gebruik HTTPS, veilige cookies, rate limiting en CSRF-bescherming waar passend.
- Controleer eigenaarschap en rechten voor iedere botactie.
- Bewaar tokens uitsluitend server-side en roteer gelekte secrets direct.
- Voeg logging, foutafhandeling, back-ups en monitoring toe.
- Voer geen botcode uit in hetzelfde proces of met dezelfde rechten als de webserver zonder passende isolatie.

### 📁 Projectstructuur

```text
freddo_bot_hosting/
├── public/
│   └── index.html
├── server.js
├── .env.example
└── README.md
```

De precieze structuur kan afwijken afhankelijk van de versie van het project.

### 🧯 Problemen oplossen

- **OAuth-fout:** controleer client-ID, client-secret en callback-URL.
- **Module niet gevonden:** voer `npm install` opnieuw uit in de projectmap.
- **Poort bezet:** stel een andere `PORT` in.
- **Geen live console:** controleer of de client en server dezelfde Socket.IO-configuratie gebruiken en of de gebruiker geautoriseerd is.
- **Bot reageert niet:** controleer of de bot-runtime draait, de token geldig is en de benodigde intents en permissies zijn ingeschakeld.

---

## 🇺🇸 English (US)

### 🌌 About

Freddo Hosting is a starter project for a modern website to manage Discord bots. It is designed around a polished hosting dashboard with a dark theme, clean cards, and room for animations and live updates.

### ✨ UI & motion

Suggested interface direction:

- **Modern dark UI** with glassmorphism cards and subtle gradients.
- **Responsive layout** for desktop, tablet, and mobile.
- **Micro-interactions** for hover states, buttons, notifications, and panels.
- **Smooth transitions** for navigation and status changes.
- **Live-console styling** with timestamps and color-coded log lines.
- **Accessibility:** sufficient contrast, visible focus states, and `prefers-reduced-motion` support.

> Note: this README describes the intended UI direction; it does not add animations by itself. Check the HTML, CSS, and JavaScript to confirm which effects are implemented.

### 🧩 Features and implementation status

This project is a **starter/demo**, not a complete production hosting platform.

- Dashboard UI and a basic backend.
- Socket.IO setup as a foundation for realtime communication.
- Discord and Google authentication can be configured; OAuth requires valid provider credentials.
- Starting/stopping bots, persistent storage, console output, and Discord commands must be connected to a real bot runtime and database if they are not already implemented.
- Moderation, welcome/leave messages, and verification buttons require a running Discord bot with the appropriate intents and permissions.

### 🛠️ Requirements

- Node.js (a current LTS release is recommended).
- A Discord application in the Discord Developer Portal.
- A Google OAuth client in Google Cloud Console, if Google sign-in is needed.
- A terminal and code editor.

### 🚀 Setup

1. Extract the project files.
2. Open a terminal in the project directory.
3. Install dependencies:

   ```bash
   npm init -y
   npm install express socket.io express-session passport passport-discord passport-google-oauth20 dotenv helmet express-rate-limit discord.js
   ```

4. Copy `.env.example` to `.env` and fill in the required values.
5. Set the Discord and Google callback URLs in their developer consoles.
6. Start the server:

   ```bash
   node server.js
   ```

7. Open the local address printed by the server.

### 🔐 Environment variables

Use `.env.example` as a starting point. Variable names may differ by implementation, so verify which values `server.js` actually reads.

Typical configuration:

```env
PORT=3000
SESSION_SECRET=replace_with_a_long_random_secret

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Security:** never commit real secrets to GitHub or expose them in frontend code. Use HTTPS and secure cookies in production. Make sure the callback URLs exactly match your server configuration.

### 🤖 Discord bot features

A production implementation should handle:

- **Moderation:** for example, ban, kick, timeout, and warnings, with permission checks and audit logs.
- **Welcome/leave messages:** respond when members join or leave a server.
- **Verification buttons:** handle button interactions server-side and assign roles securely.
- **Realtime console:** stream bot-runtime logs through an authenticated Socket.IO channel.
- **Bot management:** safely start, stop, and restart processes; restrict access to authorized users.

Never pass user-controlled input directly to shell commands. Enforce Discord permissions and user authorization on the server, not only in the browser.

### 🛡️ Production security checklist

Before making the site public:

- Add database persistence for users, bots, and settings.
- Secure sessions, OAuth callbacks, and Socket.IO events.
- Use HTTPS, secure cookies, rate limiting, and CSRF protection where appropriate.
- Verify ownership and permissions for every bot action.
- Keep bot tokens server-side and rotate any exposed secrets immediately.
- Add logging, error handling, backups, and monitoring.
- Avoid running untrusted bot code in the web server process or with the same privileges without proper isolation.

### 📁 Project structure

```text
freddo_bot_hosting/
├── public/
│   └── index.html
├── server.js
├── .env.example
└── README.md
```

The exact structure may vary by project version.

### 🧯 Troubleshooting

- **OAuth error:** verify the client ID, client secret, and callback URL.
- **Module not found:** run `npm install` again from the project directory.
- **Port already in use:** choose another `PORT`.
- **No live console:** confirm that the client and server use matching Socket.IO settings and that the user is authorized.
- **Bot does not respond:** check the runtime, token, required intents, and permissions.

---

## 🇷🇺 Русский

### 🌌 О проекте

Freddo Hosting — стартовый проект современного сайта для управления Discord-ботами. Интерфейс задуман как удобная панель хостинга с тёмной темой, аккуратными карточками, анимациями и обновлениями в реальном времени.

### ✨ Интерфейс и анимации

Рекомендуемый стиль интерфейса:

- **Современный тёмный UI** с эффектом glassmorphism и мягкими градиентами.
- **Адаптивная вёрстка** для компьютеров, планшетов и телефонов.
- **Микроанимации** при наведении, нажатии кнопок, появлении уведомлений и открытии панелей.
- **Плавные переходы** при навигации и изменении статуса.
- **Консоль в реальном времени** с временными метками и цветовой подсветкой логов.
- **Доступность:** достаточный контраст, заметные состояния фокуса и поддержка `prefers-reduced-motion`.

> Важно: README описывает желаемый стиль, но сам по себе не добавляет анимации. Проверьте HTML, CSS и JavaScript, чтобы узнать, какие эффекты уже реализованы.

### 🧩 Возможности и статус реализации

Это **стартовый проект/демо**, а не полностью готовая production-платформа хостинга.

- Интерфейс панели управления и базовый backend.
- Основа для обмена данными в реальном времени через Socket.IO.
- Подготовка к авторизации через Discord и Google; OAuth заработает только после правильной настройки.
- Запуск и остановка ботов, постоянное хранение данных, вывод консоли и Discord-команды необходимо связать с реальной средой выполнения ботов и базой данных, если это ещё не реализовано.
- Модерация, приветствия/прощания и кнопки верификации требуют работающего Discord-бота с нужными intents и разрешениями.

### 🛠️ Требования

- Node.js (рекомендуется актуальная LTS-версия).
- Приложение Discord в Discord Developer Portal.
- OAuth-клиент Google в Google Cloud Console, если нужна авторизация через Google.
- Терминал и редактор кода.

### 🚀 Установка

1. Распакуйте файлы проекта.
2. Откройте терминал в папке проекта.
3. Установите зависимости:

   ```bash
   npm init -y
   npm install express socket.io express-session passport passport-discord passport-google-oauth20 dotenv helmet express-rate-limit discord.js
   ```

4. Скопируйте `.env.example` в `.env` и заполните необходимые значения.
5. Настройте callback URL для Discord и Google в соответствующих консолях разработчика.
6. Запустите сервер:

   ```bash
   node server.js
   ```

7. Откройте локальный адрес, который сервер выведет в терминале.

### 🔐 Переменные окружения

Используйте `.env.example` как шаблон. Названия переменных могут отличаться; проверьте, какие именно значения читает `server.js`.

Пример настроек:

```env
PORT=3000
SESSION_SECRET=замените_на_длинный_случайный_секрет

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

**Безопасность:** никогда не публикуйте настоящие секреты в GitHub или клиентском коде. В production используйте HTTPS и безопасные cookies. Callback URL должны точно совпадать с настройками сервера.

### 🤖 Функции Discord-бота

Для полноценной реализации необходимо добавить:

- **Модерацию:** например, ban, kick, timeout и предупреждения с проверкой прав и журналом действий.
- **Приветствия и прощания:** сообщения при входе и выходе участников.
- **Кнопки верификации:** обработку на стороне сервера и безопасную выдачу ролей.
- **Консоль в реальном времени:** передачу логов бота через защищённый канал Socket.IO.
- **Управление ботом:** безопасный запуск, остановку и перезапуск процессов с доступом только для авторизованных пользователей.

Не передавайте пользовательский ввод напрямую в shell-команды. Проверяйте права Discord и доступ пользователя на сервере, а не только в браузере.

### 🛡️ Безопасность перед запуском

Перед публикацией сайта:

- Добавьте базу данных для пользователей, ботов и настроек.
- Защитите сессии, OAuth-callback и события Socket.IO.
- Используйте HTTPS, безопасные cookies, ограничение частоты запросов и CSRF-защиту, где это необходимо.
- Проверяйте владельца и права перед каждым действием с ботом.
- Храните токены только на сервере; немедленно заменяйте раскрытые секреты.
- Добавьте журналирование, обработку ошибок, резервное копирование и мониторинг.
- Не запускайте недоверенный код ботов в процессе веб-сервера или с теми же привилегиями без надлежащей изоляции.

### 📁 Структура проекта

```text
freddo_bot_hosting/
├── public/
│   └── index.html
├── server.js
├── .env.example
└── README.md
```

Фактическая структура может отличаться в зависимости от версии проекта.

### 🧯 Решение проблем

- **Ошибка OAuth:** проверьте client ID, client secret и callback URL.
- **Модуль не найден:** выполните `npm install` в папке проекта.
- **Порт занят:** укажите другой `PORT`.
- **Нет консоли в реальном времени:** проверьте настройки Socket.IO на клиенте и сервере, а также права пользователя.
- **Бот не отвечает:** проверьте, запущен ли процесс, действителен ли токен и включены ли необходимые intents и разрешения.

---

## 📜 Licentie en gebruik

Voeg een `LICENSE`-bestand toe als je dit project met een expliciete open-sourcelicentie wilt verspreiden. Deel nooit bot-token-, OAuth- of sessiegeheimen.

**Freddo Hosting — built for a cleaner Discord bot management experience.**
