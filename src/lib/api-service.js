// src/lib/api-service.js
// Updated: IndexedDB cache integration ထည့်ထားသည်
// Read actions → cache-first  |  Write actions → always live (no cache)

import { WEB_APP_URL } from './api';
import { cachedFetch, CacheDB, CACHE_TTL } from './cache';

// ── Internal GAS caller ────────────────────────────────────────────────────
function gasCall(body) {
  return fetch(WEB_APP_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body:    JSON.stringify(body),
  }).then(r => r.json());
}

export const apiService = {

  // ══════════════════════════════════════════════════════════════
  //  AUTH
  // ══════════════════════════════════════════════════════════════
  async login(userType, username, password) {
    return gasCall({ action: 'login', userType, username, password });
  },

  // ══════════════════════════════════════════════════════════════
  //  CACHED READ ACTIONS
  // ══════════════════════════════════════════════════════════════

  async getInitialData(params = {}) {
    return cachedFetch('initialData', () => gasCall({ action: 'getInitialData', ...params }), CACHE_TTL.initialData);
  },

  async getTimetable(grade, section, teacher) {
    const key = `timetable_${grade||'all'}_${section||'all'}`;
    return cachedFetch(key, () => gasCall({ action: 'getTimetable', grade, section, teacher }), CACHE_TTL.timetable);
  },

  async getEffectiveTimetable(grade, section, date) {
    const d = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Yangon' });
    return cachedFetch(`effectiveTT_${grade}_${section}_${d}`, () => gasCall({ action: 'getEffectiveTimetable', grade, section, date: d }), 30);
  },

  async getRegistryConfig() {
    return cachedFetch('registryConfig', () => gasCall({ action: 'getRegistryConfig' }), CACHE_TTL.registryConfig);
  },

  async getHouseConfig() {
    return cachedFetch('houseConfig', () => gasCall({ action: 'getHouseConfig' }), CACHE_TTL.houseConfig);
  },

  async getExamConfig() {
    return cachedFetch('examConfig', () => gasCall({ action: 'getExamConfig' }), CACHE_TTL.examConfig);
  },

  async getFeeConfig() {
    return cachedFetch('feeConfig', () => gasCall({ action: 'getFeeConfig' }), CACHE_TTL.feeConfig);
  },

  async getAnnouncements() {
    return cachedFetch('announcements', () => gasCall({ action: 'getAnnouncements' }), CACHE_TTL.announcements);
  },

  async getHousePoints(recordedBy) {
    return cachedFetch('housePoints', () => gasCall({ action: 'getHousePoints', recordedBy }), CACHE_TTL.housePoints);
  },

  async getTimetableConfig() {
    return cachedFetch('timetableConfig', () => gasCall({ action: 'getTimetableConfig' }), CACHE_TTL.timetable);
  },

  async getSeasonalRules() {
    return cachedFetch('seasonalRules', () => gasCall({ action: 'getSeasonalRules' }), 60);
  },

  async getData(sheetName, targetGid) {
    return cachedFetch(`getData_${sheetName}`, () => gasCall({ action: 'getData', sheetName, targetGid }), 5);
  },

  // ══════════════════════════════════════════════════════════════
  //  LIVE READ ACTIONS (real-time — cache မလုပ်)
  // ══════════════════════════════════════════════════════════════

  async getAttendance(date)         { return gasCall({ action: 'getAttendance', date }); },
  async getExamResults(params)      { return gasCall({ action: 'getExamResults', ...params }); },
  async getDashboardData()          { return gasCall({ action: 'getDashboardData' }); },
  async getAnalytics()              { return gasCall({ action: 'getAnalytics' }); },
  async getStaffPermissions()       { return gasCall({ action: 'getStaffPermissions' }); },
  async getMyStaffPermissions(p)    { return gasCall({ action: 'getMyStaffPermissions', ...p }); },
  async getExceptions(filter)       { return gasCall({ action: 'getExceptions', ...filter }); },
  async getInventory()              { return gasCall({ action: 'getInventory' }); },
  async getHostelInventory(p = {})  { return gasCall({ action: 'getHostelInventory', ...p }); },
  async getStaffLeaveBalance(p)     { return gasCall({ action: 'getStaffLeaveBalance', ...p }); },
  async getLostFound()              { return gasCall({ action: 'getLostFound' }); },
  async getVehicles()               { return gasCall({ action: 'getVehicles' }); },
  async getVendors()                { return gasCall({ action: 'getVendors' }); },
  async getInventoryLog()           { return gasCall({ action: 'getInventoryLog' }); },
  async getPurchaseRequests()       { return gasCall({ action: 'getPurchaseRequests' }); },
  async getAttendanceTrend()        { return gasCall({ action: 'getAttendanceTrend' }); },
  async getPublicData()             { return gasCall({ action: 'getPublicData' }); },
  async getShoutbox()               { return gasCall({ action: 'getShoutbox' }); },
  async getEvents(params)           { return gasCall({ action: 'getEvents', ...params }); },
  async getStudentById(id)          { return gasCall({ action: 'getStudentById', id }); },
  async getStaffById(id)            { return gasCall({ action: 'getStaffById', id }); },
  async getItemHistory(itemId)      { return gasCall({ action: 'getItemHistory', Item_ID: itemId }); },
  async getHostelAssetHistory(id)   { return gasCall({ action: 'getHostelAssetHistory', Asset_ID: id }); },
  async getHostelInventorySummary() { return gasCall({ action: 'getHostelInventorySummary' }); },
  async getHostelInventoryLog(p)    { return gasCall({ action: 'getHostelInventoryLog', ...p }); },

  // ══════════════════════════════════════════════════════════════
  //  WRITE ACTIONS — always live + cache invalidate
  // ══════════════════════════════════════════════════════════════

  async recordData(targetSheet, payload)  { return gasCall({ action: 'recordData', targetSheet, payload }); },
  async recordNote(sheetName, data)       { return gasCall({ action: 'recordNote', sheetName, data }); },
  async submitData(sheetName, data)       { return gasCall({ action: 'submitData', sheetName, data }); },
  async recordFeesBulk(data)             { return gasCall({ action: 'recordFeesBulk', ...data }); },
  async recordExamBulk(data)             { return gasCall({ action: 'recordExamBulk', ...data }); },
  async updateExamRecord(data)           { return gasCall({ action: 'updateExamRecord', ...data }); },
  async updateLeave(data)                { return gasCall({ action: 'updateLeave', ...data }); },
  async submitStaffLeave(data)           { return gasCall({ action: 'submitStaffLeave', ...data }); },
  async updateStaffPermissions(data)     { return gasCall({ action: 'updateStaffPermissions', ...data }); },
  async uploadPhoto(data)                { return gasCall({ action: 'uploadPhoto', ...data }); },
  async updatePhotoUrl(data)             { return gasCall({ action: 'updatePhotoUrl', ...data }); },
  async addInventoryItem(data)           { return gasCall({ action: 'addInventoryItem', ...data }); },
  async addInventoryItemsBulk(data)      { return gasCall({ action: 'addInventoryItemsBulk', ...data }); },
  async updateInventoryItem(data)        { return gasCall({ action: 'updateInventoryItem', ...data }); },
  async logInventoryUsage(data)          { return gasCall({ action: 'logInventoryUsage', ...data }); },
  async transferInventoryItem(data)      { return gasCall({ action: 'transferInventoryItem', ...data }); },
  async submitPurchaseRequest(data)      { return gasCall({ action: 'submitPurchaseRequest', ...data }); },
  async addHostelItem(data)              { return gasCall({ action: 'addHostelItem', ...data }); },
  async addHostelItemsBulk(data)         { return gasCall({ action: 'addHostelItemsBulk', ...data }); },
  async updateHostelItem(data)           { return gasCall({ action: 'updateHostelItem', ...data }); },
  async logHostelUsage(data)             { return gasCall({ action: 'logHostelUsage', ...data }); },
  async submitLostFound(data)            { return gasCall({ action: 'submitLostFound', ...data }); },
  async updateLostFound(data)            { return gasCall({ action: 'updateLostFound', ...data }); },
  async saveVehicle(data)                { return gasCall({ action: 'saveVehicle', ...data }); },
  async deleteVehicle(data)              { return gasCall({ action: 'deleteVehicle', ...data }); },
  async saveVendor(data)                 { return gasCall({ action: 'saveVendor', ...data }); },
  async deleteVendor(data)              { return gasCall({ action: 'deleteVendor', ...data }); },
  async postShoutbox(data)              { return gasCall({ action: 'postShoutbox', ...data }); },
  async saveException(data)             { return gasCall({ action: 'saveException', ...data }); },
  async deleteException(date, cls)      { return gasCall({ action: 'deleteException', Date: date, Class: cls }); },

  async postAnnouncement(data) {
    const r = await gasCall({ action: 'postAnnouncement', ...data });
    await CacheDB.clear('announcements');
    return r;
  },
  async deleteAnnouncement(data) {
    const r = await gasCall({ action: 'deleteAnnouncement', ...data });
    await CacheDB.clear('announcements');
    return r;
  },
  async recordHousePoint(data) {
    const r = await gasCall({ action: 'recordHousePoint', ...data });
    await CacheDB.clear('housePoints');
    return r;
  },
  async addStudent(data) {
    const r = await gasCall({ action: 'addStudent', ...data });
    await CacheDB.clear('initialData');
    return r;
  },
  async updateStudent(data) {
    const r = await gasCall({ action: 'updateStudent', ...data });
    await CacheDB.clear('initialData');
    return r;
  },
  async deleteStudent(data) {
    const r = await gasCall({ action: 'deleteStudent', ...data });
    await CacheDB.clear('initialData');
    return r;
  },
  async addStaff(data) {
    const r = await gasCall({ action: 'addStaff', ...data });
    await CacheDB.clear('initialData');
    return r;
  },
  async updateStaff(data) {
    const r = await gasCall({ action: 'updateStaff', ...data });
    await CacheDB.clear('initialData');
    return r;
  },
  async deleteStaff(data) {
    const r = await gasCall({ action: 'deleteStaff', ...data });
    await CacheDB.clear('initialData');
    return r;
  },
  async saveTimetable(data) {
    const r = await gasCall({ action: 'saveTimetable', ...data });
    await Promise.all([
      CacheDB.clear('timetableConfig'),
      CacheDB.clear(`timetable_${data.grade||''}_${data.section||''}`),
      CacheDB.clear('timetable_all_all'),
    ]);
    return r;
  },
  async saveTimetableConfig(data) {
    const r = await gasCall({ action: 'saveTimetableConfig', ...data });
    await CacheDB.clear('timetableConfig');
    return r;
  },
  async saveSeasonalRule(data) {
    const r = await gasCall({ action: 'saveSeasonalRule', ...data });
    await CacheDB.clear('seasonalRules');
    return r;
  },
  async deleteSeasonalRule(name) {
    const r = await gasCall({ action: 'deleteSeasonalRule', Name: name });
    await CacheDB.clear('seasonalRules');
    return r;
  },
  async saveEvent(data)  { return gasCall({ action: 'saveEvent',  ...data }); },
  async deleteEvent(data){ return gasCall({ action: 'deleteEvent', ...data }); },

  // ── Cache utilities ────────────────────────────────────────
  cache: {
    clearAll: () => CacheDB.clearAll(),
    clearKey: (key) => CacheDB.clear(key),
    status:   () => CacheDB.status(),
  },
};
