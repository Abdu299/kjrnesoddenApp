# Sjåførens kjøreruter

Sjåførens posisjon følges bare mens appen er i forgrunnen. Adressefeltet for hvert hentested finnes i admin under registrerte restauranter. Skriv en full adresse fra adresseregisteret og trykk «Lagre henteadresse». Ubekreftede adresser kan kopieres, men gir ingen estimert kjøretid. Eldre ordre matches mot entydige restaurantnavn.

Kjøretider krever en OSRM-kompatibel rutetjeneste som tillater bruken. Sett `EXPO_PUBLIC_ROUTING_URL` i Expo-miljøet til rotadressen for tjenesten (uten `/table/v1/driving`), og bygg appen på nytt. Denne variabelen er offentlig; bruk ikke hemmelige nøkler her. Koordinatene for sjåfør, kunde og hentesteder sendes til rutetjenesten når oppdragsdetaljer åpnes. Beregningen bruker kjøretid fra rutenettverket uten sanntidstrafikk og oppdateres omtrent hvert minutt mens siden er åpen. Hvert hentested beregnes separat for bestillinger med flere hentesteder.

Ingen rutetjeneste er konfigurert som standard. Den offentlige OSRM-demotjenesten er ikke egnet som pålitelig produksjonstjeneste, og dens bruksvilkår må vurderes før den brukes. Velg en gratis tjeneste som tillater kommersiell bruk, eller drift en egen OSRM-tjeneste. Uten en tjeneste vises en beskjed i stedet for oppdiktede kjøretider.
