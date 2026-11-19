import type { WebsiteRestaurantMenu } from "./websiteMenus";

// Source: https://www.kjornesodden.no/restauranter/fagerstrand-grill (19 November 2026).
export const FAGERSTRAND_GRILL = {
  id: "fagerstrand-grill",
  name: "Fagerstrand Grill",
  description: "Pizza, burger og kebab · Myklerudveien 5, Fagerstrand",
  imageUrl: "https://www.kjornesodden.no/images/fg-logo.webp",
  deliveryAreaId: "fagerstrand" as const,
  openingHours: [
    { open: "11:00", close: "21:00" },
    { open: "14:00", close: "21:00" },
    { open: "14:00", close: "21:00" },
    { open: "14:00", close: "21:00" },
    { open: "11:00", close: "21:00" },
    { open: "11:00", close: "21:00" },
    { open: "11:00", close: "21:00" },
  ],
  closedUntil: "",
};

export const FAGERSTRAND_GRILL_MENU: WebsiteRestaurantMenu = {
  "slug": "fagerstrand-grill",
  "name": "Fagerstrand Grill",
  "aliases": [
    "fagerstrand grill",
    "fagerstrand grill nesodden"
  ],
  "categories": [
    {
      "name": "Pizza",
      "items": [
        {
          "name": "Biffpizza",
          "description": "Rødløk, mais, paprika, champignon og ost",
          "price": 305
        },
        {
          "name": "Kyllingpizza",
          "description": "Rødløk, mais, paprika, champignon, oliven og ost",
          "price": 299
        },
        {
          "name": "Kebabpizza",
          "description": "Mais, paprika, jalapeño og ost",
          "price": 285
        },
        {
          "name": "Dönerpizza",
          "description": "Rødløk, mais, paprika, jalapeño, oliven og ost",
          "price": 310
        },
        {
          "name": "Pepperonipizza",
          "description": "Rødløk, mais, paprika, champignon og ost",
          "price": 284
        },
        {
          "name": "Skinke og bacon",
          "description": "Rødløk, paprika og ost",
          "price": 295
        },
        {
          "name": "Vegetar",
          "description": "Rødløk, mais, paprika, champignon, oliven, jalapeño og ost",
          "price": 255
        },
        {
          "name": "Mozzarella",
          "description": "Ost",
          "price": 199
        },
        {
          "name": "Velg selv",
          "description": "Velg seks ingredienser",
          "price": 355
        }
      ]
    },
    {
      "name": "Burger",
      "items": [
        {
          "name": "Hamburger – 100 g",
          "description": "",
          "price": 110
        },
        {
          "name": "Hamburger – 160 g",
          "description": "",
          "price": 135
        },
        {
          "name": "Hamburger – 200 g",
          "description": "",
          "price": 155
        },
        {
          "name": "Hamburger – 320 g",
          "description": "",
          "price": 200
        },
        {
          "name": "Cheeseburger – 100 g",
          "description": "",
          "price": 120
        },
        {
          "name": "Cheeseburger – 160 g",
          "description": "",
          "price": 145
        },
        {
          "name": "Cheeseburger – 200 g",
          "description": "",
          "price": 165
        },
        {
          "name": "Cheeseburger – 320 g",
          "description": "",
          "price": 210
        },
        {
          "name": "Chili cheeseburger – 100 g",
          "description": "",
          "price": 125
        },
        {
          "name": "Chili cheeseburger – 160 g",
          "description": "",
          "price": 150
        },
        {
          "name": "Chili cheeseburger – 200 g",
          "description": "",
          "price": 170
        },
        {
          "name": "Chili cheeseburger – 320 g",
          "description": "",
          "price": 215
        },
        {
          "name": "Barbecueburger – 100 g",
          "description": "",
          "price": 125
        },
        {
          "name": "Barbecueburger – 160 g",
          "description": "",
          "price": 150
        },
        {
          "name": "Barbecueburger – 200 g",
          "description": "",
          "price": 170
        },
        {
          "name": "Barbecueburger – 320 g",
          "description": "",
          "price": 215
        },
        {
          "name": "Meksikansk burger – 100 g",
          "description": "",
          "price": 125
        },
        {
          "name": "Meksikansk burger – 160 g",
          "description": "",
          "price": 150
        },
        {
          "name": "Meksikansk burger – 200 g",
          "description": "",
          "price": 170
        },
        {
          "name": "Meksikansk burger – 320 g",
          "description": "",
          "price": 215
        },
        {
          "name": "Hawaii cheeseburger – 100 g",
          "description": "",
          "price": 125
        },
        {
          "name": "Hawaii cheeseburger – 160 g",
          "description": "",
          "price": 150
        },
        {
          "name": "Hawaii cheeseburger – 200 g",
          "description": "",
          "price": 170
        },
        {
          "name": "Hawaii cheeseburger – 320 g",
          "description": "",
          "price": 215
        },
        {
          "name": "Løvstekburger",
          "description": "",
          "price": 135
        },
        {
          "name": "Vegetarburger",
          "description": "",
          "price": 125
        },
        {
          "name": "Kyllingburger",
          "description": "",
          "price": 130
        },
        {
          "name": "Fiskemiddag",
          "description": "",
          "price": 180
        }
      ]
    },
    {
      "name": "Kebab",
      "items": [
        {
          "name": "Kebab i pita eller rull – Liten",
          "description": "",
          "price": 120
        },
        {
          "name": "Kebab i pita eller rull – Medium",
          "description": "",
          "price": 130
        },
        {
          "name": "Kebab i pita eller rull – Stor",
          "description": "",
          "price": 140
        },
        {
          "name": "Kyllingkebab i pita eller rull – Liten",
          "description": "",
          "price": 135
        },
        {
          "name": "Kyllingkebab i pita eller rull – Medium",
          "description": "",
          "price": 150
        },
        {
          "name": "Kyllingkebab i pita eller rull – Stor",
          "description": "",
          "price": 165
        },
        {
          "name": "Biffkebab i pita eller rull – Liten",
          "description": "",
          "price": 150
        },
        {
          "name": "Biffkebab i pita eller rull – Medium",
          "description": "",
          "price": 180
        },
        {
          "name": "Biffkebab i pita eller rull – Stor",
          "description": "",
          "price": 210
        },
        {
          "name": "Dönerkebab – Liten",
          "description": "",
          "price": 145
        },
        {
          "name": "Dönerkebab – Medium",
          "description": "",
          "price": 160
        },
        {
          "name": "Dönerkebab – Stor",
          "description": "",
          "price": 175
        },
        {
          "name": "Falafel i pita eller rull",
          "description": "",
          "price": 110
        },
        {
          "name": "Løvstek",
          "description": "",
          "price": 135
        }
      ]
    },
    {
      "name": "Pommes frites",
      "items": [
        {
          "name": "Pommes frites – Liten",
          "description": "",
          "price": 80
        },
        {
          "name": "Pommes frites – Stor",
          "description": "",
          "price": 100
        }
      ]
    },
    {
      "name": "Barnemeny",
      "items": [
        {
          "name": "Hamburger med pommes frites",
          "description": "",
          "price": 140
        },
        {
          "name": "Fiskemiddag med pommes frites",
          "description": "",
          "price": 140
        },
        {
          "name": "Nuggets med pommes frites",
          "description": "",
          "price": 140
        }
      ]
    },
    {
      "name": "Tillegg",
      "items": [
        {
          "name": "Som tallerkenrett",
          "description": "",
          "price": 60
        },
        {
          "name": "Ekstra ost på burger",
          "description": "",
          "price": 25
        },
        {
          "name": "Bacon",
          "description": "",
          "price": 43
        },
        {
          "name": "Ekstra kjøtt på pizza",
          "description": "",
          "price": 65
        },
        {
          "name": "Ekstra ost på pizza",
          "description": "",
          "price": 65
        },
        {
          "name": "Ananas",
          "description": "",
          "price": 65
        },
        {
          "name": "Hvitløksdressing",
          "description": "",
          "price": 40
        },
        {
          "name": "Sterk dressing",
          "description": "",
          "price": 40
        },
        {
          "name": "Medium dressing",
          "description": "",
          "price": 40
        }
      ]
    },
    {
      "name": "Drikke",
      "items": [
        {
          "name": "Brus – 0,5 l",
          "description": "",
          "price": 53
        },
        {
          "name": "Brus – 1,5 l",
          "description": "",
          "price": 85
        },
        {
          "name": "Kuli",
          "description": "",
          "price": 35
        },
        {
          "name": "Monster",
          "description": "",
          "price": 59
        },
        {
          "name": "Iskaffe",
          "description": "",
          "price": 50
        }
      ]
    }
  ]
};
