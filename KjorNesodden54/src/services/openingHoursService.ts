export type OpeningPeriod = {
  open: string;
  close: string;
};

// Sunday through Saturday, matching JavaScript's weekday index.
export type WeeklyOpeningHours = (OpeningPeriod | null)[];

export type OpeningStatus = {
  open: boolean;
  known: boolean;
  text: string;
};

const DEFAULT_HOURS: Record<string, WeeklyOpeningHours> = {
  signalen: periods([[765, 1185], [945, 1185], [945, 1185], [945, 1245], [945, 1245], [945, 1245], [765, 1245]]),
  tonys: periods(Array(7).fill([780, 1260])),
  jafs: periods([[660, 1380], [600, 1380], [600, 1380], [600, 1380], [600, 1380], [600, 1380], [600, 1380]]),
  jonathan: periods([[840, 1155], [720, 1155], [720, 1155], [720, 1155], [720, 1155], [720, 1155], [720, 1155]]),
  bistro: periods([[840, 1320], null, [900, 1320], [900, 1320], [900, 1320], [840, 1320], [840, 1320]]),
  solemio: periods([[900, 1260], null, null, [930, 1290], [930, 1290], [930, 1290], [930, 1290]]),
  mamagreek: periods(Array(7).fill([660, 1200])),
};

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function periods(values: ([number, number] | null)[]): WeeklyOpeningHours {
  return values.map((value) =>
    value ? { open: minutesToTime(value[0]), close: minutesToTime(value[1]) } : null
  );
}

function normalizeName(name: string) {
  return name
    .toLocaleLowerCase("nb-NO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function defaultKey(name: string) {
  const value = normalizeName(name);
  if (value.includes("signalen")) return "signalen";
  if (value.includes("tony")) return "tonys";
  if (value.includes("jafs")) return "jafs";
  if (value.includes("jonathan")) return "jonathan";
  if (value.includes("flaskebekk") || value.includes("bistro")) return "bistro";
  if (value.includes("solemio")) return "solemio";
  if (value.includes("mama") && value.includes("greek")) return "mamagreek";
  return "";
}

export function defaultOpeningHours(name: string): WeeklyOpeningHours {
  const hours = DEFAULT_HOURS[defaultKey(name)];
  return hours ? hours.map((period) => (period ? { ...period } : null)) : Array(7).fill(null);
}

export function defaultClosedUntil(name: string) {
  return defaultKey(name) === "bistro" ? "2026-11-07" : "";
}

export function restaurantOpeningHours(
  name: string,
  stored: unknown
): WeeklyOpeningHours {
  if (Array.isArray(stored) && stored.length === 7) {
    return stored.map((period) => {
      if (!period || typeof period !== "object") return null;
      const open = String((period as any).open ?? "");
      const close = String((period as any).close ?? "");
      return /^\d{2}:\d{2}$/.test(open) && /^\d{2}:\d{2}$/.test(close)
        ? { open, close }
        : null;
    });
  }
  return defaultOpeningHours(name);
}

export function restaurantClosedUntil(name: string, stored: unknown) {
  return typeof stored === "string" ? stored : defaultClosedUntil(name);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function osloParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    day: days[get("weekday")],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export function openingStatus(
  hours: WeeklyOpeningHours,
  closedUntil = "",
  now = new Date()
): OpeningStatus {
  const oslo = osloParts(now);
  if (closedUntil && oslo.date < closedUntil) {
    const date = new Date(`${closedUntil}T12:00:00Z`);
    const label = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", timeZone: "Europe/Oslo" }).format(date);
    return { open: false, known: true, text: `Feriestengt til ${label}` };
  }

  if (!hours.some(Boolean)) {
    return { open: false, known: false, text: "Åpningstider ikke registrert" };
  }

  const today = hours[oslo.day];
  if (today) {
    const start = timeToMinutes(today.open);
    const end = timeToMinutes(today.close);
    if (oslo.minutes >= start && oslo.minutes < end) {
      return { open: true, known: true, text: `Åpent til ${today.close}` };
    }
    if (oslo.minutes < start) {
      return { open: false, known: true, text: `Stengt · åpner ${today.open}` };
    }
  }

  const dayNames = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (oslo.day + offset) % 7;
    const next = hours[day];
    if (next) {
      return { open: false, known: true, text: `Stengt · åpner ${dayNames[day]} ${next.open}` };
    }
  }
  return { open: false, known: true, text: "Stengt" };
}

export const openingDayLabels = [
  "Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag",
];

