/**
 * country-conflict.ts
 * 
 * SSOT (Single Source of Truth) untuk aturan resolusi konflik kewarganegaraan (Geopolitical Nationality Segregation)
 * dalam sistem reservasi trip sharing.
 * 
 * Aturan ini memisahkan unit armada fisik (Mobil #1, Mobil #2, dst.) bagi traveler dari negara-negara
 * yang memiliki sensitivitas/konflik geopolitik, guna menjaga keharmonisan, keamanan, dan kenyamanan
 * selama perjalanan wisata bersama.
 */

// Format pasangan konflik: [Negara 1, Negara 2]
export interface CountryConflictPair {
  countryA: string;
  countryB: string;
  description?: string;
}

/**
 * Pemetaan Sinonim / Alias Nama Negara ke Nama Kanonikal Bahasa Inggris Resmi
 */
const COUNTRY_CANONICAL_MAP: Record<string, string> = {
  // Armenia
  armenia: "Armenia",
  am: "Armenia",
  arm: "Armenia",

  // Azerbaijan
  azerbaijan: "Azerbaijan",
  az: "Azerbaijan",
  aze: "Azerbaijan",

  // India
  india: "India",
  in: "India",
  ind: "India",

  // Pakistan
  pakistan: "Pakistan",
  pk: "Pakistan",
  pak: "Pakistan",

  // Serbia
  serbia: "Serbia",
  rs: "Serbia",
  srb: "Serbia",

  // Kosovo
  kosovo: "Kosovo",
  xk: "Kosovo",
  kos: "Kosovo",

  // Bosnia and Herzegovina
  bosnia: "Bosnia and Herzegovina",
  "bosnia and herzegovina": "Bosnia and Herzegovina",
  "bosnia & herzegovina": "Bosnia and Herzegovina",
  "bosnia-herzegovina": "Bosnia and Herzegovina",
  ba: "Bosnia and Herzegovina",
  bih: "Bosnia and Herzegovina",

  // Morocco / Maroko
  morocco: "Morocco",
  maroko: "Morocco",
  ma: "Morocco",
  mar: "Morocco",

  // Algeria / Aljazair
  algeria: "Algeria",
  aljazair: "Algeria",
  dz: "Algeria",
  dza: "Algeria",

  // Turkey / Turki / Türkiye
  turkey: "Turkey",
  turki: "Turkey",
  türkiye: "Turkey",
  turkiye: "Turkey",
  tr: "Turkey",
  tur: "Turkey",

  // Greece / Yunani
  greece: "Greece",
  yunani: "Greece",
  gr: "Greece",
  grc: "Greece",

  // Cyprus / Siprus
  cyprus: "Cyprus",
  siprus: "Cyprus",
  cy: "Cyprus",
  cyp: "Cyprus",

  // United Kingdom / Inggris
  "united kingdom": "United Kingdom",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  inggris: "United Kingdom",
  gb: "United Kingdom",
  gbr: "United Kingdom",

  // Argentina
  argentina: "Argentina",
  ar: "Argentina",
  arg: "Argentina",

  // Russia / Rusia
  russia: "Russia",
  rusia: "Russia",
  "russian federation": "Russia",
  ru: "Russia",
  rus: "Russia",

  // Ukraine / Ukraina
  ukraine: "Ukraine",
  ukraina: "Ukraine",
  ua: "Ukraine",
  ukr: "Ukraine",

  // China / Tiongkok
  china: "China",
  tiongkok: "China",
  cina: "China",
  "prc": "China",
  "people's republic of china": "China",
  cn: "China",
  chn: "China",

  // Taiwan
  taiwan: "Taiwan",
  "taiwan, province of china": "Taiwan",
  roc: "Taiwan",
  tw: "Taiwan",
  twn: "Taiwan",

  // Hong Kong
  "hong kong": "Hong Kong",
  hongkong: "Hong Kong",
  "hong kong sar": "Hong Kong",
  hk: "Hong Kong",
  hkg: "Hong Kong",

  // Japan / Jepang
  japan: "Japan",
  jepang: "Japan",
  jp: "Japan",
  jpn: "Japan",

  // South Korea / Korea Selatan
  "south korea": "South Korea",
  "korea selatan": "South Korea",
  korsel: "South Korea",
  "republic of korea": "South Korea",
  "korea, south": "South Korea",
  kr: "South Korea",
  kor: "South Korea",

  // Indonesia
  indonesia: "Indonesia",
  id: "Indonesia",
  idn: "Indonesia",
};

/**
 * 9 Aturan Konflik Kewarganegaraan Resmi
 * (Otomatis dievaluasi secara dwiarah / simetris)
 */
export const CONFLICT_RULES: Array<{ groupA: string[]; groupB: string[]; reason: string }> = [
  {
    groupA: ["Armenia"],
    groupB: ["Azerbaijan"],
    reason: "Sensitivitas historis & geopolitik Armenia - Azerbaijan",
  },
  {
    groupA: ["India"],
    groupB: ["Pakistan"],
    reason: "Sensitivitas perbatasan & geopolitik India - Pakistan",
  },
  {
    groupA: ["Serbia"],
    groupB: ["Kosovo", "Bosnia and Herzegovina"],
    reason: "Sensitivitas wilayah Balkan: Serbia vs Kosovo / Bosnia",
  },
  {
    groupA: ["Morocco"],
    groupB: ["Algeria"],
    reason: "Sensitivitas geopolitik Afrika Utara: Maroko vs Aljazair",
  },
  {
    groupA: ["Turkey"],
    groupB: ["Greece", "Cyprus"],
    reason: "Sensitivitas Mediterania Timur: Turki vs Yunani / Siprus",
  },
  {
    groupA: ["United Kingdom"],
    groupB: ["Argentina"],
    reason: "Sensitivitas historis & kedaulatan: Inggris vs Argentina",
  },
  {
    groupA: ["Russia"],
    groupB: ["Ukraine"],
    reason: "Sensitivitas konflik aktif: Rusia vs Ukraina",
  },
  {
    groupA: ["China"],
    groupB: ["Taiwan", "Hong Kong"],
    reason: "Sensitivitas kedaulatan & politik: China vs Taiwan / Hong Kong",
  },
  {
    groupA: ["China"],
    groupB: ["Japan", "South Korea"],
    reason: "Sensitivitas hubungan regional Asia Timur: China vs Jepang / Korea Selatan",
  },
];

/**
 * Mengubah input negara apa pun menjadi nama kanonikal bahasa Inggris resmi
 */
export function canonicalizeCountry(rawCountry?: string | null): string {
  if (!rawCountry) return "Indonesia";
  const cleaned = rawCountry.trim().toLowerCase();
  if (!cleaned) return "Indonesia";

  if (COUNTRY_CANONICAL_MAP[cleaned]) {
    return COUNTRY_CANONICAL_MAP[cleaned];
  }

  // Fallback: Title Case format sederhana
  return rawCountry
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Mengecek apakah dua negara memiliki aturan konflik pemisahan armada
 */
export function hasCountryConflict(
  countryA?: string | null,
  countryB?: string | null
): boolean {
  if (!countryA || !countryB) return false;

  const canonicalA = canonicalizeCountry(countryA);
  const canonicalB = canonicalizeCountry(countryB);

  // Negara yang sama tidak pernah berkonflik dengan dirinya sendiri
  if (canonicalA.toLowerCase() === canonicalB.toLowerCase()) {
    return false;
  }

  for (const rule of CONFLICT_RULES) {
    const isAinGroupA = rule.groupA.includes(canonicalA);
    const isBinGroupB = rule.groupB.includes(canonicalB);

    const isAinGroupB = rule.groupB.includes(canonicalA);
    const isBinGroupA = rule.groupA.includes(canonicalB);

    if ((isAinGroupA && isBinGroupB) || (isAinGroupB && isBinGroupA)) {
      return true;
    }
  }

  return false;
}

/**
 * Mengambil daftar negara lawan yang berkonflik dengan negara tertentu
 */
export function getConflictingCountries(country?: string | null): string[] {
  if (!country) return [];
  const canonical = canonicalizeCountry(country);
  const result = new Set<string>();

  for (const rule of CONFLICT_RULES) {
    if (rule.groupA.includes(canonical)) {
      rule.groupB.forEach((c) => result.add(c));
    }
    if (rule.groupB.includes(canonical)) {
      rule.groupA.forEach((c) => result.add(c));
    }
  }

  return Array.from(result);
}

/**
 * Mencari negara-negara di dalam grup yang berkonflik dengan traveler baru
 */
export function findConflictingCountriesInGroup(
  travelerCountry: string | null | undefined,
  groupParticipants: Array<{ nationality?: string | null }>
): string[] {
  if (!travelerCountry || !groupParticipants || groupParticipants.length === 0) {
    return [];
  }

  const conflictingFound = new Set<string>();
  for (const p of groupParticipants) {
    if (!p.nationality) continue;
    if (hasCountryConflict(travelerCountry, p.nationality)) {
      conflictingFound.add(canonicalizeCountry(p.nationality));
    }
  }

  return Array.from(conflictingFound);
}

/**
 * Memeriksa apakah suatu grup armada kompatibel (bebas konflik) untuk seorang traveler
 */
export function isGroupCompatibleWithTraveler(
  groupParticipants: Array<{ nationality?: string | null }>,
  travelerCountry?: string | null
): boolean {
  if (!travelerCountry) return true;
  const conflicts = findConflictingCountriesInGroup(travelerCountry, groupParticipants);
  return conflicts.length === 0;
}

/**
 * Memeriksa apakah suatu grup armada kompatibel dengan beberapa traveler (multi-booking)
 */
export function isGroupCompatibleWithMultipleTravelers(
  groupParticipants: Array<{ nationality?: string | null }>,
  travelerCountries: Array<string | null | undefined>
): boolean {
  for (const country of travelerCountries) {
    if (!country) continue;
    if (!isGroupCompatibleWithTraveler(groupParticipants, country)) {
      return false;
    }
  }
  return true;
}

/**
 * Mencari grup armada terbaik yang masih memiliki kapasitas DAN bebas konflik negara
 */
export function findBestCompatibleGroup<
  T extends {
    id: string;
    capacity?: number;
    currentParticipants?: number;
    status?: string;
    participants?: Array<{ nationality?: string | null }>;
  }
>(
  groups: T[],
  travelerCountries: Array<string | null | undefined>,
  requiredSeats: number = 1
): T | null {
  if (!groups || groups.length === 0) return null;

  for (const group of groups) {
    // Cek status buka
    if (group.status && group.status !== "open" && group.status !== "available") {
      continue;
    }

    // Cek kapasitas
    const cap = group.capacity || 6;
    const current = group.currentParticipants || (group.participants ? group.participants.length : 0);
    const available = cap - current;

    if (available < requiredSeats) {
      continue;
    }

    // Cek kompatibilitas negara
    const groupParts = group.participants || [];
    if (isGroupCompatibleWithMultipleTravelers(groupParts, travelerCountries)) {
      return group;
    }
  }

  return null;
}

/**
 * Memeriksa apakah di dalam satu rombongan multi-booking itu sendiri terdapat kewarganegaraan yang saling berkonflik
 */
export function checkInternalBookingConflicts(
  nationalities: Array<string | null | undefined>
): {
  hasConflict: boolean;
  conflicts: Array<{ countryA: string; countryB: string }>;
} {
  const validNationalities = nationalities.filter(Boolean) as string[];
  const conflicts: Array<{ countryA: string; countryB: string }> = [];

  for (let i = 0; i < validNationalities.length; i++) {
    for (let j = i + 1; j < validNationalities.length; j++) {
      if (hasCountryConflict(validNationalities[i], validNationalities[j])) {
        conflicts.push({
          countryA: canonicalizeCountry(validNationalities[i]),
          countryB: canonicalizeCountry(validNationalities[j]),
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}
