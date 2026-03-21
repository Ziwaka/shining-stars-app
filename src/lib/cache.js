/**
 * Shining Stars — IndexedDB Cache Manager
 *
 * GAS calls တွေ network မပါဘဲ local ကနေ serve လုပ်ပေးတယ်
 * TTL (time-to-live) ကျော်ရင် cache expire ဖြစ်ပြီး GAS ကို fresh call လုပ်တယ်
 *
 * Usage:
 *   import { CacheDB } from '@/lib/cache';
 *   const data = await CacheDB.get('initialData')          // ဖတ်တာ
 *   await CacheDB.set('initialData', myData, 30)           // 30 min cache
 *   await CacheDB.clear('initialData')                     // တစ်ခုပဲ ဖျက်
 *   await CacheDB.clearAll()                               // အကုန်ဖျက်
 */

// ── Cache TTL config (minutes) ──────────────────────────────────────────────
// ဘယ် data ကို ဘယ်လောက်ကြာ cache သိမ်းသလဲ
export const CACHE_TTL = {
  initialData:    30,   // student list, staff list, announcements — 30 min
  timetable:      720,  // timetable မပြောင်းတတ်ဘူး — 12 hour
  registryConfig: 720,  // grades, houses, positions — 12 hour
  houseConfig:    60,   // house list + colors — 1 hour
  examConfig:     720,  // exam terms, subjects — 12 hour
  feeConfig:      60,   // fee categories — 1 hour
  announcements:  10,   // announcements မကြာမကြာ ပြောင်းနိုင် — 10 min
  housePoints:    5,    // leaderboard — 5 min
  attendance:     0,    // real-time — cache မလုပ်ဘူး
  leaveRecords:   0,    // real-time — cache မလုပ်ဘူး
};

// ── DB config ──────────────────────────────────────────────────────────────
const DB_NAME    = 'shining-stars-cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache-store';

// ── Internal: open DB ──────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB — Server side မဟုတ်ဘဲ browser မှာပဲ သုံးနိုင်တယ်'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
}

// ── In-memory fallback (IndexedDB မရရင် သုံးတယ်) ──────────────────────────
const memoryCache = {};

// ══════════════════════════════════════════════════════════════════════════
//  CacheDB — Public API
// ══════════════════════════════════════════════════════════════════════════
export const CacheDB = {

  /**
   * Cache ကနေ data ဖတ်တယ်
   * @param {string} key
   * @returns {any|null}  — expire ဖြစ်နေရင် null return
   */
  async get(key) {
    try {
      const db    = await openDB();
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const entry = await promisify(store.get(key));

      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        // Expired → auto delete
        await this.clear(key);
        return null;
      }
      return entry.data;

    } catch {
      // IndexedDB ကို access မရရင် memory fallback သုံးတယ်
      const entry = memoryCache[key];
      if (!entry || Date.now() > entry.expiresAt) return null;
      return entry.data;
    }
  },

  /**
   * Cache မှာ data သိမ်းတယ်
   * @param {string} key
   * @param {any}    data
   * @param {number} ttlMinutes  — 0 ဆိုရင် cache မလုပ်ဘဲ return
   */
  async set(key, data, ttlMinutes = 30) {
    if (!ttlMinutes || ttlMinutes <= 0) return; // TTL 0 = no cache

    const entry = {
      key,
      data,
      cachedAt:  Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };

    try {
      const db    = await openDB();
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await promisify(store.put(entry));
    } catch {
      // Memory fallback
      memoryCache[key] = entry;
    }
  },

  /**
   * Key တစ်ခုတည်း ဖျက်တယ် (force refresh လုပ်ချင်ရင်)
   */
  async clear(key) {
    try {
      const db    = await openDB();
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await promisify(store.delete(key));
    } catch {
      delete memoryCache[key];
    }
  },

  /**
   * Cache အားလုံး ဖျက်တယ် (logout or manual refresh)
   */
  async clearAll() {
    try {
      const db    = await openDB();
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await promisify(store.clear());
    } catch {
      Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
    }
  },

  /**
   * Cache မှာ ဘာတွေ ရှိလဲ၊ ဘယ်ဟာ expire ဖြစ်ပြီးလဲ စစ်တယ် (debug အတွက်)
   */
  async status() {
    try {
      const db    = await openDB();
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const all   = await promisify(store.getAll());
      const now   = Date.now();

      return all.map(e => ({
        key:      e.key,
        valid:    now < e.expiresAt,
        cachedAt: new Date(e.cachedAt).toLocaleTimeString(),
        expiresIn: Math.max(0, Math.round((e.expiresAt - now) / 60000)) + ' min',
      }));
    } catch {
      return Object.keys(memoryCache).map(k => ({
        key: k, valid: Date.now() < memoryCache[k].expiresAt, source: 'memory',
      }));
    }
  },
};

// ── Helper: IDBRequest → Promise ───────────────────────────────────────────
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror   = (e) => reject(e.target.error);
  });
}


// ══════════════════════════════════════════════════════════════════════════
//  cachedFetch — GAS call တစ်ခုကို cache-first pattern နဲ့ ခေါ်တာ
//
//  Usage:
//    const data = await cachedFetch(
//      'initialData',                        // cache key
//      () => fetch(WEB_APP_URL, {...}),       // fetch function
//      CACHE_TTL.initialData                  // TTL minutes
//    );
// ══════════════════════════════════════════════════════════════════════════
export async function cachedFetch(cacheKey, fetchFn, ttlMinutes = 30) {
  // TTL 0 → always live, skip cache
  if (!ttlMinutes) return fetchFn();

  // 1) Cache hit?
  const cached = await CacheDB.get(cacheKey);
  if (cached !== null) return cached;

  // 2) Cache miss → fetch fresh
  const result = await fetchFn();

  // 3) Save to cache (only if success)
  if (result && result.success !== false) {
    await CacheDB.set(cacheKey, result, ttlMinutes);
  }

  return result;
}
