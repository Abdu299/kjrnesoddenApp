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

## Leveringspriser i appen

Admin kan endre satsene under **Leveringspriser** på hovedsiden, og velge **Restaurantens område** ved oppretting eller redigering av en restaurant. Endringer lagres i ett felles dokument, `settings/deliveryPricing`, og oppdateres fortløpende i appen.

Standardprisene er:

| Område | Sats mellom ulike områder |
| --- | ---: |
| Tangen / Hellvik | 100 kr |
| Bjørnemyr | 100 kr |
| Alværn / Fjordvangen | 100 kr |
| Fjellstrand | 150 kr |
| Fagerstrand | 250 kr |

Innen samme område brukes lokalprisen, som starter på **100 kr**. Mellom ulike områder brukes den høyeste av de to områdesatsene. Fagerstrand til Fagerstrand koster dermed 100 kr, mens Fagerstrand til Tangen, eller motsatt vei, koster 250 kr. Også lokalprisen kan endres av admin.

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
