# BELANGRIJK — oplossing voor ‘Unexpected token <’

De melding `Unexpected token '<', '<!DOCTYPE ...' is not valid JSON` betekent dat de website een HTML-pagina ontvangt waar een JSON-antwoord van de Netlify Function verwacht werd. **Dit is geen probleem met de productenlijst.** Meestal werd alleen de statische HTML gepubliceerd en niet de serverfunctie. De app kan dan geen centraal opgeslagen stemmen laden of wegschrijven.

## Zo herstel je de online site

1. Pak deze ZIP uit. Upload **de volledige mapinhoud**, niet alleen `index.html`, naar een GitHub-repository. Het bestand `netlify/functions/api.mjs` moet aanwezig zijn.
2. Open Netlify → **Add new project → Import an existing project** → GitHub en kies deze repository. Gebruik als *base directory* de repository-hoofdmap, als *publish directory* `.` en als *functions directory* `netlify/functions`. Netlify leest die laatste twee ook uit `netlify.toml`.
3. Laat Netlify de npm-dependencies installeren. Zet bij voorkeur **Build command: `npm install`** als dit niet automatisch gebeurt.
4. Zet bij **Project configuration → Environment variables** de variabele `ADMIN_PIN` op een eigen geheime PIN (minimaal tien tekens aanbevolen). Laat de variabele beschikbaar zijn voor Functions. Deploy opnieuw.
5. Controleer **https://JOUW-SITE.netlify.app/.netlify/functions/api?action=health**. Je hoort JSON te zien: `{"ok":true,"service":"innotec-product-challenge","message":"Netlify Function werkt"}`. **Zie je een HTML-pagina of 404?** Dan is de function nog niet mee gedeployed. Controleer **Deploy logs** op het aantal gebundelde functions en **Logs → Functions**.
6. Controleer daarna `/.netlify/functions/api?action=public`. Deze URL hoort eveneens JSON met `products` te geven. Zie je hier HTTP 500, check Function-logs en de configuratie van Netlify Blobs.
7. Open `?view=admin`, sla de productlijst en rankings op, en test met twee telefoons en je laptop.

**Let op:** alleen de ZIP naar de handmatige Netlify-dropzone slepen is niet dezelfde flow als de geconfigureerde Git-build en kan resulteren in een statische website zonder werkende Functions. Publiceer via GitHub/Git. Een nieuwe lokale HTML openen zal nooit de centrale server starten.

---

# INNOTEC Product Challenge — Netlify edition

Deze versie gebruikt **Netlify Functions + Netlify Blobs**. Stemmen worden centraal in Netlify opgeslagen. Alle toestellen gebruiken dezelfde gegevens; de resultatenpagina ververst iedere 5 seconden.

## Publiceren op Netlify

1. Maak een nieuwe site op Netlify via **Add new project → Import an existing project**. Zet deze map in een GitHub-repository, en koppel die repository. Voor een functie met npm-afhankelijkheden is deployen via Git de aanbevolen route (niet alleen `index.html` slepen naar de dropzone).
2. Voeg in **Project configuration → Environment variables** de variabele `ADMIN_PIN` toe en geef die een zelfgekozen sterke waarde. Scope: Functions (of All); kies bij voorkeur minimaal 10 willekeurige tekens. Verwijder nooit deze instelling zonder vervanging.
3. Netlify build settings: Publish directory `.`; build command `npm install` (of laat Netlify automatisch dependencies installeren). De `netlify.toml` wijst naar `netlify/functions`. Deploy.
4. Bezoek `https://jouw-site.netlify.app/?view=admin`, log in met je `ADMIN_PIN`.
5. Plak je volledige productenlijst en **per land** de officiële top 10 (in exacte volgorde). Klik op **Instellingen opslaan**.
6. Deel de QR-code of `?view=vote` met deelnemers. Ze kiezen BNL / FR / UK / ES en precies tien producten. Ze mogen meermaals stemmen; iedere inzending is een afzonderlijke stem.
7. Open `?view=results` op de tweede laptop en zet Presentatiemodus aan. Resultaten zijn verborgen totdat je in Beheer **Resultaten vrijgeven** aanvinkt en opslaat.

## Links
- Stemmen: `https://jouw-site.netlify.app/?view=vote`
- Presentatie: `https://jouw-site.netlify.app/?view=results`
- Beheer: `https://jouw-site.netlify.app/?view=admin`

## Belangrijk
- Zonder `ADMIN_PIN` is adminbeheer beveiligd en dus niet beschikbaar.
- De app vraagt geen namen/e-mails. Netlify-serverlogs kunnen wel technisch verzoekmetadata verwerken. Er is geen identificatie van unieke personen: opnieuw stemmen is expliciet toegestaan. De teller betreft **ingediende stemmen**, niet noodzakelijk unieke deelnemers.
- Netlify Blobs is duurzaam tussen deploys, maar deze eenvoudige app is geen transactionele database. Voor grote evenementen, streng gegarandeerde tellingen, meerdere gelijktijdige admins of auditvereisten: gebruik een volwaardige database en server-side auth.
- Instellingen zijn pas openbaar zichtbaar in de resultaatslide na vrijgave. De app slaat de officiële top 10 vooraf op; wijzigt die niet op basis van stemmen.
- Maak indien gewenst vóór het evenement een teststemming en wis de teststemmen daarna via Beheer.
- Bij de functies wordt het `@netlify/blobs` pakket gebruikt, met `consistency: 'strong'` om recente inzendingen bij te lezen.
