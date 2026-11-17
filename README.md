# Freddo Porto

Een eenvoudige portofoonachtige webapp in één HTML-bestand.

## Bestanden

- `index.html` — de complete app, inclusief stijl en JavaScript.

## Starten

1. Sla de HTML-code op als `index.html`.
2. Open het bestand in een moderne browser.
3. Voor microfoonopname open de app via `localhost` of HTTPS en geef toestemming voor microfoontoegang.

## Functies

- Huidige tijd weergeven.
- Simulatieschakelaars voor wifi en Bluetooth.
- Batterijniveau weergeven als de browser dat ondersteunt.
- App vergrendelen met een zelfgekozen pincode van 4 tot 8 cijfers.
- Een nummer opslaan en de Telefoon- of Sms-app openen.
- Een bericht lokaal opslaan in de browser.
- Microfoonopname lokaal opslaan als audiobestand.
- Portofoonkanalen en noodoproepknoppen.

## Belangrijke beperkingen

Een gewone webpagina kan niet:

- de echte wifi- of Bluetooth-instellingen van de telefoon wijzigen;
- het echte iPhone-scherm vergrendelen;
- zelfstandig bellen of sms’en;
- op elke telefoon het echte batterijniveau uitlezen;
- live-audio tussen gebruikers versturen zonder server of WebRTC-backend.

Bellen en sms openen de bijbehorende telefoonapp. De gebruiker moet de actie daar zelf bevestigen. De pincode beveiligt alleen de webapp en is lokaal opgeslagen; gebruik deze niet voor gevoelige gegevens.

## Opslag

Instellingen, pincode en berichten worden opgeslagen in de lokale browseropslag. Ze worden niet automatisch gesynchroniseerd tussen apparaten.