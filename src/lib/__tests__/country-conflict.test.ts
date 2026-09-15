import assert from "node:assert";
import {
  hasCountryConflict,
  getConflictingCountries,
  findConflictingCountriesInGroup,
  isGroupCompatibleWithTraveler,
  findBestCompatibleGroup,
  checkInternalBookingConflicts,
  canonicalizeCountry,
} from "../country-conflict";

export function runCountryConflictVerification() {
  // 1. Canonical Country Normalization
  assert.strictEqual(canonicalizeCountry("india"), "India");
  assert.strictEqual(canonicalizeCountry("PK"), "Pakistan");
  assert.strictEqual(canonicalizeCountry("uk"), "United Kingdom");
  assert.strictEqual(canonicalizeCountry("Inggris"), "United Kingdom");
  assert.strictEqual(canonicalizeCountry("Korsel"), "South Korea");
  assert.strictEqual(canonicalizeCountry("Turki"), "Turkey");
  assert.strictEqual(canonicalizeCountry("Türkiye"), "Turkey");
  assert.strictEqual(canonicalizeCountry("Bosnia"), "Bosnia and Herzegovina");
  assert.strictEqual(canonicalizeCountry("Hongkong"), "Hong Kong");
  assert.strictEqual(canonicalizeCountry("Tiongkok"), "China");
  assert.strictEqual(canonicalizeCountry("Rusia"), "Russia");
  assert.strictEqual(canonicalizeCountry("Ukraina"), "Ukraine");

  // 2. 9 Geopolitical Conflict Rules (Bidirectional)
  // 1. Armenia vs Azerbaijan
  assert.strictEqual(hasCountryConflict("Armenia", "Azerbaijan"), true);
  assert.strictEqual(hasCountryConflict("Azerbaijan", "Armenia"), true);
  assert.strictEqual(hasCountryConflict("AM", "AZ"), true);

  // 2. India vs Pakistan
  assert.strictEqual(hasCountryConflict("India", "Pakistan"), true);
  assert.strictEqual(hasCountryConflict("Pakistan", "India"), true);
  assert.strictEqual(hasCountryConflict("in", "pk"), true);

  // 3. Serbia vs Kosovo / Bosnia
  assert.strictEqual(hasCountryConflict("Serbia", "Kosovo"), true);
  assert.strictEqual(hasCountryConflict("Kosovo", "Serbia"), true);
  assert.strictEqual(hasCountryConflict("Serbia", "Bosnia and Herzegovina"), true);
  assert.strictEqual(hasCountryConflict("Bosnia", "Serbia"), true);
  assert.strictEqual(hasCountryConflict("Kosovo", "Bosnia"), false);

  // 4. Morocco vs Algeria
  assert.strictEqual(hasCountryConflict("Morocco", "Algeria"), true);
  assert.strictEqual(hasCountryConflict("Maroko", "Aljazair"), true);
  assert.strictEqual(hasCountryConflict("Algeria", "Morocco"), true);

  // 5. Turkey vs Greece / Cyprus
  assert.strictEqual(hasCountryConflict("Turkey", "Greece"), true);
  assert.strictEqual(hasCountryConflict("Turki", "Yunani"), true);
  assert.strictEqual(hasCountryConflict("Türkiye", "Cyprus"), true);
  assert.strictEqual(hasCountryConflict("Siprus", "Turkey"), true);
  assert.strictEqual(hasCountryConflict("Greece", "Cyprus"), false);

  // 6. UK vs Argentina
  assert.strictEqual(hasCountryConflict("United Kingdom", "Argentina"), true);
  assert.strictEqual(hasCountryConflict("Inggris", "Argentina"), true);
  assert.strictEqual(hasCountryConflict("UK", "AR"), true);
  assert.strictEqual(hasCountryConflict("Argentina", "United Kingdom"), true);

  // 7. Russia vs Ukraine
  assert.strictEqual(hasCountryConflict("Russia", "Ukraine"), true);
  assert.strictEqual(hasCountryConflict("Rusia", "Ukraina"), true);
  assert.strictEqual(hasCountryConflict("Ukraine", "Russia"), true);

  // 8. China vs Taiwan / Hong Kong
  assert.strictEqual(hasCountryConflict("China", "Taiwan"), true);
  assert.strictEqual(hasCountryConflict("Tiongkok", "Taiwan"), true);
  assert.strictEqual(hasCountryConflict("China", "Hong Kong"), true);
  assert.strictEqual(hasCountryConflict("China", "Hongkong"), true);
  assert.strictEqual(hasCountryConflict("Taiwan", "Hong Kong"), false);

  // 9. China vs Japan / South Korea
  assert.strictEqual(hasCountryConflict("China", "Japan"), true);
  assert.strictEqual(hasCountryConflict("Tiongkok", "Jepang"), true);
  assert.strictEqual(hasCountryConflict("China", "South Korea"), true);
  assert.strictEqual(hasCountryConflict("China", "Korsel"), true);
  assert.strictEqual(hasCountryConflict("Japan", "South Korea"), false);

  // Neutral checks
  assert.strictEqual(hasCountryConflict("Indonesia", "India"), false);
  assert.strictEqual(hasCountryConflict("Indonesia", "Pakistan"), false);
  assert.strictEqual(hasCountryConflict("Malaysia", "China"), false);
  assert.strictEqual(hasCountryConflict("Germany", "France"), false);
  assert.strictEqual(hasCountryConflict("Indonesia", "Indonesia"), false);

  // 3. Group Segregation & Allocation
  const groupA = [
    { nationality: "Indonesia" },
    { nationality: "Pakistan" },
    { nationality: "Malaysia" },
  ];
  assert.strictEqual(isGroupCompatibleWithTraveler(groupA, "India"), false);
  assert.deepStrictEqual(findConflictingCountriesInGroup("India", groupA), ["Pakistan"]);
  assert.strictEqual(isGroupCompatibleWithTraveler(groupA, "Germany"), true);
  assert.deepStrictEqual(findConflictingCountriesInGroup("Germany", groupA), []);

  const groups = [
    {
      id: "group-1",
      capacity: 6,
      currentParticipants: 3,
      status: "open",
      participants: [{ nationality: "Pakistan" }, { nationality: "Indonesia" }],
    },
    {
      id: "group-2",
      capacity: 6,
      currentParticipants: 2,
      status: "open",
      participants: [{ nationality: "Indonesia" }, { nationality: "Malaysia" }],
    },
  ];

  const bestForIndia = findBestCompatibleGroup(groups, ["India"], 1);
  assert.strictEqual(bestForIndia?.id, "group-2");

  const bestForIndo = findBestCompatibleGroup(groups, ["Indonesia"], 1);
  assert.strictEqual(bestForIndo?.id, "group-1");

  // 4. Internal Multi-Booking Conflicts
  const mixed = checkInternalBookingConflicts(["Indonesia", "India", "Pakistan"]);
  assert.strictEqual(mixed.hasConflict, true);
  assert.strictEqual(mixed.conflicts.length, 1);
  assert.deepStrictEqual(mixed.conflicts[0], { countryA: "India", countryB: "Pakistan" });

  const harmonious = checkInternalBookingConflicts(["Indonesia", "Malaysia", "Singapore"]);
  assert.strictEqual(harmonious.hasConflict, false);
  assert.strictEqual(harmonious.conflicts.length, 0);

  return true;
}
