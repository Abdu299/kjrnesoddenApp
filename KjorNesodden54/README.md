# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Fagerstrand Grill og rekkefølgen på restaurantene

Signalen Sjøbad står først i restaurantlistene for både kunder og admin. Resten sorteres alfabetisk.

Fagerstrand Grill er klargjort fra [restaurantsiden](https://www.kjornesodden.no/restauranter/fagerstrand-grill), kontrollert 19. november 2026: logo, adresse, Fagerstrand som leveringsområde, åpningstider og sju menykategorier. De 42 rettene har totalt 70 valg med egne priser når størrelser regnes separat. Ingen leveringssatser hentes fra den statiske nettsideteksten; appens felles prisregler brukes.

Etter oppdateringen åpner du **admin** i appen én gang. Den eksisterende admininnloggingen legger da restauranten og hele menyen inn i én databasetransaksjon. Importen kjøres bare av admin, krever ikke en ny restaurantkode og oppretter ingen restaurantinnlogging. Eksisterende restauranter og manuelt endrede produkter overskrives ikke. Gjentatte besøk lager ikke duplikater, og senere deaktivering eller sletting blir respektert for adminen som har fullført importen. Ved importfeil vises en knapp for å prøve igjen.

Importen er klargjort i koden, men blir først utført i databasen når admin åpnes med en gyldig innlogging. Den bruker de eksisterende reglene som tillater admin å opprette restauranter og produkter. Katalogtestene kan kjøres med `npm run test:catalog`.

For å gi en importert restaurant innlogging: åpne **Admin → Registrerte restauranter → Fagerstrand Grill → Opprett innlogging**, velg en kode med minst seks tegn og gjenta den. Logg deretter inn fra profilsiden som restaurant med **Fagerstrand Grill** og koden du valgte. Koden vises ikke eller lagres i restaurantdokumentet. Innloggingen knyttes til den eksisterende restauranten og menyen. Hvis opprettingen avbrytes etter at Auth-kontoen er opprettet, prøv igjen med samme kode. Eksisterende innlogginger og andre kontoroller overskrives ikke. Test med `npm run test:restaurant-login`.

## Beskjed om påkrevd appoppdatering

**Admin → Appoppdateringer** ligger nederst på adminsiden. Her setter du minste tillatte versjon og en direkte butikklenke separat for iPhone og Android. Når kravet er aktivert, får eldre versjoner en egen skjerm med **Oppdater appen** og knappen til App Store eller Google Play. Det finnes ingen «Senere»-knapp. Kontrollen kjøres ved oppstart, når appen kommer tilbake fra bakgrunnen og når admin endrer kravet mens appen er åpen. Nettversjonen, Expo Go og utviklingsmodus blir ikke blokkert.

Første gang må de nye reglene publiseres fra `KjorNesodden54` med en Firebase-konto som har tilgang til prosjektet:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project kjornesodden
```

Kontrollen må deretter distribueres i en ny appbygging. Versjoner som allerede er installert uten denne koden, kan ikke få varselet med tilbakevirkende kraft. Ingen krav er aktivert automatisk. App Store-lenken må legges inn av admin; ingen App Store-ID er gjettet. Lagrede krav finnes i `settings/appUpdates`, kan leses uten innlogging og kan bare endres av admin. Endringer bruker revisjonskontroll så samtidige redigeringer ikke overskriver hverandre.

Ved senere utgivelser øker du `expo.version` i `app.json`, for eksempel fra `1.0.1` til `1.0.2`, bygger og publiserer appen, og venter til den er tilgjengelig i den aktuelle appbutikken. Deretter setter du minste versjon til `1.0.2` og slår på kravet for plattformen. Byggnummeret alene teller ikke som ny appversjon. Ikke aktiver et App Store-krav for en versjon som bare finnes i TestFlight. Kontroller butikklenken med knappen i admin før du aktiverer. Slå kravet av igjen via admin i nettversjonen ved behov.

Versjonen leses fra den installerte native appen med `expo-application`, slik at en annen versjon i et eventuelt OTA-manifest ikke gir feil sammenligning. Ved manglende nett eller feil i konfigurasjonen ved oppstart åpnes appen senest etter fem sekunder; den sperres ikke permanent av en driftsfeil. Et allerede bekreftet krav blir stående til serveren bekrefter at det er endret. Kontrollen er en klientfunksjon og erstatter ikke eventuell serverkontroll av gamle klienter. Test kjernelogikken og lagring med `npm run test:updates`.

## TestFlight

Kjør fra `KjorNesodden54` etter å ha hentet siste `main` og installert avhengighetene:

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

Bruk Expo-kontoen som har tilgang til prosjektet til `abdu2003`, og følg Apple-innloggingen hvis EAS ber om den. Produksjonsprofilen bruker automatisk byggnummer og riktig ordre-API. Etter at Apple har behandlet opplastingen, velg bygget under **App Store Connect → KjørNesodden → TestFlight** og legg det til testgruppen. Denne kommandoen gjør bygget tilgjengelig for TestFlight; utgivelse i App Store krever et eget steg.

Det tekniske `expo.name` er **KjorNesodden** med ASCII-tegn. SDK 58 og EAS CLI kan ellers tolke `ø` forskjellig og feile med **Could not find target 'KjrNesodden' in project.pbxproj**. iPhone viser fortsatt **KjørNesodden** fra `ios.infoPlist.CFBundleDisplayName`, og Android får samme navn fra `plugins/withAppDisplayName.js`. Behold denne delingen når appkonfigurasjonen endres. Bundle-ID og Android-pakken er fortsatt `com.kjornesodden.app`. EAS styrer iOS-byggnummeret eksternt; det er derfor ikke satt et lokalt `ios.buildNumber` i `app.json`.

Innsendingen er knyttet til den eksisterende App Store Connect-appen med `ascAppId: 6810372524` i `eas.json`. For første nye forsøk etter target-feilen kan du bruke `npx eas-cli@latest build --platform ios --profile production --auto-submit --clear-cache`.

## Leveringspriser i appen

Admin kan endre satsene under **Leveringspriser** på hovedsiden, og velge **Restaurantens område** ved oppretting eller redigering av en restaurant. Endringer lagres i ett felles dokument, `settings/deliveryPricing`, og oppdateres fortløpende i appen.

Standardprisene er:

| Område | Vanlig områdesats |
| --- | ---: |
| Tangen / Hellvik | 100 kr |
| Bjørnemyr | 100 kr |
| Alværn / Fjordvangen | 100 kr |
| Fjellstrand | 150 kr |
| Fagerstrand | 250 kr |

**Bare Fagerstrand til Fagerstrand** får lokalprisen, som starter på **100 kr**. Alle andre leveringer bruker vanlige områdesatser, også innen samme område. Fjellstrand til Fjellstrand koster derfor 150 kr. Mellom ulike områder brukes den høyeste av de to områdesatsene, slik at Fagerstrand til Tangen, eller motsatt vei, koster 250 kr. Admin kan også endre lokalprisen for Fagerstrand.

En handlekurv med flere restauranter får én leveringspris: den høyeste aktuelle ruteprisen. Fri bestilling og eventuell ekstra levering for et ukjent hentested avtales separat. Ukjent adresse eller restaurantområde gir **pris avtales**, aldri en antatt lav pris.

Kundens område finnes fra adresseoppslaget eller et lagret område som er knyttet til nøyaktig samme adresse. Gamle `deliveryFee`-verdier på kundeprofilen brukes ikke. Område og pris vises ved restaurantene og i handlekurven. Oppdatert pris og restaurantinformasjon hentes fra serveren før bekreftelse og på nytt før ordren sendes. Endringer krever ny bekreftelse. Ordren får et øyeblikksbilde av leveringsprisen; senere prisendringer endrer ikke tidligere bestillinger.

Eksisterende restauranter med bekreftet plassering på kjornesodden.no får området automatisk. For **Nesodden Pizza** må admin velge riktig område; plasseringen var ikke oppgitt. Nye restauranter krever et områdevalg.

### Aktivering av database-reglene

Publiser de oppdaterte reglene én gang før den nye prisstyringen tas i bruk. Kjør fra `KjorNesodden54` med en Firebase-konto som har tilgang til prosjektet:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project kjornesodden
```

`firebase.json` peker på de oppdaterte reglene i `firestore(4).rules`. Prisene kan leses av alle, men bare admin kan endre dem. Beløp, felter og versjonsnummer kontrolleres også i database-reglene. Logg deretter inn som admin, velg eventuelle manglende restaurantområder og lagre leveringsprisene. Denne kodeendringen publiserer ikke database-reglene automatisk.

Test beregning og bekreftelse uten å sende ekte bestillinger:

```bash
npm run test:delivery
```

## Oppstartsskjerm

Oppstartsskjermen konfigureres i `app.json` med `expo-splash-screen`. Den bruker `assets/images/splash-brand.png` på hvit bakgrunn, eller `#101620` når mobilen bruker mørk modus.

Expo Go viser sin egen lasteskjerm med appikon, appnavn og fremdrift. Teksten og skyggen der styres av Expo Go og kan ikke fjernes med appens splash-innstillinger. Test den faktiske oppstartsskjermen i en ny preview- eller produksjonsbygging. En omstart av Metro eller en JavaScript-oppdatering endrer ikke oppstartsskjermen i en installert app.

Fra denne mappen kan du bygge en iOS-preview med prosjektets eksisterende EAS-profil:

```bash
npx eas-cli build --platform ios --profile preview
```

Installer den nye byggingen og test oppstart med både lys og mørk systeminnstilling.

[Expo: splash screen og appikon](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
