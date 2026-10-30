# Freddo Bot Hosting — starter

## Vereisten
- Node.js 20 of nieuwer
- Een Discord OAuth-app en/of Google OAuth-client voor echte login

## Installeren
1. Maak deze map aan en plaats `server.js` in de hoofdmap.
2. Maak een map `public` en plaats `index.html` daarin.
3. Kopieer `.env.example` naar `.env` en vul `SESSION_SECRET` in.
4. Installeer dependencies:

   npm init -y
   npm install express socket.io express-session passport passport-discord passport-google-oauth20 dotenv helmet express-rate-limit discord.js

5. Start de server:

   node server.js

6. Open http://localhost:3000

## OAuth instellen

### Discord
- Maak een app in het Discord Developer Portal.
- Ga naar OAuth2 en voeg als redirect URI toe:
  `http://localhost:3000/auth/discord/callback`
- Zet de client ID, client secret en callback URL in `.env`.

### Google
- Maak een OAuth 2.0 Client ID in Google Cloud Console.
- Voeg als geautoriseerde redirect URI toe:
  `http://localhost:3000/auth/google/callback`
- Zet de client ID, client secret en callback URL in `.env`.

Voor productie moet je HTTPS gebruiken en de callback URL's aanpassen aan je echte domein.

## Belangrijke grenzen van deze starter
- Bots/logs worden in geheugen bewaard; serverrestart wist deze demo-data.
- De knoppen start/stop/restart veranderen alleen demo-status. Er wordt geen botproces gestart.
- Console-invoer wordt bewust niet als shell-commando uitgevoerd.
- Moderatie-, welcome-, bye- en verify-formulieren zijn UI/configuratievoorbeelden; ze voeren nog geen Discord-acties uit.
- Voor productie: voeg een database toe, sla identiteiten persistent op, maak CSRF-bescherming en strengere CSP-configuratie, voeg eigendomscontroles toe aan alle resources, en gebruik een geïsoleerde worker/process supervisor voor echte botprocessen.
- Sla nooit bot-tokens in HTML/localStorage op. Bewaar ze uitsluitend als server-side secrets of versleutelde server-side gegevens.
- Gebruik een persistent session store in plaats van de standaard MemoryStore van express-session.
