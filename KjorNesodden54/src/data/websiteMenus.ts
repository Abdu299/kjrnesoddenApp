export type WebsiteMenuItem = { name: string; description: string; price: number };
export type WebsiteMenuCategory = { name: string; items: WebsiteMenuItem[] };
export type WebsiteRestaurantMenu = { slug: string; name: string; aliases: string[]; categories: WebsiteMenuCategory[] };

// Generated from kjornesodden.no. Stored locally so menus work on web, iOS and Android.
export const WEBSITE_RESTAURANT_MENUS: WebsiteRestaurantMenu[] = [
  {
    "slug": "signalen",
    "name": "Signalen Sjøbad",
    "aliases": [
      "signalen",
      "signalen sjøbad"
    ],
    "categories": [
      {
        "name": "Pizza",
        "items": [
          {
            "name": "Margherita",
            "description": "Tomatsaus, mozzarella og basilikum.",
            "price": 230
          },
          {
            "name": "Quattro formaggi",
            "description": "Gorgonzola, pecorino, mozzarella og parmigiano.",
            "price": 245
          },
          {
            "name": "N’duja e Friarelli",
            "description": "Tomatsaus, n’duja-pølse, friarelli og mozzarella.",
            "price": 235
          },
          {
            "name": "Parmigiana",
            "description": "Tomatsaus, mozzarella, aubergine, parmesan og pesto med pinjekjerner.",
            "price": 235
          },
          {
            "name": "Vesuvio Piccante",
            "description": "Tomatsaus, mozzarella, salami piccante, grønn marinert pepper og fersk chili.",
            "price": 255
          },
          {
            "name": "Prosciutto di Parma",
            "description": "Tomatsaus, mozzarella, ruccola, parmaskinke, parmesan og pinjekjerner.",
            "price": 265
          },
          {
            "name": "Pizza Carbonara",
            "description": "Carbonarasaus, mozzarella, parmigiano, persille og guanciale.",
            "price": 255
          }
        ]
      },
      {
        "name": "Drikke",
        "items": [
          {
            "name": "Aranciata",
            "description": "Italiensk appelsinbrus.",
            "price": 79
          },
          {
            "name": "Aranciata Rossa",
            "description": "Brus med smak av blodappelsin.",
            "price": 79
          },
          {
            "name": "Cedrata",
            "description": "Italiensk sitronbrus.",
            "price": 79
          },
          {
            "name": "Coca-Cola",
            "description": "",
            "price": 69
          },
          {
            "name": "Coca-Cola Zero",
            "description": "",
            "price": 69
          },
          {
            "name": "Palestina Cola",
            "description": "",
            "price": 69
          },
          {
            "name": "Palestina Cola Sugarfree",
            "description": "",
            "price": 69
          }
        ]
      }
    ]
  },
  {
    "slug": "tonys-sushi",
    "name": "Tonys Sushi og Thai",
    "aliases": [
      "tonys sushi",
      "tonys sushi og thai",
      "tony sushi"
    ],
    "categories": [
      {
        "name": "Forretter",
        "items": [
          {
            "name": "Vårrull",
            "description": "Hjemmelaget vårruller med kyllingkjøttdeig, glassnudler og grønnsaker. 1 stk.",
            "price": 35
          },
          {
            "name": "Vegetar vårrull",
            "description": "Hjemmelaget vårruller med grønnsaker og glassnudler. 1 stk.",
            "price": 30
          },
          {
            "name": "Crispy Dumpling",
            "description": "Fritert dumplings med kylling. 6 stk.",
            "price": 85
          },
          {
            "name": "Tonys Spesial Dumplings",
            "description": "Dampet kyllingdumplings servert med sterk tomatsaus. 6 stk.",
            "price": 115
          },
          {
            "name": "Innbakt scampi",
            "description": "Fritert scampi med sweet chilisaus. 2 stk.",
            "price": 60
          },
          {
            "name": "Kylling Satay",
            "description": "Grillet kyllingfilet med peanøttsaus. 3 stk.",
            "price": 80
          },
          {
            "name": "Edamame",
            "description": "Kokte soyabønner.",
            "price": 65
          },
          {
            "name": "Innbakt kylling",
            "description": "Fritert kylling med søt chilisaus. 3 stk.",
            "price": 85
          }
        ]
      },
      {
        "name": "Thaisalat",
        "items": [
          {
            "name": "Spicy kyllingsalat",
            "description": "Grillet kyllingfilet med grønnsaker, cashewnøtter og sterk thaisaus.",
            "price": 175
          },
          {
            "name": "Spicy biffsalat",
            "description": "Grillet biffkjøtt med grønnsaker, cashewnøtter og sterk thaisaus.",
            "price": 195
          }
        ]
      },
      {
        "name": "Thai hovedretter",
        "items": [
          {
            "name": "Tom Khaa Gai",
            "description": "Thaisuppe med kyllingfilet, kokosmelk, sjampinjong og sitronblad.",
            "price": 180
          },
          {
            "name": "Tom Yum Gung",
            "description": "Thaisuppe med scampi, sjampinjong, sitronblad, sitrongress, galangal, koriander og tomat.",
            "price": 190
          },
          {
            "name": "Rød karri – Vegetar",
            "description": "Rød karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 180
          },
          {
            "name": "Rød karri – Kylling",
            "description": "Rød karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 229
          },
          {
            "name": "Rød karri – Scampi",
            "description": "Rød karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 235
          },
          {
            "name": "Rød karri – Biff",
            "description": "Rød karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 249
          },
          {
            "name": "Grønn karri – Vegetar",
            "description": "Grønn karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 180
          },
          {
            "name": "Grønn karri – Kylling",
            "description": "Grønn karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 229
          },
          {
            "name": "Grønn karri – Scampi",
            "description": "Grønn karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 235
          },
          {
            "name": "Grønn karri – Biff",
            "description": "Grønn karripaste med kokosmelk, bambusskudd, sitronblad, paprika, langbønner og thaibasilikum. Scampi serveres med ananas.",
            "price": 249
          },
          {
            "name": "Gul karri – Vegetar",
            "description": "Gul karripaste med kokosmelk, ananas, løk, tomat, koriander og cashewnøtter.",
            "price": 180
          },
          {
            "name": "Gul karri – Kylling",
            "description": "Gul karripaste med kokosmelk, ananas, løk, tomat, koriander og cashewnøtter.",
            "price": 229
          },
          {
            "name": "Gul karri – Scampi",
            "description": "Gul karripaste med kokosmelk, ananas, løk, tomat, koriander og cashewnøtter.",
            "price": 235
          },
          {
            "name": "Gul karri – Biff",
            "description": "Gul karripaste med kokosmelk, ananas, løk, tomat, koriander og cashewnøtter.",
            "price": 249
          },
          {
            "name": "Panaeng karri – Vegetar",
            "description": "Panaeng karripaste med kokosmelk, langbønner, paprika og thaibasilikum.",
            "price": 180
          },
          {
            "name": "Panaeng karri – Kylling",
            "description": "Panaeng karripaste med kokosmelk, langbønner, paprika og thaibasilikum.",
            "price": 229
          },
          {
            "name": "Panaeng karri – Scampi",
            "description": "Panaeng karripaste med kokosmelk, langbønner, paprika og thaibasilikum.",
            "price": 235
          },
          {
            "name": "Panaeng karri – Biff",
            "description": "Panaeng karripaste med kokosmelk, langbønner, paprika og thaibasilikum.",
            "price": 249
          },
          {
            "name": "Khao Phad – Vegetar",
            "description": "Stekt ris med egg og grønnsaker.",
            "price": 180
          },
          {
            "name": "Khao Phad – Kylling",
            "description": "Stekt ris med egg og grønnsaker.",
            "price": 229
          },
          {
            "name": "Khao Phad – Scampi",
            "description": "Stekt ris med egg og grønnsaker.",
            "price": 235
          },
          {
            "name": "Khao Phad – Biff",
            "description": "Stekt ris med egg og grønnsaker.",
            "price": 249
          },
          {
            "name": "Phad Kee Mao – Vegetar",
            "description": "Stekte risnudler med egg, grønnsaker og thaibasilikum.",
            "price": 185
          },
          {
            "name": "Phad Kee Mao – Kylling",
            "description": "Stekte risnudler med egg, grønnsaker og thaibasilikum.",
            "price": 235
          },
          {
            "name": "Phad Kee Mao – Scampi",
            "description": "Stekte risnudler med egg, grønnsaker og thaibasilikum.",
            "price": 240
          },
          {
            "name": "Phad Kee Mao – Biff",
            "description": "Stekte risnudler med egg, grønnsaker og thaibasilikum.",
            "price": 255
          },
          {
            "name": "Pad Thai – Vegetar",
            "description": "Stekte risnudler med egg, bønnespirer, vårløk, gulrøtter, løk, peanøtter og tamarindsaus.",
            "price": 185
          },
          {
            "name": "Pad Thai – Kylling",
            "description": "Stekte risnudler med egg, bønnespirer, vårløk, gulrøtter, løk, peanøtter og tamarindsaus.",
            "price": 235
          },
          {
            "name": "Pad Thai – Scampi",
            "description": "Stekte risnudler med egg, bønnespirer, vårløk, gulrøtter, løk, peanøtter og tamarindsaus.",
            "price": 240
          },
          {
            "name": "Pad Thai – Mix",
            "description": "Stekte risnudler med egg, bønnespirer, vårløk, gulrøtter, løk, peanøtter og tamarindsaus.",
            "price": 275
          },
          {
            "name": "Phad Kra Phao – Kylling",
            "description": "Hvitløk, chili, grønnsaker og thaibasilikum.",
            "price": 235
          },
          {
            "name": "Phad Kra Phao – Scampi",
            "description": "Hvitløk, chili, grønnsaker og thaibasilikum.",
            "price": 240
          },
          {
            "name": "Phad Kra Phao – Biff",
            "description": "Hvitløk, chili, grønnsaker og thaibasilikum.",
            "price": 249
          },
          {
            "name": "Phad Medd Mamuang – Kylling",
            "description": "Chilipasta med løk, sjampinjong, vårløk, paprika og cashewnøtter.",
            "price": 235
          },
          {
            "name": "Phad Medd Mamuang – Scampi",
            "description": "Chilipasta med løk, sjampinjong, vårløk, paprika og cashewnøtter.",
            "price": 240
          },
          {
            "name": "Phad Medd Mamuang – Biff",
            "description": "Chilipasta med løk, sjampinjong, vårløk, paprika og cashewnøtter.",
            "price": 255
          },
          {
            "name": "Sweet and sour kylling",
            "description": "Tempurakylling, paprika, løk, agurk og ananas med søt og sur saus.",
            "price": 240
          },
          {
            "name": "Phad Khing – Kylling",
            "description": "Ingefær, hvitløk og grønnsaker.",
            "price": 229
          },
          {
            "name": "Phad Khing – Scampi",
            "description": "Ingefær, hvitløk og grønnsaker.",
            "price": 235
          },
          {
            "name": "Phad Khing – Biff",
            "description": "Ingefær, hvitløk og grønnsaker.",
            "price": 249
          },
          {
            "name": "Ekstra – Grønnsaker",
            "description": "Grønnsaker 30. Ris 35. Kjøtt 45.",
            "price": 30
          },
          {
            "name": "Ekstra – Ris",
            "description": "Grønnsaker 30. Ris 35. Kjøtt 45.",
            "price": 35
          },
          {
            "name": "Ekstra – Kjøtt",
            "description": "Grønnsaker 30. Ris 35. Kjøtt 45.",
            "price": 45
          }
        ]
      },
      {
        "name": "Sushi og sashimi",
        "items": [
          {
            "name": "Mini Sashimi",
            "description": "6 skiver. 2 laks, 2 tunfisk, 2 scampi med sjøtang, salat og ris.",
            "price": 109
          },
          {
            "name": "Liten Sashimi",
            "description": "12 skiver. 12 laks med sjøtang, salat og ris.",
            "price": 225
          },
          {
            "name": "Medium Sashimi",
            "description": "18 skiver. 9 laks, 3 tunfisk, 3 scampi, 3 kamskjell med sjøtang, salat og ris.",
            "price": 325
          },
          {
            "name": "Stor Sashimi",
            "description": "24 skiver. 12 laks, 4 tunfisk, 4 scampi, 4 kamskjell med sjøtang, salat og ris.",
            "price": 399
          },
          {
            "name": "Laks",
            "description": "",
            "price": 30
          },
          {
            "name": "Flambert laks, tunfisk eller kveite",
            "description": "",
            "price": 35
          },
          {
            "name": "Scampi",
            "description": "",
            "price": 29
          },
          {
            "name": "Kamskjell",
            "description": "",
            "price": 35
          },
          {
            "name": "Avocado",
            "description": "",
            "price": 25
          },
          {
            "name": "Mix Nigiri",
            "description": "15 biter.",
            "price": 329
          },
          {
            "name": "Agurk Maki",
            "description": "",
            "price": 75
          },
          {
            "name": "Avocado Maki",
            "description": "",
            "price": 85
          },
          {
            "name": "Laks Maki",
            "description": "",
            "price": 95
          },
          {
            "name": "Jordbær Maki",
            "description": "Laks, krem, jordbær, teriyaki, fritert hel maki.",
            "price": 125
          },
          {
            "name": "Futo laks",
            "description": "Laks, krem, agurk, avocado og salat.",
            "price": 115
          },
          {
            "name": "Futo tempura scampi",
            "description": "Tempura scampi, chilimajones, agurk, avocado og salat.",
            "price": 119
          },
          {
            "name": "Futo tempura laks",
            "description": "Tempura laks, chilimajones, agurk, avocado, salat og teriyaki.",
            "price": 119
          },
          {
            "name": "Futo kylling",
            "description": "Fritert kylling, krem, agurk, avocado, salat og teriyaki.",
            "price": 125
          },
          {
            "name": "Futo vegetar",
            "description": "Salat, avocado, agurk, reddik, paprika og krem.",
            "price": 95
          },
          {
            "name": "Futo Sakura crispy",
            "description": "Laks, tunfisk, tempura scampi, chilimajones, agurk, avocado, teriyaki, fritert hel maki.",
            "price": 145
          },
          {
            "name": "Futo kani crispy",
            "description": "Crab stick, krem, agurk, reddik, fritert hel maki.",
            "price": 125
          },
          {
            "name": "Crispy Soft-Shell Crab",
            "description": "Sprø bløtskallkrabbe, chilimajones, teriyaki, avocado, agurk, sesam, salat og tobiko.",
            "price": 145
          },
          {
            "name": "Futo Tempura Tunfisk",
            "description": "Tempura tunfisk, chilimajones, agurk, avocado, teriyaki og salat.",
            "price": 125
          },
          {
            "name": "Uramaki laks",
            "description": "Laks, krem, avocado og sesam.",
            "price": 115
          },
          {
            "name": "Uramaki Tunfisk Spicy",
            "description": "Tunfisk, chilimajones, avocado, gressløk og sesam.",
            "price": 130
          },
          {
            "name": "Uramaki Tempura Scampi",
            "description": "Tempura scampi, chilimajones, avocado og sesam.",
            "price": 119
          },
          {
            "name": "Uramaki Tempura Kveite",
            "description": "Tempura kveite, chilimajones, avocado, teriyaki og sesam.",
            "price": 125
          },
          {
            "name": "Uramaki Kamskjell Spicy",
            "description": "Kamskjell, chilimajones, avocado, gressløk og sesam.",
            "price": 135
          },
          {
            "name": "Crispy Maki",
            "description": "12 biter. Laks, avocado, krem, agurk, teriyaki, chilimajones, fritert hel maki.",
            "price": 175
          },
          {
            "name": "Red Dragon",
            "description": "Laks, krem, tempura scampi, avocado og tobiko.",
            "price": 129
          },
          {
            "name": "Smoked Dragon",
            "description": "Flambert laks, tempura scampi, chilimajones, teriyaki og avocado.",
            "price": 145
          },
          {
            "name": "Green Dragon",
            "description": "Tempura scampi, chilimajones, avocado og tobiko.",
            "price": 140
          },
          {
            "name": "Wild Dragon",
            "description": "Laks, tunfisk, kveite, tempura scampi, chilimajones, sesam, teriyaki og avocado.",
            "price": 159
          },
          {
            "name": "Rainbow Dragon",
            "description": "Laks, tunfisk, avocado, tempura scampi, chilimajones og tobiko.",
            "price": 155
          },
          {
            "name": "Spider Roll",
            "description": "Sprø bløtskallkrabbe, chilimajones, teriyaki, avocado, agurk, sesam og tobiko.",
            "price": 165
          }
        ]
      },
      {
        "name": "Sett og mix",
        "items": [
          {
            "name": "Combo Set Menu",
            "description": "34 biter for to. Nigiri 3 laks og 3 scampi. Sashimi 2 laks, 2 scampi og 2 tunfisk. 8 uramaki laks, 8 uramaki tempura scampi og 6 crispy maki.",
            "price": 475
          },
          {
            "name": "Mix Sushi 15 biter",
            "description": "Passer én person.",
            "price": 215
          },
          {
            "name": "Mix Sushi 30 biter",
            "description": "Passer to personer.",
            "price": 425
          },
          {
            "name": "Mix Sushi 45 biter",
            "description": "Passer tre til fire personer.",
            "price": 625
          },
          {
            "name": "Mix Sushi 60 biter",
            "description": "Passer fem til seks personer.",
            "price": 785
          },
          {
            "name": "Set 1, 10 biter",
            "description": "Kun laks. Nigiri 6 laks, 4 uramaki laks.",
            "price": 169
          },
          {
            "name": "Set 2, 16 biter",
            "description": "Passer én person. Nigiri 8 laks, 8 tempura scampi.",
            "price": 269
          },
          {
            "name": "Set 3, 24 biter",
            "description": "Passer to personer. Nigiri 6 laks, 2 tunfisk, 2 scampi, 2 kveite, 8 tempura scampi, 4 uramaki laks.",
            "price": 389
          },
          {
            "name": "Set 4, 36 biter",
            "description": "Passer tre personer. Nigiri 12 laks, 2 tunfisk, 2 scampi, 2 kveite, 2 kamskjell, 8 uramaki laks, 8 tempura scampi.",
            "price": 579
          },
          {
            "name": "Set 5, 48 biter",
            "description": "Passer fire personer. Nigiri 12 laks, 3 tunfisk, 3 scampi, 3 kveite, 3 kamskjell, 8 uramaki laks, 8 tempura scampi, 8 spicy tunfiskmaki.",
            "price": 729
          }
        ]
      },
      {
        "name": "Tilbehør og drikke",
        "items": [
          {
            "name": "Ingefær, ponzusaus eller teriyakisaus",
            "description": "",
            "price": 20
          },
          {
            "name": "Soyasaus",
            "description": "",
            "price": 15
          },
          {
            "name": "Chilimajones",
            "description": "",
            "price": 20
          },
          {
            "name": "Rekechips",
            "description": "",
            "price": 25
          },
          {
            "name": "Sjøtangsalat",
            "description": "",
            "price": 45
          },
          {
            "name": "Cashewnøtter",
            "description": "",
            "price": 20
          },
          {
            "name": "Drikke",
            "description": "Spør om dagens utvalg.",
            "price": 40
          }
        ]
      }
    ]
  },
  {
    "slug": "jafs",
    "name": "JAFS Nesodden",
    "aliases": [
      "jafs",
      "jafs nesodden"
    ],
    "categories": [
      {
        "name": "Hamburgere",
        "items": [
          {
            "name": "Hamburger 100g",
            "description": "",
            "price": 99
          },
          {
            "name": "Hamburger 160g",
            "description": "",
            "price": 139
          },
          {
            "name": "Hamburger 190g",
            "description": "",
            "price": 159
          },
          {
            "name": "Hamburger 250g",
            "description": "",
            "price": 189
          },
          {
            "name": "Hamburger 500g",
            "description": "",
            "price": 289
          },
          {
            "name": "Jafsburger 200g",
            "description": "",
            "price": 189
          },
          {
            "name": "Jafsburger 320g",
            "description": "",
            "price": 219
          },
          {
            "name": "Jafsburger 380g",
            "description": "",
            "price": 239
          },
          {
            "name": "Beefburger 200g",
            "description": "",
            "price": 199
          },
          {
            "name": "Løvstekburger 120g",
            "description": "",
            "price": 129
          },
          {
            "name": "Kyllingburger 120g",
            "description": "",
            "price": 139
          },
          {
            "name": "Kyllingburger dobbel 240g",
            "description": "",
            "price": 179
          }
        ]
      },
      {
        "name": "Hamburgermeny",
        "items": [
          {
            "name": "Hamburgermeny 100g",
            "description": "",
            "price": 179
          },
          {
            "name": "Hamburgermeny 160g",
            "description": "",
            "price": 199
          },
          {
            "name": "Hamburgermeny 190g",
            "description": "",
            "price": 209
          },
          {
            "name": "Hamburgermeny 250g",
            "description": "",
            "price": 259
          },
          {
            "name": "Hamburgermeny 500g",
            "description": "",
            "price": 329
          },
          {
            "name": "Jafsburgermeny 200g",
            "description": "",
            "price": 229
          },
          {
            "name": "Jafsburgermeny 320g",
            "description": "",
            "price": 279
          },
          {
            "name": "Jafsburgermeny 380g",
            "description": "",
            "price": 299
          },
          {
            "name": "Beefburgermeny 200g",
            "description": "",
            "price": 269
          },
          {
            "name": "Løvstekburgermeny 120g",
            "description": "",
            "price": 199
          },
          {
            "name": "Kyllingburgermeny 120g",
            "description": "",
            "price": 199
          },
          {
            "name": "Kyllingburgermeny dobbel 240g",
            "description": "",
            "price": 249
          }
        ]
      },
      {
        "name": "Andre menyer",
        "items": [
          {
            "name": "Fish & chips",
            "description": "",
            "price": 199
          },
          {
            "name": "1/2 kylling meny",
            "description": "",
            "price": 229
          },
          {
            "name": "Kyllingnuggets meny",
            "description": "",
            "price": 199
          },
          {
            "name": "Løvstek meny",
            "description": "",
            "price": 199
          },
          {
            "name": "Biffsnadder meny",
            "description": "",
            "price": 259
          }
        ]
      },
      {
        "name": "Kebab",
        "items": [
          {
            "name": "Kebab liten",
            "description": "",
            "price": 129
          },
          {
            "name": "Kebab stor",
            "description": "",
            "price": 149
          },
          {
            "name": "Kebab döner liten",
            "description": "",
            "price": 149
          },
          {
            "name": "Kebab döner stor",
            "description": "",
            "price": 179
          },
          {
            "name": "Kebab kylling",
            "description": "",
            "price": 149
          },
          {
            "name": "Kebab kylling stor",
            "description": "",
            "price": 179
          }
        ]
      },
      {
        "name": "Kebabmenyer",
        "items": [
          {
            "name": "Kebabmeny",
            "description": "",
            "price": 229
          },
          {
            "name": "Kebabmeny stor",
            "description": "",
            "price": 259
          },
          {
            "name": "Kebab döner meny",
            "description": "",
            "price": 259
          },
          {
            "name": "Kebab döner meny stor",
            "description": "",
            "price": 299
          },
          {
            "name": "Kebab kylling meny",
            "description": "",
            "price": 259
          },
          {
            "name": "Kebab kylling meny stor",
            "description": "",
            "price": 299
          }
        ]
      },
      {
        "name": "Vegetar",
        "items": [
          {
            "name": "Falafel i pita",
            "description": "",
            "price": 119
          },
          {
            "name": "Falafel meny",
            "description": "",
            "price": 199
          }
        ]
      },
      {
        "name": "Enkle retter og tilbehør",
        "items": [
          {
            "name": "Pommes frites liten",
            "description": "",
            "price": 39
          },
          {
            "name": "Pommes frites stor",
            "description": "",
            "price": 59
          },
          {
            "name": "Kyllingnuggets",
            "description": "",
            "price": 99
          },
          {
            "name": "Ost",
            "description": "",
            "price": 10
          },
          {
            "name": "Bacon",
            "description": "",
            "price": 20
          },
          {
            "name": "Saus/dressing",
            "description": "",
            "price": 15
          },
          {
            "name": "Pita",
            "description": "",
            "price": 15
          }
        ]
      },
      {
        "name": "Drikke og is",
        "items": [
          {
            "name": "Mineralvann 0,5 l",
            "description": "",
            "price": 35
          },
          {
            "name": "Kaffe",
            "description": "",
            "price": 29
          },
          {
            "name": "Softis",
            "description": "",
            "price": 59
          },
          {
            "name": "Strø",
            "description": "",
            "price": 7
          },
          {
            "name": "Milkshake",
            "description": "",
            "price": 89
          }
        ]
      }
    ]
  },
  {
    "slug": "jonathan-sushi",
    "name": "Jonathan Sushi",
    "aliases": [
      "jonathan sushi",
      "jonathan"
    ],
    "categories": [
      {
        "name": "Bao",
        "items": [
          {
            "name": "Chicken Bao",
            "description": "2 stk. bao med fritert kylling og bbq saus. Fylt med wasabikrem, coleslaw med chili og koriander, toppet med koriander og sesam.",
            "price": 179
          },
          {
            "name": "Pulled Pork Bao",
            "description": "2 stk. bao fylt med pulled pork, chilimajones, kål, rettich og husets hjemmelagde saus, toppet med syltet rødløk, agurk og sprøstekt løk.",
            "price": 179
          },
          {
            "name": "Vegetar Bao",
            "description": "2 stk. vegetar bao, fritert tofu, wasabikrem, salat, rettich,kål og koriander.",
            "price": 169
          },
          {
            "name": "Fried Fish Bao",
            "description": "2 stk. bao med fritert fisk, salat, rettish, syltet løk wasabikrem",
            "price": 179
          },
          {
            "name": "Bao Fries",
            "description": "Bao fries med dip.",
            "price": 40
          },
          {
            "name": "Family 4 bao",
            "description": "Fire bao med fries. Skriv hvilke to typer bao du ønsker i beskjedfeltet.",
            "price": 350
          }
        ]
      },
      {
        "name": "Småretter",
        "items": [
          {
            "name": "Edamame",
            "description": "Saltkokte soyabønner med havsalt.",
            "price": 65
          },
          {
            "name": "Five Fingers",
            "description": "5 stk friterte kongrereker med sweet chilisaus.",
            "price": 139
          },
          {
            "name": "Hjemmelaget Vårruller",
            "description": "Homestyle vårrull fylt med kylling og grønnsaker. Følger med 1 sweet chilisaus",
            "price": 100
          },
          {
            "name": "Sashimi Forrett",
            "description": "14 skiver assortert sashimi, følger med 1 ponzusaus.",
            "price": 198
          },
          {
            "name": "8 biter nigiri assortert",
            "description": "8 biter assortert nigiri. Dersom du ønsker å få med kun laks, så skriv dette på bestillingen.",
            "price": 169
          },
          {
            "name": "Tempura Salat",
            "description": "Fritert scampi vendt i chilimajones, med avokado og agurk, toppet med rettish, sesam, vårløk og rogn. Følger med 1 teriyakisaus",
            "price": 179
          },
          {
            "name": "Rekechips",
            "description": "",
            "price": 39
          },
          {
            "name": "Wakame",
            "description": "Tangsalat",
            "price": 40
          },
          {
            "name": "Edamame med kimchi",
            "description": "Soyabønner med kimchisaus.",
            "price": 70
          },
          {
            "name": "8 biter flambert laks nigiri",
            "description": "Åtte biter nigiri med flambert laks.",
            "price": 179
          },
          {
            "name": "8 biter nigiri CUSTOM",
            "description": "Sett sammen din egen fiskemiks i beskjedfeltet. Ikke kun laks. Én soyasaus følger med.",
            "price": 209
          },
          {
            "name": "Sashimi forrett laks",
            "description": "14 skiver laks med én ponzusaus.",
            "price": 198
          },
          {
            "name": "Sashimi salat",
            "description": "10 skiver flambert laks sashimi.",
            "price": 179
          },
          {
            "name": "Kylling og ris",
            "description": "Fritert kylling, japansk ris og sesam. Til barn.",
            "price": 149
          },
          {
            "name": "Spicy karage",
            "description": "Friterte kyllingbiter med sriracha.",
            "price": 140
          },
          {
            "name": "Kylling karage",
            "description": "Friterte kyllingbiter med kimchimajones.",
            "price": 135
          }
        ]
      },
      {
        "name": "Hovedretter",
        "items": [
          {
            "name": "Flambert Main",
            "description": "Flambert pakke med 6 skiver laks sashimi, 4 biter laks nigiri og 8 biter crunchy laks maki. Følger med 1 ponzu og soya",
            "price": 320
          },
          {
            "name": "Nigiri & Ura Maki",
            "description": "6 biter nigiri av laks, 8 biter maki med laks og vårløk. Følger med 1 soya",
            "price": 225
          },
          {
            "name": "Nigiri & Maki Main",
            "description": "6 assorterte nigiri og 6 biter vinderen maki. Følger med 1 soya",
            "price": 249
          },
          {
            "name": "No Fish Vegetar",
            "description": "6 biter vegetarmaki og 1 stk. vegetar bao med tofu. Følger med 1 soya",
            "price": 189
          },
          {
            "name": "Sashimi Main",
            "description": "32 skiver assortert fisk og skalldyr. Følger med 2 ponzusaus.",
            "price": 398
          },
          {
            "name": "Nigiri Main",
            "description": "12 assortert nigiri. Følger med 1 soyasaus",
            "price": 220
          },
          {
            "name": "Fried Ramen",
            "description": "Wokede nudler med fritert kylling, diverse grønnsaker og nikkeisaus. Toppes med koriander og sesam",
            "price": 229
          },
          {
            "name": "Combo Lux",
            "description": "8 Bryn spesial, 8 Crunchy laks og 8 laks nigiri.",
            "price": 398
          },
          {
            "name": "Sushi & bao – Kylling bao",
            "description": "Spicy laks maki, 4 laks nigiri og én bao.",
            "price": 289
          },
          {
            "name": "Sushi & bao – Pulled pork bao",
            "description": "Spicy laks maki, 4 laks nigiri og én bao.",
            "price": 289
          },
          {
            "name": "Sushi & bao – Fisk bao",
            "description": "Spicy laks maki, 4 laks nigiri og én bao.",
            "price": 289
          },
          {
            "name": "Sushi & bao – Vegetar bao",
            "description": "Spicy laks maki, 4 laks nigiri og én bao.",
            "price": 289
          },
          {
            "name": "Combo 20",
            "description": "Fritert laks og chili, 6 assorterte nigiri og 8 skiver sashimi.",
            "price": 298
          }
        ]
      },
      {
        "name": "Familiepakker",
        "items": [
          {
            "name": "Laks Makipakke 30 biter",
            "description": "8 biter laks nigiri, 8 biter laks og vårløk, 8 biter laks og avokado, 6 biter fritert laks og chili. Følger med 2 soyasaus",
            "price": 449
          },
          {
            "name": "Makipakke 30 biter",
            "description": "6 biter vinderen maki, 8 biter california maki, 8 biter tuna special og 8 biter crunchy laks. Følger med 2 soyasaus",
            "price": 529
          },
          {
            "name": "Sharing 42 Biter",
            "description": "10 skiver assortert sashimi, 10 biter laks nigiri, 8 biter kamskjell og trøffel, 8 biter crunchy laks og 6 biter tempura maki. Følger med 2-3 soyasaus og 1 ponzu",
            "price": 649
          },
          {
            "name": "Familiepakke 62 Biter",
            "description": "14 skiver laks sashimi, 14 nigiri laks, 8 biter laks og avokado, 6 biter fritert laks og chili, 8 biter tunfisk spesial, 6 biter tempura maki og 6 biter vinderen maki. Følger med 3-4 soyasaus og 1 ponzu",
            "price": 949
          },
          {
            "name": "Asiatisk tapas mix",
            "description": "8 laks sashimi, 8 nigiri mix, 8 Bryn spesial, 6 Vinderen maki, tempurasalat, vårruller, kylling karage og edamame.",
            "price": 949
          },
          {
            "name": "Omakase box",
            "description": "5 flambert laks nigiri, 5 flambert kveite nigiri, 10 skiver sashimi, 8 spicy tuna, 6 softshell, 8 crunchy laks og 8 spicy laks spesial. Én ponzu og tre soyasauser.",
            "price": 998
          }
        ]
      },
      {
        "name": "Uramaki",
        "items": [
          {
            "name": "Laks & Vårløk",
            "description": "8 biter laks og vårløk maki.",
            "price": 125
          },
          {
            "name": "Spicy Laks",
            "description": "8 biter finhakket laks med chilimajones.",
            "price": 130
          },
          {
            "name": "Tunfisk & Avokado",
            "description": "8 biter maki med tunfisk og avokado.",
            "price": 139
          },
          {
            "name": "Spicy Tuna",
            "description": "8 biter finhakket tunfisk med vårløk og chilimajones.",
            "price": 139
          },
          {
            "name": "Laks & Avokado",
            "description": "8 biter laks maki med avokado.",
            "price": 139
          },
          {
            "name": "Kamskjell & Rogn",
            "description": "8 biter maki med kamskjell, avokado, chilimajones og lakserogn.",
            "price": 149
          },
          {
            "name": "California",
            "description": "Kokt scampi og avokado. 8 biter.",
            "price": 125
          },
          {
            "name": "Tempura ura",
            "description": "Fritert scampi, avokado og agurk. 8 biter.",
            "price": 139
          },
          {
            "name": "Laks og kremost",
            "description": "Laks, mango, avokado og kremost. 8 biter.",
            "price": 139
          }
        ]
      },
      {
        "name": "Ura Special",
        "items": [
          {
            "name": "Bryn Spesial",
            "description": "8 biter fyllt med crunchy panko, agurk og chili majones. Toppet med fritert kveitelokk, wasabikrem og teriyakisaus",
            "price": 155
          },
          {
            "name": "Spicy Laks Spesial",
            "description": "8 biter maki, finhakket laks med chilimajones, agurk og avokadolokk.",
            "price": 155
          },
          {
            "name": "Kamskjell & Trøffel",
            "description": "8 biter maki med avokado og agurk, toppet med kamskjell og scampi vendt i trøffelmajones.",
            "price": 155
          },
          {
            "name": "Tempura Spesial",
            "description": "8 biter maki med fritert scampi, chilimajones, avokadolokk og lakserogn på toppen.",
            "price": 155
          },
          {
            "name": "Softshell Krabbe",
            "description": "8 biter maki med fritert sandkrabbe, chilimajones, avokadolokk og lakserogn.",
            "price": 155
          },
          {
            "name": "Tunfisk Spesial",
            "description": "8 biter helfritert maki med agurk, toppet med spicy tunfisk.",
            "price": 155
          },
          {
            "name": "Tuna Tataki",
            "description": "8 biter maki med fritertscampi og chilimajones, toppet med bråstekt tunfisk, teriyakisaus, wasabikrem og tobikorogn.",
            "price": 155
          },
          {
            "name": "Crunchy Laks",
            "description": "8 biter maki med fritert scampi. Toppet med flambert laks og teriayki saus.",
            "price": 155
          },
          {
            "name": "Pulled Pork Maki",
            "description": "Fritert scampi med chilimajones, toppet med pulled pork, sweet chili og chilimajones. 8 biter.",
            "price": 160
          }
        ]
      },
      {
        "name": "Futo Maki",
        "items": [
          {
            "name": "Tempura Maki",
            "description": "6 biter tempura maki med fritert scampi, avokado, agurk og chilimajones.",
            "price": 145
          },
          {
            "name": "Fritert Laks & Chili",
            "description": "Helfritert rull fylt med laks, agurk, mango og chili majones. Toppet med teriyakisaus.",
            "price": 145
          },
          {
            "name": "Kylling Maki",
            "description": "6 biter fritert kylling med avokado, agurk og chilimajones. Toppet med teriyaki saus.",
            "price": 145
          },
          {
            "name": "Vegetar Maki",
            "description": "Fylt med grønnsaker og tofu. Toppes med wasabikrem",
            "price": 100
          },
          {
            "name": "Vinderen Maki",
            "description": "6 biter maki med fritert scampi, avokado, agurk, laks og chilimajones.",
            "price": 145
          },
          {
            "name": "Softshell Maki",
            "description": "6 biter fritert softshellkrabbe, agurk, avokado og chilimajones. Toppes med teriyakisaus",
            "price": 155
          },
          {
            "name": "Tofu vegetar maki",
            "description": "Fritert tofu, salat, rettish, mango, agurk og chilimajones. 6 biter.",
            "price": 115
          }
        ]
      },
      {
        "name": "Nigiri",
        "items": [
          {
            "name": "8 biter nigiri laks",
            "description": "Åtte nigiri med laks.",
            "price": 169
          },
          {
            "name": "Nigiri laks",
            "description": "2 biter.",
            "price": 50
          },
          {
            "name": "Flambert nigiri laks",
            "description": "2 biter.",
            "price": 55
          },
          {
            "name": "Nigiri tigerreke",
            "description": "2 biter.",
            "price": 50
          },
          {
            "name": "Nigiri kamskjell",
            "description": "2 biter.",
            "price": 75
          },
          {
            "name": "Nigiri kveite",
            "description": "2 biter.",
            "price": 60
          },
          {
            "name": "Nigiri tunfisk",
            "description": "2 biter.",
            "price": 70
          },
          {
            "name": "Vegetar nigiri",
            "description": "2 biter med avokado.",
            "price": 60
          }
        ]
      },
      {
        "name": "Sashimi med ponzusaus",
        "items": [
          {
            "name": "Sashimi laks",
            "description": "10 skiver laks.",
            "price": 150
          },
          {
            "name": "Flambert laks sashimi",
            "description": "10 skiver med ponzusaus.",
            "price": 155
          },
          {
            "name": "Sashimi kveite",
            "description": "10 skiver kveite.",
            "price": 160
          },
          {
            "name": "Laks og kveite sashimi",
            "description": "5 skiver laks og 5 skiver kveite.",
            "price": 160
          },
          {
            "name": "Sashimi kamskjell",
            "description": "10 skiver kamskjell.",
            "price": 170
          },
          {
            "name": "Sashimi tunfisk",
            "description": "10 skiver tunfisk.",
            "price": 170
          },
          {
            "name": "Tuna tataki sashimi",
            "description": "Tunfisk tataki med ponzusaus.",
            "price": 170
          },
          {
            "name": "Sashimi kokt scampi",
            "description": "10 biter scampi med én ponzusaus.",
            "price": 150
          }
        ]
      },
      {
        "name": "Ekstra",
        "items": [
          {
            "name": "Teriyakisaus",
            "description": "Teriyakisaus.",
            "price": 20
          },
          {
            "name": "Sweet Chilisaus",
            "description": "Sweet chilisaus.",
            "price": 15
          },
          {
            "name": "Soyasaus",
            "description": "Soyasaus.",
            "price": 15
          },
          {
            "name": "Chilimajones",
            "description": "Chilimajones.",
            "price": 15
          },
          {
            "name": "Ponzusaus",
            "description": "Ponzusaus.",
            "price": 20
          },
          {
            "name": "Ingefær",
            "description": "",
            "price": 30
          },
          {
            "name": "Glutenfri soya",
            "description": "",
            "price": 15
          },
          {
            "name": "Fries dip",
            "description": "",
            "price": 15
          },
          {
            "name": "Japansk ris",
            "description": "",
            "price": 30
          },
          {
            "name": "Lakserogn",
            "description": "20 g.",
            "price": 50
          }
        ]
      },
      {
        "name": "Drikke",
        "items": [
          {
            "name": "Coca-Cola",
            "description": "0,5 l.",
            "price": 42
          },
          {
            "name": "Coca-Cola Uten Sukker",
            "description": "0,5 l.",
            "price": 42
          },
          {
            "name": "Pepsi Max",
            "description": "0,5 l.",
            "price": 42
          },
          {
            "name": "Bonaqua Sitron",
            "description": "0,5 l.",
            "price": 42
          },
          {
            "name": "Fanta Exotic",
            "description": "0,5 l.",
            "price": 42
          }
        ]
      }
    ]
  },
  {
    "slug": "flaskebekk-bistro",
    "name": "Flaskebekk Bistro",
    "aliases": [
      "flaskebekk bistro",
      "flaskebekk"
    ],
    "categories": [
      {
        "name": "Forretter",
        "items": [
          {
            "name": "Hjemmelagde vårruller med biff",
            "description": "2 stk.",
            "price": 89
          },
          {
            "name": "Hjemmelagde vårruller med kylling",
            "description": "2 stk.",
            "price": 89
          },
          {
            "name": "Stekt kamskjell og scampi",
            "description": "Med asparges.",
            "price": 115
          },
          {
            "name": "Pekingsuppe",
            "description": "",
            "price": 95
          },
          {
            "name": "Wontonsuppe",
            "description": "",
            "price": 99
          },
          {
            "name": "Kyllingspyd",
            "description": "I teriyakisaus.",
            "price": 106
          },
          {
            "name": "Xia jiao",
            "description": "Rekedumplings, 4 stk.",
            "price": 109
          },
          {
            "name": "Hjemmelaget Jiaozi",
            "description": "4 stk. fritert jiaozi med kylling.",
            "price": 109
          },
          {
            "name": "Hvitløksgratinerte scampi",
            "description": "Med ost.",
            "price": 119
          },
          {
            "name": "Hvitløksgratinerte snegler",
            "description": "Med ost.",
            "price": 122
          },
          {
            "name": "Tempura scampi",
            "description": "",
            "price": 109
          },
          {
            "name": "Fingersnacks",
            "description": "2 friterte wonton, 2 tempura scampi, 2 innbakte kylling og 4 rekechips.",
            "price": 179
          }
        ]
      },
      {
        "name": "Kinesiske retter",
        "items": [
          {
            "name": "Kylling i rød karri kokossaus",
            "description": "Toppet med ristede peanøtter og koriander.",
            "price": 229
          },
          {
            "name": "Innbakt kyllingfilet",
            "description": "Fritert kyllingfilet med hjemmelaget sursøt saus.",
            "price": 219
          },
          {
            "name": "Kylling med gongbao-saus og cashewnøtter",
            "description": "Strimlet kylling med gongbao-saus og ferske grønnsaker.",
            "price": 229
          },
          {
            "name": "Kylling med peanøttsaus",
            "description": "Strimlet og stekt kylling med grønnsaker i kokosmelk med peanøttsmak.",
            "price": 225
          },
          {
            "name": "Kylling med sursøt saus",
            "description": "Woket strimlet kylling med sursøt saus.",
            "price": 219
          },
          {
            "name": "Kylling i gul karrisaus",
            "description": "Strimlet kyllingfilet i gul karri, woket med grønnsaker.",
            "price": 219
          },
          {
            "name": "Tørrstekte svinefilet-strimler",
            "description": "Med grønnsaker i en syrlig Szechuan-saus.",
            "price": 219
          },
          {
            "name": "Innbakt svinefilet",
            "description": "Med sursøt saus.",
            "price": 219
          },
          {
            "name": "Biff med bambusskudd og champignon",
            "description": "",
            "price": 219
          },
          {
            "name": "Biff med gongbao-saus og cashewnøtter",
            "description": "Strimlet biff med gongbao-saus og ferske grønnsaker.",
            "price": 229
          },
          {
            "name": "Chop Suey – Biff",
            "description": "Woket biff eller kylling med grønnsaker i soyasaus.",
            "price": 219
          },
          {
            "name": "Chop Suey – Kylling",
            "description": "Woket biff eller kylling med grønnsaker i soyasaus.",
            "price": 219
          },
          {
            "name": "Kinesisk pepperbiff",
            "description": "",
            "price": 255
          },
          {
            "name": "Chop Suey à la Shang Hai",
            "description": "Biff, kongereker, kylling og grønnsaker i soyasaus.",
            "price": 255
          },
          {
            "name": "Szechuan – Biff",
            "description": "Biff eller kylling stekt med grønnsaker i sterk Szechuan-saus.",
            "price": 219
          },
          {
            "name": "Szechuan – Kylling",
            "description": "Biff eller kylling stekt med grønnsaker i sterk Szechuan-saus.",
            "price": 219
          },
          {
            "name": "Foo wok indrefilet",
            "description": "Med grønnsaker i en saus med tradisjonelle kinesiske hotpot-krydder.",
            "price": 299
          },
          {
            "name": "Okse indrefilet med Malasaus",
            "description": "Indrefilet med sesongens grønnsaker i kinesisk hotpot.",
            "price": 299
          },
          {
            "name": "Stekt and i rød karri",
            "description": "Sprøstekt and med rød karri og kokossaus.",
            "price": 299
          },
          {
            "name": "Innbakt and",
            "description": "Med sursøt saus.",
            "price": 295
          },
          {
            "name": "Peking and",
            "description": "Serveres med pannekaker, purre, agurk og hoisin-saus.",
            "price": 325
          },
          {
            "name": "Kongereker i rød karri kokossaus",
            "description": "Med ferske grønnsaker i rød karrisaus.",
            "price": 249
          },
          {
            "name": "Innbakte kongereker",
            "description": "Med sursøt saus.",
            "price": 245
          },
          {
            "name": "Kongereker med gongbao-saus og cashewnøtter",
            "description": "",
            "price": 249
          },
          {
            "name": "Kongereker i hvitløkssaus",
            "description": "Stekt med ferske grønnsaker.",
            "price": 245
          },
          {
            "name": "Fritert strimlet biff",
            "description": "Sprøstekt oksekjøtt i sursøt chilisaus.",
            "price": 249
          },
          {
            "name": "Hoi Sin Pot",
            "description": "Scampi, kamskjell, torsk, laks og grønnskjell med chilisaus.",
            "price": 289
          },
          {
            "name": "Vegetarisk måltid",
            "description": "Ferske grønnsaker stekt med soyasaus.",
            "price": 209
          },
          {
            "name": "Lammefilet med Malasaus",
            "description": "Lammefilet og ferske grønnsaker, servert i varm hotpot.",
            "price": 295
          },
          {
            "name": "Lammefilet med hvitløks-karrisaus",
            "description": "Serveres i keramikkpot.",
            "price": 295
          },
          {
            "name": "Stekt ris",
            "description": "",
            "price": 199
          },
          {
            "name": "Stekte nudler – Biff",
            "description": "Med biff eller kylling.",
            "price": 209
          },
          {
            "name": "Stekte nudler – Kylling",
            "description": "Med biff eller kylling.",
            "price": 209
          },
          {
            "name": "Udon nudler med biff",
            "description": "I pepper-teriyakisaus.",
            "price": 225
          }
        ]
      },
      {
        "name": "Kombinasjonsretter",
        "items": [
          {
            "name": "Lykkelig familie",
            "description": "Innbakt kylling, reker, svinekjøtt og biff chop suey.",
            "price": 295
          },
          {
            "name": "Kylling chop suey + innbakt svinekjøtt",
            "description": "",
            "price": 275
          },
          {
            "name": "Gongbao kylling + innbakte reker",
            "description": "",
            "price": 275
          },
          {
            "name": "Gongbao biff + fritert kylling",
            "description": "",
            "price": 275
          }
        ]
      },
      {
        "name": "Norske retter",
        "items": [
          {
            "name": "1/2 kylling",
            "description": "Med pommes frites og salat.",
            "price": 235
          },
          {
            "name": "Oksesnadder",
            "description": "Med pommes frites, salat og béarnaisesaus.",
            "price": 279
          },
          {
            "name": "Wienerschnitzel",
            "description": "Med pommes frites, salat og béarnaisesaus.",
            "price": 229
          },
          {
            "name": "Okse indrefilet 200 g – Béarnaisesaus",
            "description": "Med salat og pommes frites.",
            "price": 399
          },
          {
            "name": "Okse indrefilet 200 g – Peppersaus",
            "description": "Med salat og pommes frites.",
            "price": 399
          }
        ]
      },
      {
        "name": "Kokkens anbefalinger",
        "items": [
          {
            "name": "Crispy fried chicken",
            "description": "Fritert kylling med sprøstekt hvitløk.",
            "price": 269
          },
          {
            "name": "Husets biffskiver",
            "description": "Marinert biff med spesiell saus, servert med ris og salat.",
            "price": 275
          },
          {
            "name": "Favoritt tallerken",
            "description": "2 vårruller, 2 tempura, 2 dumplings og kyllingnudler.",
            "price": 295
          },
          {
            "name": "Pin Pan Tallerken",
            "description": "Marinerte kyllingspyd, tempura og vårruller.",
            "price": 255
          },
          {
            "name": "Yu-Shiang strimlet biff",
            "description": "Med grønnsaker og rød søt-chilisaus.",
            "price": 255
          },
          {
            "name": "Hot Wok",
            "description": "Biff og kylling woket med fersk chili og grønnsaker.",
            "price": 245
          },
          {
            "name": "Mei Wei Mix",
            "description": "Marinert okse ytrefilet, kongereker og kamskjell i spesiell tom yum sitrongress-saus.",
            "price": 279
          },
          {
            "name": "Biffskiver i hot chiliolje",
            "description": "Tynnskåret biff med grønnsaker i hot chiliolje.",
            "price": 255
          },
          {
            "name": "Phad Thai",
            "description": "Risnudler med egg, kylling, grønnsaker, peanøtter og koriander.",
            "price": 229
          },
          {
            "name": "MaPo Tofu",
            "description": "Kinesisk tofu med biff og grønnsaker.",
            "price": 255
          }
        ]
      },
      {
        "name": "Barnemeny",
        "items": [
          {
            "name": "Pølser",
            "description": "2 stk. med pommes frites.",
            "price": 105
          },
          {
            "name": "1/4 kylling",
            "description": "Med pommes frites.",
            "price": 115
          },
          {
            "name": "Stekt ris",
            "description": "Med egg, kylling og grønnsaker.",
            "price": 129
          },
          {
            "name": "Stekte eggnudler – Kylling",
            "description": "Med kylling eller biff.",
            "price": 129
          },
          {
            "name": "Stekte eggnudler – Biff",
            "description": "Med kylling eller biff.",
            "price": 129
          },
          {
            "name": "Kyllingnugget",
            "description": "4 stk. med pommes frites.",
            "price": 105
          }
        ]
      },
      {
        "name": "Dim sum",
        "items": [
          {
            "name": "Shanghai Siomai",
            "description": "3 små hjemmelagde boller med klebrig ris, svinekjøtt og sopp.",
            "price": 115
          },
          {
            "name": "Siu Long Bao",
            "description": "4 dampede boller med saftig svinekjøttfyll.",
            "price": 115
          },
          {
            "name": "Custard Bolle",
            "description": "2 søte hveteboller med eggekremfyll.",
            "price": 99
          },
          {
            "name": "Cha Siu Pao",
            "description": "2 dampede søte hveteboller med BBQ-svinekjøtt.",
            "price": 105
          },
          {
            "name": "Lotus Leaf Rice",
            "description": "Dampet klebrig ris med kylling og sopp pakket i lotusblad.",
            "price": 115
          },
          {
            "name": "Money Bags",
            "description": "3 sprø små poser med krydret reke- og kyllingfyll.",
            "price": 105
          },
          {
            "name": "Yau Tiu",
            "description": "2 frityrstekte lange hvetebrød.",
            "price": 69
          },
          {
            "name": "Dim Sum Mix",
            "description": "2 Har Gow, 1 Siomai, 2 tempura, 1 vårrull og 1 Money Bag.",
            "price": 199
          },
          {
            "name": "Dampet Glede",
            "description": "1 Siomai, 2 Har Gow og 2 Siu Long Bao.",
            "price": 155
          }
        ]
      },
      {
        "name": "Snacks og ekstra tilbehør",
        "items": [
          {
            "name": "Rekechips",
            "description": "",
            "price": 40
          },
          {
            "name": "Edamamebønner",
            "description": "",
            "price": 65
          },
          {
            "name": "Ekstra kjøtt",
            "description": "",
            "price": 75
          },
          {
            "name": "Pommes frites",
            "description": "",
            "price": 45
          },
          {
            "name": "Ekstra scampi",
            "description": "2 stk.",
            "price": 65
          },
          {
            "name": "Ekstra saus",
            "description": "",
            "price": 25
          },
          {
            "name": "Nøtter",
            "description": "",
            "price": 30
          },
          {
            "name": "Ekstra ris",
            "description": "",
            "price": 39
          }
        ]
      },
      {
        "name": "Mineralvann",
        "items": [
          {
            "name": "Farris",
            "description": "",
            "price": 43
          },
          {
            "name": "Pepsi Max",
            "description": "",
            "price": 43
          },
          {
            "name": "Coca-Cola",
            "description": "",
            "price": 43
          },
          {
            "name": "Coca-Cola Zero",
            "description": "",
            "price": 43
          },
          {
            "name": "Sprite",
            "description": "",
            "price": 43
          },
          {
            "name": "Solo",
            "description": "",
            "price": 43
          },
          {
            "name": "Eplemost",
            "description": "",
            "price": 43
          }
        ]
      }
    ]
  },
  {
    "slug": "o-sole-mio",
    "name": "O' Sole Mio",
    "aliases": [
      "o sole mio",
      "o'sole mio",
      "o’ sole mio"
    ],
    "categories": [
      {
        "name": "Klassisk pizza",
        "items": [
          {
            "name": "Napoletana",
            "description": "Uten mozzarella. Tomatsaus, hvitløk, oregano og basilikum.",
            "price": 130
          },
          {
            "name": "Margherita",
            "description": "Tomatsaus, mozzarella og basilikum.",
            "price": 150
          },
          {
            "name": "Marinara",
            "description": "Tomatsaus, mozzarella, ansjos, kapers, oregano og basilikum.",
            "price": 190
          },
          {
            "name": "Al Cotto",
            "description": "Tomatsaus, mozzarella, kokt italiensk skinke og basilikum.",
            "price": 190
          },
          {
            "name": "Diavola",
            "description": "Tomatsaus, mozzarella, salame Napoli (sterk italiensk salami), chili og basilikum.",
            "price": 190
          },
          {
            "name": "Quattro Stagioni",
            "description": "Fire årstider. Tomatsaus, mozzarella, kokt italiensk skinke, aubergine, oliven, artisjokker, sopp og basilikum.",
            "price": 220
          },
          {
            "name": "Al Tonno",
            "description": "Tomatsaus, mozzarella, løk, tunfisk, cherrytomater og basilikum.",
            "price": 180
          },
          {
            "name": "Calzone",
            "description": "Innbakt pizza fylt med tomatsaus, mozzarella, kokt italiensk skinke og basilikum.",
            "price": 210
          },
          {
            "name": "Tricolore",
            "description": "Tomatsaus, mozzarella, spinat, ricotta, cherrytomater og basilikum.",
            "price": 190
          },
          {
            "name": "Ortolana",
            "description": "Tomatsaus, mozzarella, squash, løk, aubergine, oliven, artisjokker, paprika og basilikum.",
            "price": 190
          },
          {
            "name": "O' Sole Mio",
            "description": "Husets pizza. Tomatsaus, mozzarella, parmaskinke, ferske mozzarellakuler, cherrytomater og basilikum, med skorpe fylt med fersk ricotta og pepper.",
            "price": 240
          },
          {
            "name": "Amalfi",
            "description": "Tomatsaus, mozzarella, pancetta (italiensk bacon), gorgonzola, løk, cherrytomater, oliven, sopp og basilikum.",
            "price": 220
          },
          {
            "name": "Bellissima",
            "description": "Tomatsaus, mozzarella, mascarpone, cherrytomater, parmesan og basilikum.",
            "price": 190
          },
          {
            "name": "Aurora",
            "description": "Tomatsaus, mozzarella, mascarpone, sopp, cherrytomater, parmaskinke, parmesan og basilikum.",
            "price": 220
          },
          {
            "name": "Vesuvio",
            "description": "Tomatsaus, mozzarella, salame Napoli (sterk italiensk salami), løk, oliven, kokt italiensk skinke, mascarpone, cherrytomater, paprika, chili, gorgonzola, parmesan og basilikum.",
            "price": 230
          },
          {
            "name": "Parma",
            "description": "Tomatsaus, mozzarella, parmaskinke, ruccola, parmesan og cherrytomater.",
            "price": 220
          }
        ]
      },
      {
        "name": "Hvit pizza",
        "items": [
          {
            "name": "Quattro Formaggi",
            "description": "Fire oster. Mozzarella, provola (røkt mozzarella), mascarpone, gorgonzola, parmesan og basilikum.",
            "price": 200
          },
          {
            "name": "Salsiccia e Broccoli",
            "description": "Mozzarella, provola (røkt mozzarella), salsiccia (hjemmelaget italiensk pølse med fennikel, pepper og rødvin), italiensk brokkoli og basilikum.",
            "price": 210
          },
          {
            "name": "Paesana",
            "description": "Mozzarella, provola (røkt mozzarella), pancetta (italiensk bacon), sopp, cherrytomater og basilikum.",
            "price": 210
          },
          {
            "name": "Al Pesto",
            "description": "Mozzarella, pesto, parmesan, cherrytomater og basilikum.",
            "price": 190
          },
          {
            "name": "Rustica",
            "description": "Mozzarella, provola (røkt mozzarella), salsiccia, squash, aubergine og sopp, toppet med husets olje med rosmarin, hvitløk og chili.",
            "price": 220
          },
          {
            "name": "Vulcano",
            "description": "Mozzarella, provola (røkt mozzarella), krem av soltørkede tomater, hvitløk og chili, sterk italiensk salami, aubergine, cherrytomater og basilikum.",
            "price": 220
          }
        ]
      },
      {
        "name": "Dessert",
        "items": [
          {
            "name": "Tiramisù",
            "description": "Hjemmelaget.",
            "price": 90
          }
        ]
      },
      {
        "name": "Drikke",
        "items": [
          {
            "name": "Gazzosa",
            "description": "Italiensk sitronbrus.",
            "price": 40
          },
          {
            "name": "Chinotto",
            "description": "Italiensk brus med pomerans.",
            "price": 40
          },
          {
            "name": "Aranciata",
            "description": "Italiensk appelsinbrus.",
            "price": 40
          }
        ]
      }
    ]
  },
  {
    "slug": "mama-greek-kitchen",
    "name": "Mama Greek Kitchen",
    "aliases": [
      "mama greek kitchen",
      "mama greek kitchen fagerstrand"
    ],
    "categories": [
      {
        "name": "Gyros",
        "items": [
          {
            "name": "Gyros pita – Svin",
            "description": "Gyros i pitabrød.",
            "price": 171
          },
          {
            "name": "Gyros pita – Kylling",
            "description": "Gyros i pitabrød.",
            "price": 176
          },
          {
            "name": "Gyros tallerken – Svin",
            "description": "Gyros servert som tallerkenrett.",
            "price": 250
          },
          {
            "name": "Gyros tallerken – Kylling",
            "description": "Gyros servert som tallerkenrett.",
            "price": 265
          },
          {
            "name": "Gyros vegetar",
            "description": "",
            "price": 180
          }
        ]
      },
      {
        "name": "Hovedretter",
        "items": [
          {
            "name": "Mix meze for 2 personer",
            "description": "Blandet meze til to.",
            "price": 600
          },
          {
            "name": "Moussaka med salat",
            "description": "",
            "price": 250
          },
          {
            "name": "Spareribs – Med salat",
            "description": "Med salat eller fries.",
            "price": 250
          },
          {
            "name": "Spareribs – Med fries",
            "description": "Med salat eller fries.",
            "price": 250
          },
          {
            "name": "Kyllingburger med fries",
            "description": "",
            "price": 185
          },
          {
            "name": "Chicken nuggets med potatoes",
            "description": "",
            "price": 170
          }
        ]
      },
      {
        "name": "Meze og småretter",
        "items": [
          {
            "name": "Saganaki",
            "description": "",
            "price": 95
          },
          {
            "name": "Feta saganaki",
            "description": "",
            "price": 120
          },
          {
            "name": "Feta saganaki – Med hot honey",
            "description": "",
            "price": 155
          },
          {
            "name": "Halloumi saganaki",
            "description": "",
            "price": 120
          },
          {
            "name": "Halloumi saganaki – Med hot honey",
            "description": "",
            "price": 155
          },
          {
            "name": "Greske kjempebønner – Liten",
            "description": "Gigantes.",
            "price": 89
          },
          {
            "name": "Greske kjempebønner – Tallerken",
            "description": "Gigantes.",
            "price": 150
          },
          {
            "name": "Bakt aubergine – Liten",
            "description": "",
            "price": 89
          },
          {
            "name": "Bakt aubergine – Tallerken",
            "description": "",
            "price": 150
          },
          {
            "name": "Dolmades med tzatziki",
            "description": "",
            "price": 145
          },
          {
            "name": "Cherry paprika fylt med fetaost",
            "description": "",
            "price": 75
          },
          {
            "name": "Halloumi",
            "description": "Porsjon.",
            "price": 90
          },
          {
            "name": "Mix oliven",
            "description": "",
            "price": 70
          },
          {
            "name": "Spinat- og fetaostpai",
            "description": "",
            "price": 48
          },
          {
            "name": "Tzatziki",
            "description": "100 g.",
            "price": 45
          }
        ]
      },
      {
        "name": "Salat",
        "items": [
          {
            "name": "Gresk salat",
            "description": "",
            "price": 175
          },
          {
            "name": "Gresk salat – Med halloumi",
            "description": "",
            "price": 185
          }
        ]
      },
      {
        "name": "Tilbehør",
        "items": [
          {
            "name": "Fries",
            "description": "Porsjon.",
            "price": 50
          },
          {
            "name": "Noisettes",
            "description": "Porsjon.",
            "price": 58
          },
          {
            "name": "Pitabrød",
            "description": "",
            "price": 10
          }
        ]
      },
      {
        "name": "Drikke",
        "items": [
          {
            "name": "Cola",
            "description": "",
            "price": 35
          },
          {
            "name": "Cola Zero",
            "description": "",
            "price": 35
          }
        ]
      }
    ]
  }
];
