import { haversine, type LatLng } from '@/lib/geo';

/**
 * The 24 governorates of Tunisia.
 *
 * Each carries the coordinates of its main city — the seat of the governorate
 * — which is all this list claims to know. It is used for two things: to let
 * a place be filed under a governorate, and to SUGGEST one from a GPS fix by
 * finding the nearest seat. Near a border the nearest seat can be the wrong
 * governorate, so the suggestion is always shown and always editable; it is
 * never written without being seen.
 *
 * `region` is the everyday grouping people use when they talk about the
 * country, not an administrative unit.
 */

export type TnRegion = 'Grand Tunis' | 'North' | 'Cap Bon' | 'Sahel' | 'Centre' | 'South';

export interface Governorate {
  key: string;
  name: string;
  /** the name as written in Arabic */
  ar: string;
  seat: string;
  region: TnRegion;
  at: LatLng;
}

export const GOVERNORATES: Governorate[] = [
  { key: 'tunis', name: 'Tunis', ar: 'تونس', seat: 'Tunis', region: 'Grand Tunis', at: [36.8065, 10.1815] },
  { key: 'ariana', name: 'Ariana', ar: 'أريانة', seat: 'Ariana', region: 'Grand Tunis', at: [36.8625, 10.1956] },
  { key: 'ben-arous', name: 'Ben Arous', ar: 'بن عروس', seat: 'Ben Arous', region: 'Grand Tunis', at: [36.7531, 10.2189] },
  { key: 'manouba', name: 'Manouba', ar: 'منوبة', seat: 'Manouba', region: 'Grand Tunis', at: [36.8081, 10.0972] },
  { key: 'nabeul', name: 'Nabeul', ar: 'نابل', seat: 'Nabeul', region: 'Cap Bon', at: [36.4561, 10.7376] },
  { key: 'zaghouan', name: 'Zaghouan', ar: 'زغوان', seat: 'Zaghouan', region: 'North', at: [36.4029, 10.1429] },
  { key: 'bizerte', name: 'Bizerte', ar: 'بنزرت', seat: 'Bizerte', region: 'North', at: [37.2744, 9.8739] },
  { key: 'beja', name: 'Béja', ar: 'باجة', seat: 'Béja', region: 'North', at: [36.7256, 9.1817] },
  { key: 'jendouba', name: 'Jendouba', ar: 'جندوبة', seat: 'Jendouba', region: 'North', at: [36.5011, 8.7802] },
  { key: 'kef', name: 'Le Kef', ar: 'الكاف', seat: 'Le Kef', region: 'North', at: [36.1742, 8.7049] },
  { key: 'siliana', name: 'Siliana', ar: 'سليانة', seat: 'Siliana', region: 'North', at: [36.0849, 9.3708] },
  { key: 'sousse', name: 'Sousse', ar: 'سوسة', seat: 'Sousse', region: 'Sahel', at: [35.8256, 10.6369] },
  { key: 'monastir', name: 'Monastir', ar: 'المنستير', seat: 'Monastir', region: 'Sahel', at: [35.7643, 10.8113] },
  { key: 'mahdia', name: 'Mahdia', ar: 'المهدية', seat: 'Mahdia', region: 'Sahel', at: [35.5047, 11.0622] },
  { key: 'sfax', name: 'Sfax', ar: 'صفاقس', seat: 'Sfax', region: 'Sahel', at: [34.7406, 10.7603] },
  { key: 'kairouan', name: 'Kairouan', ar: 'القيروان', seat: 'Kairouan', region: 'Centre', at: [35.6781, 10.0963] },
  { key: 'kasserine', name: 'Kasserine', ar: 'القصرين', seat: 'Kasserine', region: 'Centre', at: [35.1676, 8.8365] },
  { key: 'sidi-bouzid', name: 'Sidi Bouzid', ar: 'سيدي بوزيد', seat: 'Sidi Bouzid', region: 'Centre', at: [35.0382, 9.4849] },
  { key: 'gabes', name: 'Gabès', ar: 'قابس', seat: 'Gabès', region: 'South', at: [33.8815, 10.0982] },
  { key: 'medenine', name: 'Médenine', ar: 'مدنين', seat: 'Médenine', region: 'South', at: [33.3549, 10.5055] },
  { key: 'tataouine', name: 'Tataouine', ar: 'تطاوين', seat: 'Tataouine', region: 'South', at: [32.9297, 10.4518] },
  { key: 'gafsa', name: 'Gafsa', ar: 'قفصة', seat: 'Gafsa', region: 'South', at: [34.425, 8.7842] },
  { key: 'tozeur', name: 'Tozeur', ar: 'توزر', seat: 'Tozeur', region: 'South', at: [33.9197, 8.1335] },
  { key: 'kebili', name: 'Kébili', ar: 'قبلي', seat: 'Kébili', region: 'South', at: [33.7044, 8.969] },
];

export const REGION_ORDER: TnRegion[] = ['Grand Tunis', 'North', 'Cap Bon', 'Sahel', 'Centre', 'South'];

export const findGovernorate = (key: string | null | undefined): Governorate | undefined =>
  GOVERNORATES.find((g) => g.key === key);

/** Roughly the box Tunisia sits in — a fix outside it gets no suggestion at all. */
export function insideTunisia(at: LatLng): boolean {
  const [lat, lng] = at;
  return lat >= 30.2 && lat <= 37.6 && lng >= 7.5 && lng <= 11.7;
}

/**
 * The governorate whose seat is nearest — a suggestion, with the distance it
 * was judged on so the screen can say how sure it is. Null outside Tunisia.
 */
export function suggestGovernorate(at: LatLng): { governorate: Governorate; km: number } | null {
  if (!insideTunisia(at)) return null;
  let best: { governorate: Governorate; km: number } | null = null;
  for (const g of GOVERNORATES) {
    const km = haversine(at, g.at) / 1000;
    if (!best || km < best.km) best = { governorate: g, km };
  }
  return best;
}
