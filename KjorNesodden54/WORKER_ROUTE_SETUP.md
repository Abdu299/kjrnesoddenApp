# Kjøretid for sjåfører

I admin, åpne **Restauranter**, finn restauranten og trykk **Søk etter henteadresse**. Velg adressen fra forslagene og lagre. Det lagrer både adressen og kartpunktet. En ordre uten kartpunkt kan fortsatt få kjøretid dersom leveringsadressen finnes i adresseregisteret.

## Aktiver kjøretid i appen

1. Opprett et prosjekt på https://myprojects.geoapify.com/ på gratisplanen og opprett en egen API-nøkkel for ruting. Gratisplanen tillater kommersiell bruk innenfor kvoten og krever attribusjon, som vises i appen.
2. I `KjorNesodden54/.env.local` setter du `EXPO_PUBLIC_GEOAPIFY_ROUTING_KEY=din_nøkkel`. Denne klientnøkkelen følger appen og må behandles som offentlig. Sett relevante nøkkelbegrensninger der det er mulig og følg med på kvoten.
3. Start Expo på nytt med `npx expo start --clear`. For distribuerte builds må variabelen også være tilgjengelig i miljøet som bygger appen eller Expo-oppdateringen.

Et eksisterende, eget OSRM-endepunkt kan fortsatt brukes via `EXPO_PUBLIC_ROUTING_URL`. Uten rutetjeneste åpner kartknappen kjøreruten i kartappen. Rutetjenesten mottar koordinatene for sjåfør og destinasjon når en aktiv eller ledig bestilling åpnes. Oppslag kjører mens detaljsiden er synlig og GPS er aktiv. De oppdateres ved bevegelse, tidligst etter ett minutt. Kjøretid direkte til kunden beregnes uavhengig av henteadressen.
