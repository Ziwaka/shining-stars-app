// ═══════════════════════════════════════════════════════════════════
// SHINING STARS - Google Apps Script (FINAL MERGED v3)
// Merged from: Current (v2.5) + v2 Registry CRUD
// Added: Cloudinary upload, GAS-side permission check, TZ fix
// ═══════════════════════════════════════════════════════════════════

var TZ = 'Asia/Yangon'; // ── MASTER TIMEZONE — တစ်နေရာတည်းသာ ပြင်ရသည်

// ══════════════════════════════════════════════════════
// ENTRY POINT
// ══════════════════════════════════════════════════════
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    switch (action) {
      case 'login':                    return handleLogin(data);
      case 'getData':                  return getData(data);
      case 'getInitialData':           return getInitialData(data);
      case 'getConfig':                return getConfig(data);
      case 'getFeeConfig':             return getFeeConfig(data);
      case 'recordFeesBulk':           return recordFeesBulk(data);
      case 'getHouseConfig':           return getHouseConfig(data);
      case 'debugConfig':              return debugConfig(data);
      case 'recordHousePoint':         return recordHousePoint(data);
      case 'getHousePoints':           return getHousePoints(data);
      case 'getDashboardData':         return getDashboardData(data);
      case 'submitData':               return submitData(data);
      case 'postAnnouncement':         return postAnnouncement(data);
      case 'deleteAnnouncement':       return deleteAnnouncement(data);
      case 'getAnnouncements':         return getAnnouncements(data);
      case 'getExamConfig':            return getExamConfig(data);
      case 'getShoutbox':              return getShoutbox(data);
      case 'postShoutbox':             return postShoutbox(data);
      case 'getPublicData':            return getPublicData(data);
      case 'getAnalytics':             return getAnalytics(data);
      case 'getTimetableConfig':       return getTimetableConfig(data);
      case 'saveTimetableConfig':      return saveTimetableConfig(data);
      case 'getTimetable':             return getTimetable(data);
      case 'saveTimetable':            return saveTimetable(data);
      case 'getEvents':                return getEvents(data);
      case 'saveEvent':                return saveEvent(data);
      case 'deleteEvent':              return deleteEvent(data);
      case 'recordExamBulk':           return recordExamBulk(data);
      case 'getExamResults':           return getExamResults(data);
      case 'updateExamRecord':         return updateExamRecord(data);
      case 'recordNote':               return recordNote(data);
      case 'recordData':               return recordData(data);
      case 'updateLeave':              return updateLeave(data);
      case 'uploadPhoto':              return uploadPhoto(data);
      case 'updatePhotoUrl':           return updatePhotoUrl(data);
      case 'getStaffPermissions':      return getStaffPermissions(data);
      case 'getMyStaffPermissions':    return getMyStaffPermissions(data);
      case 'getStaffLeaveConfig':      return getStaffLeaveConfig(data);
      case 'getStaffLeaveBalance':     return getStaffLeaveBalance(data);
      case 'submitStaffLeave':         return submitStaffLeave(data);
      case 'getAttendance':            return getAttendance(data);
      case 'updateStaffPermissions':   return updateStaffPermissions(data);
      case 'getInventoryConfig':       return getInventoryConfig(data);
      case 'getInventory':             return getInventory(data);
      case 'addInventoryItem':         return addInventoryItem(data);
      case 'addInventoryItemsBulk':    return addInventoryItemsBulk(data);
      case 'updateInventoryItem':      return updateInventoryItem(data);
      case 'logInventoryUsage':        return logInventoryUsage(data);
      case 'saveInventoryConfig':      return saveInventoryConfig(data);
      case 'transferInventoryItem':    return transferInventoryItem(data);
      case 'getItemHistory':           return getItemHistory(data);
      case 'submitPurchaseRequest':    return submitPurchaseRequest(data);
      case 'getPurchaseRequests':      return getPurchaseRequests(data);
      case 'getInventoryLog':          return getInventoryLog(data);
      case 'getLostFound':             return getLostFound(data);
      case 'submitLostFound':          return submitLostFound(data);
      case 'updateLostFound':          return updateLostFound(data);
      case 'getAttendanceTrend':       return getAttendanceTrend(data);
      case 'getVehicles':              return getVehicles(data);
      case 'saveVehicle':              return saveVehicle(data);
      case 'deleteVehicle':            return deleteVehicle(data);
      case 'getVendors':               return getVendors(data);
      case 'saveVendor':               return saveVendor(data);
      case 'deleteVendor':             return deleteVendor(data);
      case 'getEffectiveTimetable':    return getEffectiveTimetable(data);
      case 'getExceptions':            return getExceptions(data);
      case 'saveException':            return saveException(data);
      case 'deleteException':          return deleteException(data);
      case 'getSeasonalRules':         return getSeasonalRules(data);
      case 'saveSeasonalRule':         return saveSeasonalRule(data);
      case 'deleteSeasonalRule':       return deleteSeasonalRule(data);
      case 'migrateHostelInventoryToIndividualItems': return migrateHostelInventoryToIndividualItems(data);
      case 'getHostelInventory':       return getHostelInventory(data);
      case 'addHostelItem':            return addHostelItem(data);
      case 'addHostelItemsBulk':       return addHostelItemsBulk(data);
      case 'updateHostelItem':         return updateHostelItem(data);
      case 'logHostelUsage':           return logHostelUsage(data);
      case 'getHostelAssetHistory':    return getHostelAssetHistory(data);
      case 'getHostelInventorySummary':return getHostelInventorySummary(data);
      case 'getHostelInventoryLog':    return getHostelInventoryLog(data);
      // ── REGISTRY CRUD ──
      case 'getRegistryConfig':        return getRegistryConfig(data);
      case 'addStudent':               return addStudent(data);
      case 'updateStudent':            return updateStudent(data);
      case 'deleteStudent':            return deleteStudent(data);
      case 'getStudentById':           return getStudentById(data);
      case 'addStaff':                 return addStaff(data);
      case 'updateStaff':              return updateStaff(data);
      case 'deleteStaff':              return deleteStaff(data);
      case 'getStaffById':             return getStaffById(data);
      default: return respond({ success: false, message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return respond({ success: false, message: 'Server Error: ' + err.toString() });
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', app: 'Shining Stars GAS v3' })).setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.toString().trim());
  return rows.slice(1).filter(r => r.some(c => c !== '' && c !== null && c !== undefined)).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
}

function _formatDateVal(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date) return Utilities.formatDate(val, TZ, 'yyyy-MM-dd');
  var s = val.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.substring(0, 10);
  try { var d = new Date(s); if (!isNaN(d.getTime())) return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); } catch(e2) {}
  return s;
}

function getTodayGAS() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function getNowTimeGAS() { return Utilities.formatDate(new Date(), TZ, 'HH:mm:ss'); }

function safePoints(val) { var n = parseInt(val, 10); return isNaN(n) ? 0 : n; }

function getDayName(dateStr) {
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
}

function getSheetByGid(gid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) { if (sheets[i].getSheetId() === Number(gid)) return sheets[i]; }
  return null;
}

function getField(row, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    if (row[candidates[i]] !== undefined && row[candidates[i]] !== '') return row[candidates[i]].toString().trim();
  }
  return '';
}

// ══════════════════════════════════════════════════════
// GAS-SIDE PERMISSION CHECK (NEW)
// ══════════════════════════════════════════════════════
/**
 * GAS side permission check
 * data.userRole  : 'management' | 'staff' | 'student'
 * data.staffId   : Staff_ID (staff only)
 * permKey        : 'Can_Manage_Fees' etc. (null = management-only action)
 *
 * Returns: { allowed: bool, reason: string }
 * 
 * SOFT MODE: userRole မပါပါက allow လုပ်သည် (backward compat)
 * HARD MODE: userRole ပါပါက strict check လုပ်သည်
 */
function _checkPermission(data, permKey) {
  // accept different client field names
  var role = (data.userRole || data.role || data.userType || '').toString().toLowerCase().trim();
  
  // No role provided → soft mode, allow (backward compat for old calls)
  if (!role) return { allowed: true, reason: 'no_role_provided' };
  
  // Management → always allowed
  if (role === 'management') return { allowed: true, reason: 'management' };
  
  // Student → allowed for self-service actions (leave submission, lost found, etc.)
  var STUDENT_ALLOWED_SHEETS = ['Leave_Records','Lost_Found','Shoutbox'];
  if (role === 'student') {
    var sheet = (data.sheetName || data.targetSheet || '').toString();
    if (STUDENT_ALLOWED_SHEETS.indexOf(sheet) >= 0) return { allowed: true, reason: 'student_self_service' };
    return { allowed: false, reason: 'student_not_allowed' };
  }
  
  // Staff → check permission sheet
  if (role === 'staff') {
    var staffId = (data.staffId || data.Staff_ID || data.Recorded_By || data.username || data.Username || '').toString().trim();
    if (!staffId) return { allowed: false, reason: 'staff_id_missing' };
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var permSheet = ss.getSheetByName('Staff_Permissions');
    if (!permSheet) return { allowed: true, reason: 'perm_sheet_missing_allow' }; // Sheet မရှိ → allow
    
    var rows = sheetToObjects(permSheet);

    function _norm(s){ return String(s||'').trim().toUpperCase().replace(/\s+/g,''); }
    var staffKey = _norm(staffId);

    // 1) direct match by Staff_ID or Username column
    var staffRow = rows.find(function(r) {
      var rid = _norm(r.Staff_ID);
      var run = _norm(r.Username);
      return (rid && rid === staffKey) || (run && run === staffKey);
    });

    // 2) if staffId is actually username, map via Staff_Login → Staff_ID
    if (!staffRow) {
      try {
        var loginSheet = ss.getSheetByName('Staff_Login');
        if (loginSheet) {
          var loginRows = sheetToObjects(loginSheet);
          var loginRow = loginRows.find(function(l){
            return _norm(l.Username) === staffKey || _norm(l.Staff_ID) === staffKey;
          });
          if (loginRow) {
            var mappedId = _norm(loginRow.Staff_ID || loginRow.Username);
            if (mappedId) {
              staffRow = rows.find(function(r){ return _norm(r.Staff_ID) === mappedId; });
            }
          }
        }
      } catch(e2) {}
    }
    
    if (!staffRow) return { allowed: false, reason: 'staff_not_in_perm_sheet' };
    if (staffRow.Status === false || String(staffRow.Status || '').toUpperCase() === 'FALSE') {
      return { allowed: false, reason: 'staff_deactivated' };
    }
    
    // permKey null → management-only action
    if (!permKey) return { allowed: false, reason: 'management_only' };
    
    var val = staffRow[permKey];
    var hasIt = val === true || String(val || '').trim().toUpperCase() === 'TRUE';
    return hasIt
      ? { allowed: true,  reason: 'permission_granted' }
      : { allowed: false, reason: 'no_permission: ' + permKey };
  }
  
  return { allowed: false, reason: 'unknown_role' };
}

function _requirePerm(data, permKey) {
  var check = _checkPermission(data, permKey);
  if (!check.allowed) {
    return respond({ success: false, message: 'Permission မရှိပါ (' + check.reason + ')' });
  }
  return null; // null = allowed, proceed
}

// ══════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════
function handleLogin(data) {
  const role = (data.role || data.userType || '').toLowerCase();
  const username = (data.username || '').toString().trim();
  const password = (data.password || '').toString().trim();
  const USERNAME_COLS = ['Username','username','User_Name','Login','Staff_ID','Enrollment No.','Student_ID','ID'];
  const PASSWORD_COLS = ['Password','password','Pass','pass','PIN'];

  try {
    var gid, sheetName;
    if (role === 'management') { gid = 1500101923; sheetName = 'Management_Login'; }
    else if (role === 'staff') { gid = 0; sheetName = 'Staff_Login'; }
    else if (role === 'student') { gid = 1858106882; sheetName = 'Student_Login'; }
    else { return respond({ success: false, message: 'Invalid role: ' + role }); }

    var sheet = getSheetByGid(gid) || SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return respond({ success: false, message: sheetName + ' sheet မတွေ့ပါ (GID: ' + gid + ')' });

    const rows = sheetToObjects(sheet);
    const user = rows.find(r => getField(r, USERNAME_COLS) === username);
    if (!user) return respond({ success: false, message: 'Username မရှိပါ — "' + username + '"' });

    const pw = getField(user, PASSWORD_COLS);
    if (pw !== password) return respond({ success: false, message: 'Password မှားနေသည်' });

    // Staff → load permissions from Staff_Permissions sheet
    var extraInfo = {};
    if (role === 'staff') {
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var staffId = (user.Staff_ID || user.Username || '').toString().trim();
        var permSheet = ss.getSheetByName('Staff_Permissions');
        if (permSheet && staffId) {
          var permRows = sheetToObjects(permSheet);
          var permRow = permRows.find(function(r) { return (r.Staff_ID || '').toString().trim() === staffId; });
          if (permRow) {
            getPermCols().forEach(function(k) { extraInfo[k] = permRow[k]; });
          }
        }
      } catch(ep) {}
    }

    // Student → load extra info from Student_Directory
    if (role === 'student') {
      try {
        var ss2 = SpreadsheetApp.getActiveSpreadsheet();
        var dirSheet = ss2.getSheetByName('Student_Directory');
        if (dirSheet) {
          var dirRows = sheetToObjects(dirSheet);
          var studentID = (user.Student_ID || user['Enrollment No.'] || user['Student ID'] || '').toString().trim();
          var dirRow = null;
          if (studentID) dirRow = dirRows.find(r => (r.Student_ID || r['Enrollment No.'] || '').toString().trim() === studentID);
          if (!dirRow) dirRow = dirRows.find(r => (r.Username || r.username || '').toString().trim() === username);
          if (dirRow) {
            extraInfo.Grade = dirRow.Grade || dirRow.grade || '';
            extraInfo.Class = dirRow.Class || dirRow.class || '';
            extraInfo.Section = dirRow.Section || dirRow.section || '';
            extraInfo.House = dirRow.House || dirRow.house || '';
            extraInfo.Photo_URL = dirRow['Photo URL'] || dirRow['Photo_URL'] || dirRow['Photo'] || '';
          }
        }
      } catch(e) {}
    }

    var userOut = Object.assign({}, user, extraInfo, {
      Name: user.Name || user['Name (ALL CAPITAL)'] || username,
      username: username,
      userRole: role,
      Student_ID: user.Student_ID || user['Enrollment No.'] || user['Student ID'] || '',
      Staff_ID: user.Staff_ID || ''
    });

    // Strip passwords
    ['Password','password','Pass','pass','PIN'].forEach(k => delete userOut[k]);

    return respond({ success: true, user: userOut });
  } catch (e) { return respond({ success: false, message: e.toString() }); }
}

// ══════════════════════════════════════════════════════
// DATA — GENERAL
// ══════════════════════════════════════════════════════
function getData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;
    if (data.sheetName) sheet = ss.getSheetByName(data.sheetName);
    if (!sheet && data.targetGid !== undefined) sheet = getSheetByGid(data.targetGid);
    if (!sheet) return respond({ success: false, message: 'Sheet မတွေ့ပါ' });
    return respond({ success: true, data: sheetToObjects(sheet) });
  } catch (e) { return respond({ success: false, message: e.toString() }); }
}

function getInitialData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const annSheet   = ss.getSheetByName('Announcements');
    const stuSheet   = ss.getSheetByName('Student_Directory');
    const leaveSheet = ss.getSheetByName('Leave_Records');
    const staffSheet = ss.getSheetByName('Staff_Login');

    // ✅ Strip passwords from staffList before sending
    var staffSafe = [];
    if (staffSheet) {
      staffSafe = sheetToObjects(staffSheet).map(function(s) {
        var x = Object.assign({}, s);
        ['Password','password','Pass','pass','PIN'].forEach(k => delete x[k]);
        return x;
      });
    }

    return respond({
      success: true,
      announcements: annSheet   ? sheetToObjects(annSheet)   : [],
      students:      stuSheet   ? sheetToObjects(stuSheet)   : [],
      leaves:        leaveSheet ? sheetToObjects(leaveSheet) : [],
      staffList:     staffSafe
    });
  } catch (e) { return respond({ success: false, message: e.toString() }); }
}

function getConfig(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(data.category);
    if (!sheet) return respond({ success: true, data:[] });
    return respond({ success: true, data: sheetToObjects(sheet) });
  } catch (e) { return respond({ success: false, message: e.toString() }); }
}

// ══════════════════════════════════════════════════════
// HOUSE POINTS & DASHBOARD
// ══════════════════════════════════════════════════════
function getHouseConfig(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('System_Config');
    if (!sheet) return respond({ success: true, categories:[], houses:[], houseColors: {} });
    const rows = sheetToObjects(sheet);
    const houseRows = rows.filter(r => r.Setting_Category === 'House_List' && r.Setting_Name).sort((a,b) => (Number(a.Value_1)||99) - (Number(b.Value_1)||99));
    const houses = houseRows.map(r => r.Setting_Name.toString().trim()).filter(Boolean);
    const houseColors = {};
    houseRows.forEach(r => { if(r.Setting_Name) houseColors[r.Setting_Name.toString().trim()] = r.Value_2 || '#fbbf24'; });
    const catRows = rows.filter(r => r.Setting_Category === 'House_Points' && r.Setting_Name);
    const categories = catRows.map(r => ({ name: r.Setting_Name.toString().trim(), defaultPoints: safePoints(r.Value_1), description: r.Description || '' })).filter(c => c.name);
    return respond({ success: true, categories: categories, houses: houses, houseColors: houseColors });
  } catch (e) { return respond({ success: false, message: e.toString() }); }
}

function debugConfig(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('System_Config');
    if (!sheet) return respond({ success: false, message: 'No System_Config sheet' });
    var rows = sheetToObjects(sheet);
    var hpRows = rows.filter(r => r.Setting_Category === 'House_Points');
    return respond({ success: true, keys: Object.keys(hpRows[0]||rows[0]||{}), housePointsRows: hpRows, totalRows: rows.length });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function recordHousePoint(data) {
  // ── GAS Permission Check ──
  var permErr = _requirePerm(data, 'Can_Record_Points');
  if (permErr) return permErr;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('House_Points');
    if (!sheet) return respond({ success: false, message: 'House_Points sheet မတွေ့ပါ' });
    var dateStr = getTodayGAS();
    var timeStr = getNowTimeGAS();
    var datetimeStr = dateStr + ' ' + timeStr;
    const points = data.Type === 'Deduct' ? -Math.abs(safePoints(data.Points)) : Math.abs(safePoints(data.Points));
    var headers = sheet.getDataRange().getValues()[0];
    if (headers && headers.length > 0 && headers[0] !== '') {
      var obj = { Date: dateStr, Time: timeStr, DateTime: datetimeStr, Type: data.Type || (points < 0 ? 'Deduct' : 'Award'), Event_Name: data.Event_Name || data.Category, House_Name: data.House_Name || '', Student_ID: data.Student_ID || '', Name: data.Name || '', Points: points, Category: data.Category || '', Recorded_By: data.Recorded_By || '', Remark: data.Remark || '' };
      sheet.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
    } else {
      sheet.appendRow([dateStr, timeStr, data.Type || (points<0?'Deduct':'Award'), data.Event_Name||data.Category, data.House_Name||'', data.Student_ID||'', data.Name||'', points, data.Category||'', data.Recorded_By||'', data.Remark||'']);
    }
    return respond({ success: true, message: 'Points ' + (data.Type==='Deduct'?'နှုတ်':'ပေး') + 'ပြီးပါပြီ' });
  } catch (e) { return respond({ success: false, message: e.toString() }); }
}

function getHousePoints(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('House_Points');
    if (!sheet) return respond({ success: true, data: [], leaderboard:[] });
    const rows = sheetToObjects(sheet);
    const totals = {};
    rows.forEach(r => { const h = r.House_Name || r.Verified_House || ''; if (h) totals[h] = (totals[h] || 0) + (safePoints(r.Points) || 0); });
    const leaderboard = Object.keys(totals).map(h => ({ house: h, total: totals[h] })).sort((a,b) => b.total - a.total);
    var filtered = rows;
    if (data && data.recordedBy) filtered = rows.filter(r => r.Recorded_By === data.recordedBy);
    return respond({ success: true, data: filtered.reverse(), leaderboard: leaderboard });
  } catch (e) { return respond({ success: false, message: e.toString() }); }
}

function getDashboardData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const stuSheet = ss.getSheetByName('Student_Directory');
    var totalS = 0, male = 0, female = 0;
    if (stuSheet) {
      const rows = sheetToObjects(stuSheet);
      const active = rows.filter(r => r.Status === true || String(r.Status).toUpperCase() === 'TRUE');
      totalS = active.length;
      male   = active.filter(r => ['M','MALE','ကျား'].indexOf(String(r.Sex||'').trim().toUpperCase()) >= 0).length;
      female = active.filter(r => ['F','FEMALE','မ'].indexOf(String(r.Sex||'').trim().toUpperCase()) >= 0).length;
    }
    var events = [];
    const evSheet = ss.getSheetByName('Events_Calendar');
    if (evSheet) {
      const monthKey = Utilities.formatDate(new Date(), TZ, 'yyyy-MM');
      events = sheetToObjects(evSheet).filter(r => _formatDateVal(r.Start_Date || r.Date || '').startsWith(monthKey)).map(r => ({ title: r.Event_Title || r.Title || '', date: _formatDateVal(r.Start_Date || r.Date || ''), color: r.Color || '#FBBF24', category: r.Category || '' })).slice(0, 5);
    }
    var leaderboard = [];
    const ptSheet = ss.getSheetByName('House_Points');
    if (ptSheet) {
      const totals = {};
      sheetToObjects(ptSheet).forEach(r => { const h = r.House_Name || r.Verified_House || ''; if (h) totals[h] = (totals[h] || 0) + (safePoints(r.Points) || 0); });
      leaderboard = Object.keys(totals).map(h => ({ house: h, total: totals[h] })).sort((a,b) => b.total - a.total);
    }
    var leaves = [];
    const lvSheet = ss.getSheetByName('Leave_Records');
    if (lvSheet) {
      leaves = sheetToObjects(lvSheet).filter(r => r.Status === 'Pending').map(r => ({ Name: r.Name||'', Leave_Type: r.Leave_Type||'', Start_Date: _formatDateVal(r.Start_Date||'') })).slice(0, 4);
    }
    var pendingL = lvSheet ? sheetToObjects(lvSheet).filter(r => r.Status === 'Pending').length : 0;
    return respond({ success: true, totalS: totalS, male: male, female: female, events: events, leaderboard: leaderboard, leaves: leaves, pendingL: pendingL });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

// ══════════════════════════════════════════════════════
// FEES
// ══════════════════════════════════════════════════════
function getFeeConfig(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('System_Config');
    var defaults = { categories:[{ name:'Tuition Fee', amount:50000 }, { name:'Registration', amount:10000 }, { name:'Exam Fee', amount:5000 }, { name:'Hostel Fee', amount:80000 }, { name:'Transport Fee', amount:20000 }, { name:'DUE SETTLEMENT', amount:0 }]};
    if (!sheet) { _seedFeeDefaults(ss); return respond({ success:true, categories: defaults.categories }); }
    var rows = sheetToObjects(sheet);
    var catRows = rows.filter(r => r.Setting_Category === 'Fee_Categories');
    if (catRows.length === 0) { _seedFeeDefaults(ss); rows = sheetToObjects(sheet); catRows = rows.filter(r => r.Setting_Category === 'Fee_Categories'); }
    var categories = catRows.map(r => ({ name: r.Setting_Name, amount: Number(r.Value_1)||0 })).filter(c => c.name);
    if (categories.length === 0) categories = defaults.categories;
    if (!categories.find(c => c.name==='DUE SETTLEMENT')) categories.push({ name:'DUE SETTLEMENT', amount:0 });
    return respond({ success:true, categories: categories });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function _seedFeeDefaults(ss) {
  var sheet = ss.getSheetByName('System_Config');
  if (!sheet) return;
  [['Fee_Categories','Tuition Fee','50000'],['Fee_Categories','Registration','10000'],['Fee_Categories','Exam Fee','5000'],['Fee_Categories','Hostel Fee','80000'],['Fee_Categories','Transport Fee','20000']].forEach(r => sheet.appendRow(r));
}

function recordFeesBulk(data) {
  // ── GAS Permission Check ──
  var permErr = _requirePerm(data, 'Can_Manage_Fees');
  if (permErr) return permErr;

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Fees_Management');
    if (!sheet) { sheet = ss.insertSheet('Fees_Management'); sheet.appendRow(['Date','Student_ID','Name','Grade','Fee_Category','Amount_Paid','Next_Due_Amount','Next_Due_Date','Status','Recorded_By','Remark']); }
    var headers = sheet.getDataRange().getValues()[0];
    var entries = data.entries || [];
    var date = data.Date || getTodayGAS();
    var recBy = data.Recorded_By || '';
    entries.forEach(e => {
      // ✅ Fixed: skip only truly empty amounts
      if (e.Amount_Paid === '' || e.Amount_Paid === null || e.Amount_Paid === undefined) return;
      if (Number(e.Amount_Paid) === 0 && !e.Force) return;
      var row = headers.map(h => {
        var map = { Date:date, Student_ID:e.Student_ID||'', Name:e.Name||'', Grade:e.Grade||'', Fee_Category:e.Fee_Category||'', Amount_Paid:Number(e.Amount_Paid)||0, Next_Due_Amount:Number(e.Next_Due_Amount)||0, Next_Due_Date:e.Next_Due_Date||'', Status:'PAID', Recorded_By:recBy, Remark:e.Remark||'' };
        return map[h] !== undefined ? map[h] : '';
      });
      sheet.appendRow(row);
    });
    return respond({ success:true, message: entries.length + ' ဦးအတွက် fees သိမ်းပြီး' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

// ══════════════════════════════════════════════════════
// TIMETABLE
// ══════════════════════════════════════════════════════
function getTimetableConfig(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Timetable_Config');
    if (!sheet) {
      return respond({ success: true, config: { days:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], periods:[ {no:1,label:'Period 1',start:'08:00',end:'08:45'}, {no:2,label:'Period 2',start:'08:45',end:'09:30'}, {no:3,label:'Period 3',start:'09:30',end:'10:15'}, {no:4,label:'Break',start:'10:15',end:'10:30',isBreak:true}, {no:5,label:'Period 4',start:'10:30',end:'11:15'}, {no:6,label:'Period 5',start:'11:15',end:'12:00'}, {no:7,label:'Lunch',start:'12:00',end:'13:00',isBreak:true}, {no:8,label:'Period 6',start:'13:00',end:'13:45'}, {no:9,label:'Period 7',start:'13:45',end:'14:30'} ], grades:{'KG':['A'],'1':['A'],'2':['A'],'3':['A'],'4':['A'],'5':['A'],'6':['A'],'7':['A'],'8':['A'],'9':['A'],'10':['A','B'],'11':['A','B'],'12':['A','B','C']}, subjects:['Myanmar','English','Mathematics','Science','Social Studies','ICT','Physics','Chemistry','Biology','History','Geography','Economics','Physical Education','Art','Music'] }});
    }
    const rows = sheetToObjects(sheet);
    var cfg = { days:[], periods:[], grades:{}, subjects:[], periods_by_grade:{} };
    rows.forEach(r => { if (!r.Setting || r.JSON_Value === undefined || r.JSON_Value === '') return; try { cfg[r.Setting] = JSON.parse(r.JSON_Value); } catch(e) { cfg[r.Setting] = String(r.JSON_Value); } });
    if (!cfg.periods_by_grade || !Object.keys(cfg.periods_by_grade).length) cfg.periods_by_grade = { default: cfg.periods || [] };
    return respond({ success: true, config: cfg });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function saveTimetableConfig(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Timetable_Config');
    if (!sheet) { sheet = ss.insertSheet('Timetable_Config'); sheet.appendRow(['Setting','JSON_Value','Updated']); }
    const now = Utilities.formatDate(new Date(), 'Asia/Yangon', 'yyyy-MM-dd HH:mm:ss');
    var existing = {};
    var allVals = sheet.getDataRange().getValues();
    allVals.forEach((r,i) => { if(i>0 && r[0]) existing[r[0]] = i+1; });
    ['days','periods','grades','subjects','periods_by_grade','schoolName','schoolLevel','academicYear'].forEach(key => {
      if (data[key] !== undefined) {
        var json = JSON.stringify(data[key]);
        if (existing[key]) sheet.getRange(existing[key],2,1,2).setValues([[json,now]]);
        else sheet.appendRow([key, json, now]);
      }
    });
    return respond({ success: true, message: 'Config သိမ်းပြီးပါပြီ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function getTimetable(data) {
  var VALID_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Timetable');
    if (!sheet) return respond({ success: true, data:[] });
    var rows = sheetToObjects(sheet).map(r => {
      var day = String(r.Day || '').trim();
      if (VALID_DAYS.indexOf(day) === -1) { var parts = day.split('_'); for (var i = 0; i < parts.length; i++) { if (VALID_DAYS.indexOf(parts[i]) !== -1) { day = parts[i]; break; } } }
      return Object.assign({}, r, { Day: day });
    });
    if (data.grade !== undefined && data.grade !== null && data.grade !== '') { var reqGrade = String(data.grade).trim(); rows = rows.filter(r => String(r.Grade || '').trim() === reqGrade); }
    if (data.section !== undefined && data.section !== null && data.section !== '') { var reqSec = String(data.section).trim().toUpperCase(); rows = rows.filter(r => { var rSec = String(r.Section || '').trim().toUpperCase(); return rSec === '' || rSec === reqSec; }); }
    if (data.teacher !== undefined && data.teacher !== null && data.teacher !== '') { var reqT = String(data.teacher).trim().toLowerCase(); rows = rows.filter(r => { var m = String(r.Teacher||'').toLowerCase(); var a = String(r.Asst_Teacher||'').toLowerCase(); return m===reqT||a===reqT; }); }
    return respond({ success: true, data: rows });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function saveTimetable(data) {
  var HEADERS = ['Grade','Section','Day','Period_No','Subject','Teacher','Asst_Teacher','Room','Updated_By'];
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Timetable');
    if (!sheet) sheet = ss.insertSheet('Timetable');
    var existing = sheetToObjects(sheet);
    var reqGrade = String(data.grade || '').trim();
    var reqSec = data.section ? String(data.section).trim() : '';
    var keep = existing.filter(r => { var rGrade=String(r.Grade||'').trim(); var rSec=String(r.Section||'').trim(); var rDay=String(r.Day||'').trim(); var isThis=rGrade===reqGrade&&(!reqSec||rSec===''||rSec===reqSec); if (data.allDays) return !isThis; if (data.day) return !(isThis&&rDay===String(data.day).trim()); return true; });
    var incoming = (data.cells||[]).filter(c => c.Subject).map(c => ({ Grade:String(c.Grade||data.grade||''), Section:String(c.Section||data.section||''), Day:String(c.Day||''), Period_No:String(c.Period_No||''), Subject:String(c.Subject||''), Teacher:String(c.Teacher||''), Asst_Teacher:String(c.Asst_Teacher||''), Room:String(c.Room||''), Updated_By:String(data.Updated_By||'') }));
    var allRows = keep.concat(incoming);
    var writeData = [HEADERS].concat(allRows.map(r => HEADERS.map(h => r[h] !== undefined ? r[h] : '')));
    sheet.clearContents();
    sheet.getRange(1, 1, writeData.length, HEADERS.length).setValues(writeData);
    SpreadsheetApp.flush();
    return respond({ success: true, message: 'Timetable သိမ်းပြီး (' + incoming.length + ' cells)', saved: incoming.length });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

// ══════════════════════════════════════════════════════
// EVENTS & ANNOUNCEMENTS
// ══════════════════════════════════════════════════════
function getEvents(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Events_Calendar');
    if (!sheet) return respond({ success: true, data:[] });
    var rows = sheetToObjects(sheet).map(r => Object.assign({}, r, { Date: _formatDateVal(r.Start_Date||r.Date||''), End_Date: _formatDateVal(r.End_Date||''), Title: (r.Event_Title||r.Title||'').toString(), Type: (r.Category||r.Type||'').toString(), Target: (r.Session_Target||r.Target||'All').toString() }));
    if (data.month) rows = rows.filter(r => r.Date && r.Date.substring(0,7) === data.month);
    return respond({ success: true, data: rows });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function saveEvent(data) {
  var permErr = _requirePerm(data, 'Can_Manage_Events');
  if (permErr) return permErr;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Events_Calendar');
    if (!sheet) { sheet = ss.insertSheet('Events_Calendar'); sheet.appendRow(['Start_Date','End_Date','Event_Title','Category','Session_Target','Grade_Target','Description','Color','Recorded_By']); }
    var headers = sheet.getDataRange().getValues()[0];
    var obj = { Start_Date:(data.Date||data.Start_Date||'').toString().trim().substring(0,10), End_Date:(data.End_Date||'').toString().trim().substring(0,10), Event_Title:data.Title||data.Event_Title||'', Category:data.Type||data.Category||'', Session_Target:data.Target||data.Session_Target||'All', Grade_Target:data.Grade_Target||'All', Description:data.Description||'', Color:data.Color||'#fbbf24', Recorded_By:data.Created_By||data.Recorded_By||'' };
    sheet.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
    return respond({ success: true, message: 'Event ထည့်ပြီးပါပြီ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function deleteEvent(data) {
  var permErr = _requirePerm(data, 'Can_Manage_Events');
  if (permErr) return permErr;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Events_Calendar');
    if (!sheet) return respond({ success: false, message: 'Events_Calendar sheet မတွေ့ပါ' });
    var allRows = sheet.getDataRange().getValues(), headers = allRows[0];
    var dateCol = headers.indexOf('Start_Date') >= 0 ? headers.indexOf('Start_Date') : headers.indexOf('Date');
    var titleCol = headers.indexOf('Event_Title') >= 0 ? headers.indexOf('Event_Title') : headers.indexOf('Title');
    var dateVal = (data.Date||data.Start_Date||'').toString().trim().substring(0,10);
    var titleVal = (data.Title||data.Event_Title||'').toString().trim();
    for (var i = allRows.length-1; i >= 1; i--) { if (_formatDateVal(allRows[i][dateCol])===dateVal && (allRows[i][titleCol]||'').toString().trim()===titleVal) { sheet.deleteRow(i+1); return respond({ success: true, message: 'ဖျက်ပြီးပါပြီ' }); } }
    return respond({ success: false, message: 'ရှာမတွေ့ပါ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function getAnnouncements(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Announcements');
    if (!sheet) return respond({ success: true, data:[] });
    return respond({ success: true, data: sheetToObjects(sheet).reverse() });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function postAnnouncement(data) {
  var permErr = _requirePerm(data, 'Can_Post_Announcement');
  if (permErr) return permErr;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Announcements');
    if (!sheet) return respond({ success: false, message: 'Announcements sheet မတွေ့ပါ' });
    sheet.appendRow([ getTodayGAS(), data.Title||'', data.Message||'', data.Target_Public===true||data.Target_Public==='TRUE'?true:false, data.Target_Staff===true||data.Target_Staff==='TRUE'?true:false, data.Target_Student===true||data.Target_Student==='TRUE'?true:false, data.Is_Priority===true||data.Is_Priority==='TRUE'?true:false, data.Posted_By||'', '' ]);
    return respond({ success: true, message: 'Announcement တင်ပြီးပါပြီ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function deleteAnnouncement(data) {
  var permErr = _requirePerm(data, 'Can_Post_Announcement');
  if (permErr) return permErr;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Announcements');
    if (!sheet) return respond({ success: false, message: 'Announcements sheet မတွေ့ပါ' });
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0].map(h => h.toString().trim());
    // ✅ Fixed: header-based column lookup (မ index hardcode)
    var titleCol   = headers.indexOf('Title');
    var postedByCol = headers.indexOf('Posted_By');
    var dateCol    = headers.indexOf('Date') >= 0 ? headers.indexOf('Date') : 0;
    for (var i=1; i<rows.length; i++) {
      var rTitle = titleCol >= 0 ? rows[i][titleCol] : rows[i][1];
      var rBy    = postedByCol >= 0 ? rows[i][postedByCol] : rows[i][7];
      var rDate  = rows[i][dateCol];
      if (rTitle===data.Title && rBy===data.Posted_By && rDate.toString()===data.Date.toString()) {
        sheet.deleteRow(i+1); return respond({ success: true, message: 'ဖျက်ပြီးပါပြီ' });
      }
    }
    return respond({ success: false, message: 'ရှာမတွေ့ပါ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

// ══════════════════════════════════════════════════════
// ANALYTICS (Full version with demographics)
// ══════════════════════════════════════════════════════
function getAnalytics(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const stuSheet   = ss.getSheetByName('Student_Directory');
    const feeSheet   = ss.getSheetByName('Fees_Management');
    const leaveSheet = ss.getSheetByName('Leave_Records');
    const scoreSheet = ss.getSheetByName('Exam_Records') || ss.getSheetByName('Score_Records');
    const ptSheet    = ss.getSheetByName('House_Points');
    const staffSheet = ss.getSheetByName('Staff_Login');
    const noteSheet  = ss.getSheetByName('Student_Notes_Log');

    const students = stuSheet   ? sheetToObjects(stuSheet)   : [];
    const fees     = feeSheet   ? sheetToObjects(feeSheet)   : [];
    const leaves   = leaveSheet ? sheetToObjects(leaveSheet) : [];
    const scores   = scoreSheet ? sheetToObjects(scoreSheet) : [];
    const points   = ptSheet    ? sheetToObjects(ptSheet)    : [];
    const staff    = staffSheet ? sheetToObjects(staffSheet) : [];
    const notes    = noteSheet  ? sheetToObjects(noteSheet)  : [];

    const activeStudents = students.filter(s => s.Status === true || String(s.Status||'').toUpperCase() === 'TRUE');
    const totalStudents = students.length, activeCount = activeStudents.length;
    const male   = activeStudents.filter(s => ['M','MALE','ကျား'].indexOf((s.Sex||'').toString().toUpperCase()) >= 0).length;
    const female = activeStudents.filter(s => ['F','FEMALE','မ'].indexOf((s.Sex||'').toString().toUpperCase()) >= 0).length;

    var gradeCounts = {};
    activeStudents.forEach(s => { var g = 'G'+(s.Grade||'?'); gradeCounts[g] = (gradeCounts[g]||0)+1; });
    var gradeBreakdown = Object.keys(gradeCounts).sort().map(g => ({ grade:g, count:gradeCounts[g] }));

    var houseCounts = {};
    activeStudents.forEach(s => { if(s.House){ houseCounts[s.House] = (houseCounts[s.House]||0)+1; }});

    var hostelCount = activeStudents.filter(s => (s['School/Hostel']||'').toLowerCase()==='hostel').length;
    var schoolCount = activeStudents.filter(s => (s['School/Hostel']||'').toLowerCase()==='school').length;

    var gradeGenderMap = {};
    activeStudents.forEach(s => {
      var g = 'Grade '+(s.Grade||'?');
      if (!gradeGenderMap[g]) gradeGenderMap[g] = { grade:g, male:0, female:0, total:0 };
      var sex = (s.Sex||'').toString().toUpperCase();
      if (['M','MALE','ကျား'].indexOf(sex) >= 0) gradeGenderMap[g].male++;
      else if (['F','FEMALE','မ'].indexOf(sex) >= 0) gradeGenderMap[g].female++;
      gradeGenderMap[g].total++;
    });
    var gradeGenderBreakdown = Object.keys(gradeGenderMap).sort().map(k => gradeGenderMap[k]);

    // Demographics
    const dm = { religions:{}, towns:{}, fatherOccupations:{}, motherOccupations:{} };
    const ageCounts = { '<10':0, '10-12':0, '13-15':0, '16-18':0, '>18':0 };
    var ageTotal = 0;
    activeStudents.forEach(s => {
      var rel  = String(s['Religion']||'').trim()||'Unknown';     dm.religions[rel] = (dm.religions[rel]||0)+1;
      var town = String(s['Town/City']||s['Town']||'').trim()||'Unknown'; dm.towns[town] = (dm.towns[town]||0)+1;
      var fOcc = String(s["Father's Occupation"]||s["Father Occupation"]||'').trim()||'Unknown'; dm.fatherOccupations[fOcc] = (dm.fatherOccupations[fOcc]||0)+1;
      var mOcc = String(s["Mother's Occupation"]||s["Mother Occupation"]||'').trim()||'Unknown'; dm.motherOccupations[mOcc] = (dm.motherOccupations[mOcc]||0)+1;
      var dobVal = s['Date of Birth']||s['DOB'];
      if (dobVal) {
        var dob = dobVal instanceof Date ? dobVal : new Date(dobVal);
        if (!isNaN(dob.getTime())) {
          ageTotal++;
          var age = Math.abs(new Date(Date.now()-dob.getTime()).getUTCFullYear()-1970);
          if (age<10) ageCounts['<10']++; else if (age<=12) ageCounts['10-12']++; else if (age<=15) ageCounts['13-15']++; else if (age<=18) ageCounts['16-18']++; else ageCounts['>18']++;
        }
      }
    });
    const fmtRank = obj => Object.keys(obj).map(k => ({label:k,count:obj[k]})).sort((a,b) => b.count-a.count);
    const demographics = { ageTotal, ageRanges: Object.keys(ageCounts).map(k => ({range:k,count:ageCounts[k]})).filter(x => x.count>0), religions: fmtRank(dm.religions), towns: fmtRank(dm.towns), fatherOccupations: fmtRank(dm.fatherOccupations), motherOccupations: fmtRank(dm.motherOccupations) };

    var feesPaid = fees.filter(f => f.Status==='Paid'||f.Status==='paid'||f.Status==='PAID').length;
    var feesPending = fees.filter(f => String(f.Status||'').toLowerCase()==='pending').length;
    var totalRevenue = fees.reduce((s,f) => s+(Number(f.Amount_Paid)||0), 0);
    var leavePending = leaves.filter(l => l.Status==='Pending').length;
    var leaveApproved = leaves.filter(l => l.Status==='Approved').length;
    var leaveRejected = leaves.filter(l => l.Status==='Rejected').length;
    var leaveAWOL = leaves.filter(l => l.Status==='AWOL').length;

    var studentMap = {};
    students.forEach(s => { var id = String(s.Student_ID||s['Enrollment No.']||'').trim(); if (id) studentMap[id] = { grade:String(s.Grade||''), section:String(s.Section||s.Class||'') }; });
    var enrichedRecentLeaves = leaves.slice(-15).reverse().map(l => { var st = studentMap[String(l.User_ID||'').trim()]||{}; return { Name:l.Name||'', User_Type:l.User_Type||l.Role||'', Leave_Type:l.Leave_Type||'', Start_Date:l.Start_Date||'', End_Date:l.End_Date||l.Start_Date||'', Total_Days:l.Total_Days||1, Reason:l.Reason||'', Status:l.Status||'Pending', Grade:st.grade||'', Class:st.section||'', Phone:l.Phone||'', Reporter_Name:l.Reporter_Name||'', Relationship:l.Relationship||'' }; });

    var avgScore = 0, distinctions = 0, fails = 0, subjectTotals = {};
    if (scores.length > 0) {
      avgScore = Math.round(scores.reduce((s,r) => s+(Number(r['Percentage (%)']||r.Percentage||0)),0)/scores.length);
      distinctions = scores.filter(s => s.Distinction==='Distinction'||s.Distinction===true).length;
      fails = scores.filter(s => s.Result==='Fail').length;
      scores.forEach(s => { if (!subjectTotals[s.Subject]) subjectTotals[s.Subject]={total:0,count:0}; subjectTotals[s.Subject].total+=Number(s['Percentage (%)']||s.Percentage||0); subjectTotals[s.Subject].count++; });
    }
    var subjectAvg = Object.keys(subjectTotals).map(sub => ({ subject:sub, avg:Math.round(subjectTotals[sub].total/subjectTotals[sub].count) })).sort((a,b) => b.avg-a.avg).slice(0,5);

    var houseTotal = {};
    points.forEach(p => { var h = p.House_Name||p.Verified_House||''; if (h) houseTotal[h] = (houseTotal[h]||0)+(safePoints(p.Points)||0); });
    var sysSheet = ss.getSheetByName('System_Config');
    if (sysSheet) sheetToObjects(sysSheet).filter(r => r.Setting_Category==='House_List'&&r.Setting_Name).forEach(r => { var h=r.Setting_Name.toString().trim(); if(houseTotal[h]===undefined) houseTotal[h]=0; });
    var houseRanking = Object.keys(houseTotal).map(h => ({house:h,total:houseTotal[h]})).sort((a,b) => b.total-a.total);

    var activeStaff = staff.filter(s => s.Status===true||String(s.Status||'').toUpperCase()==='TRUE');
    var studentSampleKeys = stuSheet && stuSheet.getLastRow() > 0 ? stuSheet.getRange(1,1,1,stuSheet.getLastColumn()).getValues()[0].map(h => h.toString().trim()).filter(Boolean) : [];

    return respond({ success: true,
      students: { total:totalStudents, active:activeCount, male, female, hostel:hostelCount, school:schoolCount, gradeBreakdown, gradeGenderBreakdown, houseCounts },
      demographics,
      fees: { paid:feesPaid, pending:feesPending, revenue:totalRevenue },
      leaves: { pending:leavePending, approved:leaveApproved, rejected:leaveRejected, recent:enrichedRecentLeaves },
      scores: { avg:avgScore, distinctions, fails, total:scores.length, subjectAvg },
      housePoints: houseRanking,
      staff: { total:staff.length, active:activeStaff.length },
      recentNotes: notes.slice(-5).reverse(),
      studentSampleKeys,
    });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

// ══════════════════════════════════════════════════════
// PUBLIC ZONE & GENERIC DATA
// ══════════════════════════════════════════════════════
function getPublicData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const annSheet = ss.getSheetByName('Announcements');
    const rows = annSheet ? sheetToObjects(annSheet) : [];
    return respond({ success: true, announcements: rows.filter(r => r.Target_Public===true||r.Target_Public==='TRUE').reverse() });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function getShoutbox(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Shoutbox');
    if (!sheet) return respond({ success: true, data:[] });
    return respond({ success: true, data: sheetToObjects(sheet).slice(-50).reverse() });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function postShoutbox(data) {
  try {
    if (!data.name || !data.message) return respond({ success: false, message: 'Name နှင့် Message လိုအပ်သည်' });
    if (data.message.length > 300) return respond({ success: false, message: 'Message 300 လုံးထက် မကျော်ပါနှင့်' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Shoutbox');
    if (!sheet) { sheet = ss.insertSheet('Shoutbox'); sheet.appendRow(['Date','Name','Message','Phone']); }
    sheet.appendRow([Utilities.formatDate(new Date(), 'Asia/Yangon', 'yyyy-MM-dd HH:mm:ss'), data.name.substring(0,30), data.message.substring(0,300), data.phone||'']);
    return respond({ success: true, message: 'Message ပို့ပြီးပါပြီ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function submitData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(data.sheetName);
    // ✅ Auto-create sheet if it doesn't exist (for dynamic sheets like Hostel_Maintenance)
    if (!sheet) {
      sheet = ss.insertSheet(data.sheetName);
      if (data.data) {
        const headers = Object.keys(data.data);
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      }
    }
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(h => data.data[h]!==undefined?data.data[h]:''));
    return respond({ success: true, message: 'Data သိမ်းပြီးပါပြီ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function recordNote(data) {
  var permErr = _requirePerm(data, 'Can_Record_Note');
  if (permErr) return permErr;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(data.sheetName);
    if (!sheet) return respond({ success: false, message: data.sheetName + ' sheet မရှိပါ' });
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    var payload = data.data;
    if (Array.isArray(payload)) payload = payload[0]||{};
    sheet.appendRow(headers.map(h => (payload&&payload[h]!==undefined)?payload[h]:''));
    return respond({ success: true, message: 'တင်ပြီးပါပြီ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

function recordData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(data.targetSheet);
    if (!sheet) return respond({ success: false, message: data.targetSheet + ' sheet မရှိပါ' });
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(h => (data.payload&&data.payload[h]!==undefined)?data.payload[h]:''));
    return respond({ success: true, message: 'တင်ပြီးပါပြီ' });
  } catch(e) { return respond({ success: false, message: e.toString() }); }
}

// ══════════════════════════════════════════════════════
// EXAM RECORDS
// ══════════════════════════════════════════════════════
function getExamConfig(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('System_Config');
    var defaults = { terms:['First Term Exam','Mid-Year Exam','Final Exam'], academicYear:new Date().getFullYear()+'-'+(new Date().getFullYear()+1), distinctionMark:80, passMark:40, gradeA:80, gradeB:65, gradeC:50, gradeD:40, subjectsByGrade:{} };
    if (!sheet) { _seedExamDefaults(ss); return respond({ success:true, config:defaults }); }
    var rows = sheetToObjects(sheet);
    var termRows = rows.filter(r => r.Setting_Category==='Exam_Terms');
    if (termRows.length===0) { _seedExamDefaults(ss); rows=sheetToObjects(sheet); termRows=rows.filter(r => r.Setting_Category==='Exam_Terms'); }
    var termsByGrade = {};
    termRows.forEach(r => { var key=r.Setting_Name; var vals=[r.Value_1,r.Value_2,r.Value_3,r.Value_4,r.Value_5].filter(Boolean); if (key&&vals.length>0) termsByGrade[key]=vals; });
    var defaultTerms = termsByGrade['Default'] || defaults.terms;
    var yrRow = rows.find(r => r.Setting_Category==='Exam_Config'&&r.Setting_Name==='Academic_Year');
    var academicYear = yrRow ? yrRow.Value_1 : defaults.academicYear;
    var cfg = {};
    ['Distinction_Mark','Pass_Mark','Grade_A','Grade_B','Grade_C','Grade_D'].forEach(k => { var row=rows.find(r => r.Setting_Category==='Exam_Config'&&r.Setting_Name===k); cfg[k]=row?Number(row.Value_1):0; });
    var subjectsByGrade = {};
    rows.filter(r => r.Setting_Category==='Exam_Subjects').forEach(r => { var subs=[r.Value_1,r.Value_2,r.Value_3,r.Value_4,r.Value_5,r.Value_6,r.Value_7,r.Value_8,r.Value_9,r.Value_10].filter(Boolean); if (r.Setting_Name&&subs.length>0) subjectsByGrade[r.Setting_Name]=subs; });
    return respond({ success:true, config:{ terms:defaultTerms, termsByGrade, academicYear, distinctionMark:cfg.Distinction_Mark||80, passMark:cfg.Pass_Mark||40, gradeA:cfg.Grade_A||80, gradeB:cfg.Grade_B||65, gradeC:cfg.Grade_C||50, gradeD:cfg.Grade_D||40, subjectsByGrade }});
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function _seedExamDefaults(ss) {
  var sheet = ss.getSheetByName('System_Config'); if (!sheet) return;
  var yr = new Date().getFullYear();
  [['Exam_Terms','Default','First Term Exam','Mid-Year Exam','Final Exam'],['Exam_Config','Academic_Year',yr+'-'+(yr+1)],['Exam_Config','Distinction_Mark','80'],['Exam_Config','Pass_Mark','40'],['Exam_Config','Grade_A','80'],['Exam_Config','Grade_B','65'],['Exam_Config','Grade_C','50'],['Exam_Config','Grade_D','40']].forEach(r => sheet.appendRow(r));
}

function _calcLetterGrade(pct, cfg) {
  if (pct>=(cfg.gradeA||80)) return 'A'; if (pct>=(cfg.gradeB||65)) return 'B'; if (pct>=(cfg.gradeC||50)) return 'C'; if (pct>=(cfg.gradeD||40)) return 'D'; return 'F';
}

function _recalcRanks(ss, academicYear, term, grade) {
  var sheet = ss.getSheetByName('Exam_Records'); if (!sheet) return;
  var allRows = sheet.getDataRange().getValues(), headers = allRows[0];
  var idxAY=headers.indexOf('Academic_Year'), idxTerm=headers.indexOf('Term'), idxGr=headers.indexOf('Grade');
  var idxSID=headers.indexOf('Student_ID'), idxName=headers.indexOf('Name'), idxSec=headers.indexOf('Section');
  var idxScore=headers.indexOf('Score'), idxMax=headers.indexOf('Max_Score'), idxRes=headers.indexOf('Result'), idxRank=headers.indexOf('Class_Rank');
  if (idxRank < 0) return;
  var groupIdx = [];
  for (var i=1; i<allRows.length; i++) { var r=allRows[i]; if (r[idxAY]===academicYear&&r[idxTerm]===term&&String(r[idxGr])===String(grade)) groupIdx.push(i); }
  var students = {};
  groupIdx.forEach(ri => { var r=allRows[ri], sid=r[idxSID]||r[idxName]; var score=Number(r[idxScore])||0, max=Number(r[idxMax])||100, res=(r[idxRes]||'').toString(); if (!students[sid]) students[sid]={sid,totalScore:0,totalMax:0,failCount:0}; students[sid].totalScore+=score; students[sid].totalMax+=max; if (res==='Fail') students[sid].failCount++; });
  var sorted = Object.values(students).sort((a,b) => { var ga=Math.min(a.failCount,3), gb=Math.min(b.failCount,3); if (ga!==gb) return ga-gb; return b.totalScore-a.totalScore; });
  var rankMap={}, rank=1;
  for (var j=0; j<sorted.length; j++) { if (j>0&&sorted[j].totalScore===sorted[j-1].totalScore&&sorted[j].failCount===sorted[j-1].failCount) rankMap[sorted[j].sid]=rankMap[sorted[j-1].sid]; else rankMap[sorted[j].sid]=rank; rank++; }
  groupIdx.forEach(ri => { var sid=allRows[ri][idxSID]||allRows[ri][idxName]; if (rankMap[sid]!==undefined) sheet.getRange(ri+1,idxRank+1).setValue(rankMap[sid]); });
}

function recordExamBulk(data) {
  var permErr = _requirePerm(data, 'Can_Record_Exam');
  if (permErr) return permErr;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Exam_Records');
    if (!sheet) { sheet = ss.insertSheet('Exam_Records'); sheet.appendRow(['Academic_Year','Term','Grade','Section','Student_ID','Name','Subject','Score','Max_Score','Percentage','Letter_Grade','Result','Class_Rank','Recorded_By','Remark','Date_Recorded']); }
    var cfg = data.config||{passMark:40,gradeA:80,gradeB:65,gradeC:50,gradeD:40};
    var now = getTodayGAS();
    var existingData = sheet.getDataRange().getValues(), headers = existingData[0];
    var idxAY=headers.indexOf('Academic_Year'), idxTerm=headers.indexOf('Term'), idxGr=headers.indexOf('Grade'), idxSec=headers.indexOf('Section');
    var toDelete = [];
    for (var i=existingData.length-1; i>=1; i--) { var r=existingData[i]; if (r[idxAY]===data.Academic_Year&&r[idxTerm]===data.Term&&String(r[idxGr])===String(data.Grade)&&r[idxSec]===(data.Section||'')) toDelete.push(i+1); }
    toDelete.forEach(ri => sheet.deleteRow(ri));
    (data.entries||[]).forEach(ent => {
      var subjects = ent.subjects||{};
      Object.keys(subjects).forEach(subj => {
        var scoreVal = subjects[subj]; if (scoreVal===''||scoreVal===null||scoreVal===undefined) return;
        var score=Number(scoreVal)||0, max=Number(ent.maxScores&&ent.maxScores[subj]?ent.maxScores[subj]:100);
        var pct=max>0?Math.round((score/max)*100):0, lg=_calcLetterGrade(pct,cfg), result=pct>=(cfg.passMark||40)?'Pass':'Fail';
        sheet.appendRow([data.Academic_Year||'',data.Term||'',data.Grade||'',data.Section||'',ent.Student_ID||'',ent.Name||'',subj,score,max,pct,lg,result,'',data.Recorded_By||'',ent.Remark||'',now]);
      });
    });
    _recalcRanks(ss, data.Academic_Year, data.Term, data.Grade);
    return respond({ success:true, message:(data.entries||[]).length+' ဦး၏ exam record သိမ်းပြီး + Rank update ပြီး' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function getExamResults(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Exam_Records');
    if (!sheet) return respond({ success:true, data:[], rankList:[] });
    var rows = sheetToObjects(sheet);
    if (data.Academic_Year) rows=rows.filter(r => r.Academic_Year===data.Academic_Year);
    if (data.Term)          rows=rows.filter(r => r.Term===data.Term);
    if (data.Grade)         rows=rows.filter(r => String(r.Grade)===String(data.Grade));
    if (data.Section)       rows=rows.filter(r => r.Section===data.Section);
    if (data.Student_ID)    rows=rows.filter(r => r.Student_ID===data.Student_ID);
    var allGrade = sheetToObjects(sheet);
    if (data.Academic_Year) allGrade=allGrade.filter(r => r.Academic_Year===data.Academic_Year);
    if (data.Term)          allGrade=allGrade.filter(r => r.Term===data.Term);
    if (data.Grade)         allGrade=allGrade.filter(r => String(r.Grade)===String(data.Grade));
    var stuMap = {};
    allGrade.forEach(r => { var sid=r.Student_ID||r.Name; if (!stuMap[sid]) stuMap[sid]={Student_ID:r.Student_ID,Name:r.Name,Section:r.Section||'',subjects:{},totalScore:0,totalMax:0,failCount:0,rank:r.Class_Rank||''}; stuMap[sid].subjects[r.Subject]={score:r.Score,max:r.Max_Score,pct:r.Percentage,grade:r.Letter_Grade,result:r.Result}; stuMap[sid].totalScore+=Number(r.Score)||0; stuMap[sid].totalMax+=Number(r.Max_Score)||0; if (r.Result==='Fail') stuMap[sid].failCount++; if (r.Class_Rank) stuMap[sid].rank=r.Class_Rank; });
    var rankList = Object.values(stuMap).sort((a,b) => Number(a.rank||999)-Number(b.rank||999));
    return respond({ success:true, data:rows, rankList });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function updateExamRecord(data) {
  var permErr = _requirePerm(data, 'Can_Record_Exam');
  if (permErr) return permErr;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Exam_Records');
    if (!sheet) return respond({ success:false, message:'Exam_Records မတွေ့ပါ' });
    var allRows=sheet.getDataRange().getValues(), headers=allRows[0];
    var idxAY=headers.indexOf('Academic_Year'), idxTerm=headers.indexOf('Term'), idxGr=headers.indexOf('Grade'), idxSec=headers.indexOf('Section'), idxSID=headers.indexOf('Student_ID'), idxSubj=headers.indexOf('Subject');
    var rowNum=-1;
    for (var i=1; i<allRows.length; i++) { var r=allRows[i]; if (r[idxAY]===data.Academic_Year&&r[idxTerm]===data.Term&&String(r[idxGr])===String(data.Grade)&&r[idxSec]===(data.Section||'')&&r[idxSID]===data.Student_ID&&r[idxSubj]===data.Subject) { rowNum=i+1; break; } }
    if (rowNum<0) return respond({ success:false, message:'Record မတွေ့ပါ' });
    var cfg=data.config||{passMark:40,gradeA:80,gradeB:65,gradeC:50,gradeD:40};
    var score=Number(data.Score)||0, max=Number(data.Max_Score)||100, pct=max>0?Math.round((score/max)*100):0, lg=_calcLetterGrade(pct,cfg), res=pct>=(cfg.passMark||40)?'Pass':'Fail';
    var updates={Score:score,Max_Score:max,Percentage:pct,Letter_Grade:lg,Result:res};
    if (data.Remark!==undefined) updates.Remark=data.Remark;
    Object.keys(updates).forEach(k => { var idx=headers.indexOf(k); if(idx>=0) sheet.getRange(rowNum,idx+1).setValue(updates[k]); });
    _recalcRanks(ss, data.Academic_Year, data.Term, data.Grade);
    return respond({ success:true, message:'Record updated + Rank recalculated' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

// ══════════════════════════════════════════════════════
// LEAVE & ATTENDANCE
// ══════════════════════════════════════════════════════
function updateLeave(data) {
  var permErr = _requirePerm(data, 'Can_Record_Attendance_&_Leave');
  if (permErr) return permErr;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Leave_Records');
    if (!sheet) return respond({ success:false, message:'Leave_Records sheet မရှိပါ' });
    var rows = sheet.getDataRange().getValues(), headers = rows[0];
    var userIdCol=headers.indexOf('User_ID'), nameCol=headers.indexOf('Name'), startCol=headers.indexOf('Start_Date'), statusCol=headers.indexOf('Status'), approvedCol=headers.indexOf('Approved_By');
    if (statusCol < 0) return respond({ success:false, message:'Status column မတွေ့ပါ' });
    function normDate(v) { if (!v) return ''; if (v instanceof Date) return v.toLocaleDateString('en-CA'); return v.toString().trim().split('T')[0]; }
    var targetUser=( data.userId||'').toString().trim(), targetName=(data.name||'').toString().trim(), targetStart=normDate(data.startDate);
    if (data.rowIndex && Number(data.rowIndex) > 1) {
      var ri = Number(data.rowIndex);
      if (ri <= rows.length) {
        sheet.getRange(ri, statusCol+1).setValue(data.status);
        if (approvedCol>=0 && data.approvedBy) sheet.getRange(ri, approvedCol+1).setValue(data.approvedBy);
        var remarkCol=headers.indexOf('Remark');
        if (remarkCol>=0 && data.remark && data.remark !== '-') sheet.getRange(ri, remarkCol+1).setValue(data.remark);
        var updRow = sheet.getRange(ri,1,1,headers.length).getValues()[0], updObj = {};
        headers.forEach((h,idx) => { updObj[h]=updRow[idx]; });
        return respond({ success:true, message:'Leave status updated', updatedRecord:updObj });
      }
    }
    for (var i=1; i<rows.length; i++) {
      var rowUser=userIdCol>=0?rows[i][userIdCol].toString().trim():'', rowName=nameCol>=0?rows[i][nameCol].toString().trim():'', rowStart=startCol>=0?normDate(rows[i][startCol]):'';
      if ((!targetUser||rowUser===targetUser) && (!targetName||rowName===targetName) && (!targetStart||rowStart===targetStart) && rows[i][statusCol]==='Pending') {
        sheet.getRange(i+1,statusCol+1).setValue(data.status);
        if (approvedCol>=0&&data.approvedBy) sheet.getRange(i+1,approvedCol+1).setValue(data.approvedBy);
        var remarkCol2=headers.indexOf('Remark');
        if (remarkCol2>=0 && data.remark && data.remark !== '-') sheet.getRange(i+1, remarkCol2+1).setValue(data.remark);
        var updRow2=sheet.getRange(i+1,1,1,headers.length).getValues()[0], updObj2={};
        headers.forEach((h,idx) => { updObj2[h]=updRow2[idx]; });
        return respond({ success:true, message:'Leave status updated', rowIndex:i+1, updatedRecord:updObj2 });
      }
    }
    return respond({ success:false, message:'Leave record မတွေ့ပါ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function getAttendance(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetDate = (data && data.date) ? data.date : getTodayGAS();
    var stuSheet = ss.getSheetByName('Student_Directory'), staffSheet = ss.getSheetByName('Staff_Login');
    var totalStudents = 0, totalStaff = 0, stuMap = {};
    if (stuSheet) {
      var stuRows = sheetToObjects(stuSheet);
      totalStudents = stuRows.filter(r => {
        var stat = String(r.Status||'').toUpperCase(), isActive = (r.Status===true||stat==='TRUE'||stat==='ACTIVE');
        if (isActive) { var sid=String(r.Student_ID||r['Enrollment No.']||'').trim(); var sn=String(r['Name (ALL CAPITAL)']||r.Name||'').trim(); var g=String(r.Grade||'').trim(); var sec=String(r.Section||r.Class||'').trim(); var classKey=g?(g+(sec?' - '+sec:'')):(sec?sec:'Unknown'); if (sid) stuMap[sid]={grade:g,section:sec,classKey}; if (sn) stuMap[sn]={grade:g,section:sec,classKey}; }
        return isActive;
      }).length;
    }
    if (staffSheet) { totalStaff = sheetToObjects(staffSheet).filter(r => { var s=String(r.Status||'').toUpperCase(); return r.Status===true||s==='TRUE'||s==='ACTIVE'; }).length; }
    var lvSheet = ss.getSheetByName('Leave_Records'), leaveMap = { student:{}, staff:{} };
    if (lvSheet) {
      sheetToObjects(lvSheet).forEach(r => {
        var start=_formatDateVal(r.Start_Date||''), end=_formatDateVal(r.End_Date||start);
        if (!start||targetDate<start||targetDate>end) return;
        var status=r.Status||'Pending'; if (status!=='Approved'&&status!=='AWOL'&&status!=='Pending') return;
        var utype=String(r.User_Type||r.Role||'').toUpperCase(), rawGrade=String(r.Grade||'').trim(), rawSec=String(r.Section||r.Class||'').trim();
        var isStudent=(utype==='STUDENT'||utype==='ကျောင်းသား'||rawGrade!==''), group=isStudent?'student':'staff';
        var userId=String(r.User_ID||r.Name||'').trim(), uName=String(r.Name||'').trim();
        if (!userId) return;
        var stInfo=stuMap[userId]||stuMap[uName]||{}, finalGrade=rawGrade||stInfo.grade||'', finalSec=rawSec||stInfo.section||'';
        var classKey=finalGrade?(finalGrade+(finalSec?' - '+finalSec:'')):(finalSec?finalSec:'Unknown');
        if (!leaveMap[group][userId]||leaveMap[group][userId].status==='Pending') {
          leaveMap[group][userId]={ id:userId, name:uName, grade:finalGrade, section:finalSec, classKey, leave_type:String(r.Leave_Type||''), start_date:_formatDateVal(r.Start_Date||''), end_date:_formatDateVal(r.End_Date||r.Start_Date||''), total_days:String(r.Total_Days||''), reason:String(r.Reason||''), remark:String(r.Remark||''), status };
        }
      });
    }
    var absentStudents=[], pendingStudents=[], absentStaff=[], pendingStaff=[];
    Object.keys(leaveMap.student).forEach(k => { if (leaveMap.student[k].status==='Approved') absentStudents.push(leaveMap.student[k]); else pendingStudents.push(leaveMap.student[k]); });
    Object.keys(leaveMap.staff).forEach(k => { if (leaveMap.staff[k].status==='Approved') absentStaff.push(leaveMap.staff[k]); else pendingStaff.push(leaveMap.staff[k]); });
    var stuAbsent=absentStudents.length, stuPending=pendingStudents.length, stuPresent=Math.max(0,totalStudents-stuAbsent-stuPending), stuPct=totalStudents>0?Math.round((stuPresent/totalStudents)*100):100;
    var stfAbsent=absentStaff.length, stfPending=pendingStaff.length, stfPresent=Math.max(0,totalStaff-stfAbsent-stfPending), stfPct=totalStaff>0?Math.round((stfPresent/totalStaff)*100):100;
    var gradeMap = {};
    absentStudents.concat(pendingStudents).forEach(e => { var key=e.classKey||'Unknown'; if (!gradeMap[key]) gradeMap[key]={grade:key,absent:0,pending:0}; if (e.status==='Approved') gradeMap[key].absent++; else gradeMap[key].pending++; });
    var classes = Object.keys(gradeMap).map(k => { var g=gradeMap[k]; g.color=g.absent>0?'red':g.pending>0?'yellow':'green'; return g; }).sort((a,b) => String(a.grade).localeCompare(String(b.grade)));
    return respond({ success:true, date:targetDate,
      school:{ total:totalStudents, present:stuPresent, absent:stuAbsent, pending:stuPending, pct:stuPct, color:stuAbsent>0?'red':stuPending>0?'yellow':'green' },
      staff:{ total:totalStaff, present:stfPresent, absent:stfAbsent, pending:stfPending, pct:stfPct, color:stfAbsent>0?'red':stfPending>0?'yellow':'green' },
      absentStudents:absentStudents.slice(0,20), absentStaff:absentStaff.slice(0,20), pendingStudents:pendingStudents.slice(0,10), classes });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function getAttendanceTrend(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var stuSheet = ss.getSheetByName('Student_Directory');
    var totalStudents = 0;
    if (stuSheet) totalStudents = sheetToObjects(stuSheet).filter(r => { var s=String(r.Status||'').toUpperCase(); return r.Status===true||s==='TRUE'||s==='ACTIVE'; }).length;
    var lvSheet = ss.getSheetByName('Leave_Records');
    var leaves = lvSheet ? sheetToObjects(lvSheet).filter(l => l.Status==='Approved'||l.Status==='AWOL') : [];
    var trend = [], now = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(now.getTime()-i*86400000);
      var dStr = Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), shortStr = Utilities.formatDate(d, TZ, 'MMM dd');
      var absentCount = 0;
      leaves.forEach(l => { var utype=String(l.User_Type||l.Role||'').toUpperCase(), grade=String(l.Grade||'').trim(); if (utype==='STUDENT'||utype==='ကျောင်းသား'||grade!=='') { var start=_formatDateVal(l.Start_Date||''), end=_formatDateVal(l.End_Date||start); if (dStr>=start&&dStr<=end) absentCount++; } });
      var present = Math.max(0, totalStudents-absentCount), pct = totalStudents>0?Math.round((present/totalStudents)*100):100;
      trend.push({ date:dStr, label:shortStr, present, absent:absentCount, pct });
    }
    return respond({ success:true, trend, totalStudents });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function getStaffLeaveConfig(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('System_Config');
    if (!sheet) return respond({ success:false, message:'System_Config မတွေ့ပါ' });
    var rows = sheetToObjects(sheet);
    var leaveRows = rows.filter(r => r.Setting_Category==='Staff_Leave_Default');
    if (leaveRows.length===0) {
      [['Staff_Leave_Default','Casual Leave','10'],['Staff_Leave_Default','Medical Leave','14'],['Staff_Leave_Default','Emergency Leave','3'],['Staff_Leave_Default','Personal Leave','5']].forEach(r => sheet.appendRow(r));
      leaveRows=[{Setting_Category:'Staff_Leave_Default',Setting_Name:'Casual Leave',Value_1:'10'},{Setting_Category:'Staff_Leave_Default',Setting_Name:'Medical Leave',Value_1:'14'},{Setting_Category:'Staff_Leave_Default',Setting_Name:'Emergency Leave',Value_1:'3'},{Setting_Category:'Staff_Leave_Default',Setting_Name:'Personal Leave',Value_1:'5'}];
    }
    return respond({ success:true, leaveTypes:leaveRows.map(r => ({type:r.Setting_Name.toString().trim(),days:Number(r.Value_1)||0})).filter(r => r.type) });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function getStaffLeaveBalance(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var cfgSheet = ss.getSheetByName('System_Config'), leaveTypes = [];
    if (cfgSheet) sheetToObjects(cfgSheet).filter(r => r.Setting_Category==='Staff_Leave_Default'&&r.Setting_Name).forEach(r => leaveTypes.push({type:r.Setting_Name.toString().trim(),allocated:Number(r.Value_1)||0,used:0}));
    var leaveSheet=ss.getSheetByName('Leave_Records'), myLeaves=[];
    if (leaveSheet) {
      var leaveRows=sheetToObjects(leaveSheet);
      myLeaves=leaveRows.filter(r => { var uid=(r.User_ID||'').toString().trim(), nm=(r.Name||'').toString().trim(); return (data.Staff_ID&&uid===data.Staff_ID.toString())||(data.Name&&nm===data.Name.toString()); });
      myLeaves.filter(r => r.Status==='Approved'||r.Status==='AWOL').forEach(r => { var lt=(r.Leave_Type||'').toString().trim(), days=Number(r.Total_Days)||0; var found=leaveTypes.find(t => t.type===lt); if (found) found.used+=days; });
    }
    leaveTypes.forEach(t => { t.balance=t.allocated-t.used; });
    return respond({ success:true, leaveTypes, history:myLeaves.reverse() });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function submitStaffLeave(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Leave_Records');
    if (!sheet) return respond({ success:false, message:'Leave_Records sheet မတွေ့ပါ' });
    var headers=sheet.getDataRange().getValues()[0];
    var obj={ Date_Applied:getTodayGAS(), User_Type:'STAFF', User_ID:data.Staff_ID||'', Name:data.Name||'', Leave_Type:data.Leave_Type||'', Start_Date:data.Start_Date||'', End_Date:data.End_Date||'', Total_Days:data.Total_Days||1, Reason:data.Reason||'', Reporter_Name:'-', Relationship:'-', Phone:'-', Method:'-', Approved_By:'-', Status:'Pending' };
    sheet.appendRow(headers.length>0 ? headers.map(h => obj[h]!==undefined?obj[h]:'') : Object.values(obj));
    return respond({ success:true, message:'Leave request တင်ပြီးပါပြီ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

// ══════════════════════════════════════════════════════
// STAFF PERMISSIONS
// ══════════════════════════════════════════════════════
function getPermCols() {
  return ['Can_View_Student','Can_View_Staff','Can_Manage_Fees','Can_Manage_Hostel','Can_Manage_Inventory','Can_Record_Note','Can_Record_Exam','Can_Record_Points','Can_Record_Attendance_&_Leave','Can_Post_Announcement','Can_Manage_Events'];
}
function getOrCreatePermSheet(ss) {
  var PERM_COLS = getPermCols();
  var sheet = ss.getSheetByName('Staff_Permissions');
  if (sheet) return sheet;
  sheet = ss.insertSheet('Staff_Permissions');
  var headers = ['Staff_ID','Name','Status'].concat(PERM_COLS);
  sheet.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
  try {
    var loginSheet = ss.getSheetByName('Staff_Login');
    if (loginSheet) {
      var rows = sheetToObjects(loginSheet).map(r => { var id=r.Staff_ID||r.Username||'', name=r['Name (ALL CAPITAL)']||r.Name||'', stat=(r.Status||'TRUE').toString().toUpperCase()==='FALSE'?'FALSE':'TRUE'; return [id,name,stat].concat(PERM_COLS.map(() => 'FALSE')); }).filter(r => r[0]||r[1]);
      if (rows.length) sheet.getRange(2,1,rows.length,headers.length).setValues(rows);
    }
  } catch(e) {}
  return sheet;
}
function getStaffPermissions(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    return respond({ success:true, data:sheetToObjects(getOrCreatePermSheet(ss)) });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

// Return single permission row for current user (more reliable than client-side matching)
function getMyStaffPermissions(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var rows = sheetToObjects(getOrCreatePermSheet(ss));

    var staffId = (data.staffId || data.Staff_ID || data.username || data.Username || '').toString().trim();
    var name    = (data.name || data.Name || '').toString().trim();

    function _norm(s){ return String(s||'').trim().toUpperCase().replace(/\s+/g,''); }
    var row = null;

    var staffKey = _norm(staffId);
    var nameKey  = _norm(name);

    if (staffKey) {
      row = rows.find(function(r){
        return (_norm(r.Staff_ID) === staffKey) || (_norm(r.Username) === staffKey);
      });
    }

    // Map via Staff_Login if needed
    if (!row && staffKey) {
      try {
        var loginSheet = ss.getSheetByName('Staff_Login');
        if (loginSheet) {
          var loginRows = sheetToObjects(loginSheet);
          var loginRow = loginRows.find(function(l){
            return _norm(l.Username) === staffKey || _norm(l.Staff_ID) === staffKey;
          });
          if (loginRow) {
            var mappedId = _norm(loginRow.Staff_ID || loginRow.Username);
            if (mappedId) {
              row = rows.find(function(r){ return _norm(r.Staff_ID) === mappedId; });
            }
          }
        }
      } catch(e2) {}
    }

    // Name match (case/space-insensitive)
    if (!row && nameKey) {
      row = rows.find(function(r){ return _norm(r.Name) === nameKey; });
    }

    if (!row) return respond({ success:false, message:'Staff permission row မတွေ့ပါ' });
    return respond({ success:true, data: row });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}
function updateStaffPermissions(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=getOrCreatePermSheet(ss), rows=sheet.getDataRange().getValues(), headers=rows[0];
    var idCol=-1, nameCol=-1;
    ['Staff_ID','Username'].forEach(n => { if(idCol<0&&headers.indexOf(n)>=0) idCol=headers.indexOf(n); });
    ['Name','Name (ALL CAPITAL)'].forEach(n => { if(nameCol<0&&headers.indexOf(n)>=0) nameCol=headers.indexOf(n); });
    for (var i=1; i<rows.length; i++) {
      var matchId=idCol>=0&&data.Staff_ID&&rows[i][idCol]&&rows[i][idCol].toString()===data.Staff_ID.toString();
      var matchName=nameCol>=0&&data.Name&&rows[i][nameCol]&&rows[i][nameCol].toString()===data.Name.toString();
      if (matchId||matchName) {
        var perms=data.permissions||{};
        Object.keys(perms).forEach(col => { var ci=headers.indexOf(col); if(ci>=0) sheet.getRange(i+1,ci+1).setValue(perms[col]===true||perms[col]==='true'||perms[col]==='TRUE'?'TRUE':'FALSE'); });
        if (data.Status!==undefined) {
          var si=headers.indexOf('Status'); if (si>=0) sheet.getRange(i+1,si+1).setValue(data.Status);
          try { var ls=ss.getSheetByName('Staff_Login'); if(ls){var lr=ls.getDataRange().getValues(),lh=lr[0];var lIdCol=-1,lStatCol=-1;['Staff_ID','Username'].forEach(n=>{if(lIdCol<0&&lh.indexOf(n)>=0)lIdCol=lh.indexOf(n);});lStatCol=lh.indexOf('Status');for(var j=1;j<lr.length;j++){if(lIdCol>=0&&lr[j][lIdCol]&&lr[j][lIdCol].toString()===data.Staff_ID.toString()){if(lStatCol>=0)ls.getRange(j+1,lStatCol+1).setValue(data.Status);break;}}} } catch(e2) {}
        }
        return respond({ success:true, message:'Permission update ပြီးပါပြီ' });
      }
    }
    var PERM_COLS=getPermCols(), newRow=['','',data.Status||'TRUE'].concat(PERM_COLS.map(k => { var v=data.permissions&&data.permissions[k]; return v===true||v==='true'||v==='TRUE'?'TRUE':'FALSE'; }));
    if (idCol>=0) newRow[idCol]=data.Staff_ID||''; if (nameCol>=0) newRow[nameCol]=data.Name||'';
    sheet.appendRow(newRow); return respond({ success:true, message:'New entry added' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

// ══════════════════════════════════════════════════════
// PHOTO UPLOAD — Cloudinary via UrlFetchApp (FIXED)
// ══════════════════════════════════════════════════════
var CLOUDINARY_CLOUD  = 'dg9m3ktno';
var CLOUDINARY_PRESETS = { students:'shining-stars-students', staff:'shining-stars-staff', default:'shining-stars-students' };

function uploadPhoto(data) {
  try {
    if (!data.base64 || !data.filename) return respond({ success:false, message:'base64 နှင့် filename လိုအပ်သည်' });

    var folder  = data.folder || 'students';
    var preset  = CLOUDINARY_PRESETS[folder] || CLOUDINARY_PRESETS.default;
    var publicId = data.filename.replace(/\.[^/.]+$/, '').trim();

    try {
      // base64 ကို Cloudinary သို့ တိုက်ရိုက် upload လုပ်သည်
      // base64 string မှာ "data:image/jpeg;base64,..." format ဖြစ်ရမည်
      var base64Data = data.base64;
      if (!base64Data.startsWith('data:')) {
        base64Data = 'data:image/jpeg;base64,' + base64Data;
      }

      var url = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CLOUD + '/image/upload';
      var payload = { 'file': base64Data, 'upload_preset': preset, 'public_id': publicId };

      var options = { method: 'post', contentType: 'application/x-www-form-urlencoded', payload: payload, muteHttpExceptions: true };
      var response = UrlFetchApp.fetch(url, options);
      var result = JSON.parse(response.getContentText());

      if (result.secure_url) {
        return respond({ success:true, photoUrl:result.secure_url, source:'cloudinary', message:'Cloudinary upload ပြီးပါပြီ' });
      } else {
        // Cloudinary fail → base64 fallback (sheet ထဲ သိမ်း)
        Logger.log('Cloudinary error: ' + JSON.stringify(result));
        return respond({ success:true, photoUrl:data.base64, source:'base64_fallback', message:'Cloudinary မအောင်မြင်ပါ — base64 fallback သိမ်းသည်' });
      }
    } catch(cloudErr) {
      Logger.log('Cloudinary exception: ' + cloudErr.toString());
      return respond({ success:true, photoUrl:data.base64, source:'base64_fallback', message:'Cloudinary error — base64 fallback: ' + cloudErr.message });
    }
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function updatePhotoUrl(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheetName=data.sheetName||'Student_Directory', idField=data.idField||'Enrollment No.', userId=(data.id||'').toString().trim(), photoUrl=data.photoUrl||'';
    if (!userId||!photoUrl) return respond({ success:false, message:'ID and photoUrl required' });
    var sheet=ss.getSheetByName(sheetName); if (!sheet) return respond({ success:false, message:sheetName+' sheet မတွေ့ပါ' });
    var rows=sheet.getDataRange().getValues(), headers=rows[0], idCol=-1, photoCol=-1;
    for (var j=0;j<headers.length;j++) { var h=headers[j].toString().trim(); if (h===idField) idCol=j; if (h==='Photo_URL'||h==='Photo URL'||h==='photo_url') photoCol=j; }
    if (idCol<0) return respond({ success:false, message:idField+' column မတွေ့ပါ' });
    if (photoCol<0) { photoCol=headers.length; sheet.getRange(1,photoCol+1).setValue('Photo_URL'); }
    for (var i=1;i<rows.length;i++) { var rowId=rows[i][idCol]?rows[i][idCol].toString().trim():''; if (rowId===userId) { sheet.getRange(i+1,photoCol+1).setValue(photoUrl); return respond({ success:true, message:'Photo URL သိမ်းပြီးပါပြီ', row:i+1 }); } }
    return respond({ success:false, message:'ID "'+userId+'" မတွေ့ပါ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

// ══════════════════════════════════════════════════════
// INVENTORY
// ══════════════════════════════════════════════════════
function getInventoryConfig(data) {
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    let sheet=ss.getSheetByName('Inventory_Config');
    if (!sheet) {
      sheet=ss.insertSheet('Inventory_Config'); sheet.appendRow(['Type','Value','Created_At']); sheet.getRange(1,1,1,3).setFontWeight('bold');
      ['Stationery','Cleaning','Furniture','Tool','Electronics','Sports','Books','Other'].forEach(c => sheet.appendRow(['Category',c,Utilities.formatDate(new Date(), 'Asia/Yangon', 'yyyy-MM-dd HH:mm:ss')]));
      ['Store Room','Office','Classroom','Lab','Gym','Library','Canteen'].forEach(l => sheet.appendRow(['Location',l,Utilities.formatDate(new Date(), 'Asia/Yangon', 'yyyy-MM-dd HH:mm:ss')]));
    }
    const rows=sheetToObjects(sheet);
    return respond({ success:true, categories:rows.filter(r=>r.Type==='Category').map(r=>r.Value), locations:rows.filter(r=>r.Type==='Location').map(r=>r.Value) });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function saveInventoryConfig(data) {
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    let sheet=ss.getSheetByName('Inventory_Config');
    if (!sheet) { sheet=ss.insertSheet('Inventory_Config'); sheet.appendRow(['Type','Value','Created_At']); sheet.getRange(1,1,1,3).setFontWeight('bold'); }
    const now=Utilities.formatDate(new Date(), 'Asia/Yangon', 'yyyy-MM-dd HH:mm:ss');
    if (data.categories) { const rows=sheet.getDataRange().getValues(); for (let i=rows.length-1;i>=1;i--) { if (rows[i][0]==='Category') sheet.deleteRow(i+1); } data.categories.forEach(c => sheet.appendRow(['Category',c,now])); }
    if (data.locations) { const rows=sheet.getDataRange().getValues(); for (let i=rows.length-1;i>=1;i--) { if (rows[i][0]==='Location') sheet.deleteRow(i+1); } data.locations.forEach(l => sheet.appendRow(['Location',l,now])); }
    return respond({ success:true, message:'Config သိမ်းဆည်းပြီးပါပြီ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

var INV_HEADERS = ['Item_ID','Item_Name','Category','Unit','Stock_Qty','Min_Stock','Unit_Price','Condition','Item_Type','Serial_No','Purchase_Date','Warranty_Until','Location','Assigned_To','Useful_Life_Years','Last_Updated','Updated_By','Note','Photo_URL'];

function _normalizeInvType(val) {
  var s = (val === null || val === undefined) ? '' : String(val).trim();
  var low = s.toLowerCase();
  if (!low) return 'Expense';
  if (low === 'expense' || low === 'exp' || low.indexOf('expense') >= 0) return 'Expense';
  if (low === 'capital' || low === 'cap' || low === 'captial' || low.indexOf('capital') >= 0 || low.indexOf('captial') >= 0) return 'Capital';
  if (low === 'tool' || low === 'tools' || low.indexOf('tool') >= 0) return 'Tool';
  return 'Expense';
}

function _getOrCreateInvSheet(ss) {
  var sheet = ss.getSheetByName('Inventory');
  if (!sheet) {
    sheet = ss.insertSheet('Inventory');
    sheet.getRange(1,1,1,INV_HEADERS.length).setValues([INV_HEADERS]).setFontWeight('bold');
    return sheet;
  }

  // Ensure/normalize headers for existing sheets (backward compat)
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var hdrs = sheet.getRange(1,1,1,lastCol).getValues()[0].map(function(h){return String(h||'').trim();});

  // Rename common header variants to canonical names
  var renameMap = {
    'Item ID': 'Item_ID',
    'ItemID': 'Item_ID',
    'ID': 'Item_ID',
    'Item Name': 'Item_Name',
    'ItemName': 'Item_Name',
    'Item Type': 'Item_Type',
    'Type': 'Item_Type',
    'Serial No': 'Serial_No',
    'Serial No.': 'Serial_No',
    'Purchase Date': 'Purchase_Date',
    'Warranty Until': 'Warranty_Until',
    'Unit Price': 'Unit_Price',
    'Stock Qty': 'Stock_Qty',
    'Min Stock': 'Min_Stock',
    'Last Updated': 'Last_Updated',
    'Updated By': 'Updated_By',
    'Photo URL': 'Photo_URL'
  };

  for (var i=0;i<hdrs.length;i++) {
    var h = hdrs[i];
    if (renameMap[h] && renameMap[h] !== h) {
      sheet.getRange(1, i+1).setValue(renameMap[h]);
      hdrs[i] = renameMap[h];
    }
  }

  // Add missing required columns (append at end)
  hdrs = sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),1)).getValues()[0].map(function(h){return String(h||'').trim();});
  INV_HEADERS.forEach(function(req){
    if (hdrs.indexOf(req) < 0) {
      var c = sheet.getLastColumn() + 1;
      sheet.getRange(1, c).setValue(req).setFontWeight('bold');
      hdrs.push(req);
    }
  });

  return sheet;
}

function getInventory(data) {
  try {
    var items = sheetToObjects(_getOrCreateInvSheet(SpreadsheetApp.getActiveSpreadsheet()));
    // normalize type in output (no write-back)
    items = items.map(function(it){
      it.Item_Type = _normalizeInvType(it.Item_Type);
      return it;
    });
    return respond({ success:true, data:items });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function addInventoryItem(data) {
  var permErr=_requirePerm(data,'Can_Manage_Inventory'); if (permErr) return permErr;
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=_getOrCreateInvSheet(ss);
    const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim());
    const now=getTodayGAS();
    // Robust unique ID (avoids duplicates if sheet has gaps/duplicates)
    var itemId = 'INV' + String(new Date().getTime()).slice(-8);
    var itemType = _normalizeInvType(data.Item_Type);
    const rowData={Item_ID:itemId,Item_Name:data.Item_Name||'',Category:data.Category||'',Unit:data.Unit||'Pcs',Stock_Qty:itemType==='Expense'?(Number(data.Stock_Qty)||0):'',Min_Stock:itemType==='Expense'?(Number(data.Min_Stock)||0):'',Unit_Price:Number(data.Unit_Price)||0,Condition:data.Condition||'Good',Item_Type:itemType,Serial_No:data.Serial_No||'',Purchase_Date:data.Purchase_Date||'',Warranty_Until:data.Warranty_Until||'',Location:data.Location||'',Assigned_To:data.Assigned_To||'',Useful_Life_Years:data.Useful_Life_Years||'',Last_Updated:now,Updated_By:data.Updated_By||'',Note:data.Note||'',Photo_URL:data.Photo_URL||''};
    sheet.appendRow(headers.map(h=>rowData[h]!==undefined?rowData[h]:''));
    return respond({ success:true, message:'Item ထည့်ပြီးပါပြီ', itemId });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function addInventoryItemsBulk(data) {
  var permErr=_requirePerm(data,'Can_Manage_Inventory'); if (permErr) return permErr;
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=_getOrCreateInvSheet(ss);
    const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim());
    const items=data.items||[]; if (!items.length) return respond({ success:false, message:'Items မပါပါ' });
    const now=getTodayGAS(), addedIds=[];
    items.forEach((item,index) => {
      const itemId='INV'+String(sheet.getLastRow()+index+1).padStart(3,'0');
      const rowData={Item_ID:itemId,Item_Name:item.Item_Name||'',Category:item.Category||'',Unit:item.Unit||'Pcs',Stock_Qty:'',Min_Stock:'',Unit_Price:item.Unit_Price||'',Condition:item.Condition||'Good',Item_Type:'Capital',Serial_No:'',Purchase_Date:item.Purchase_Date||'',Warranty_Until:'',Location:item.Location||'',Assigned_To:'',Useful_Life_Years:item.Useful_Life_Years||'',Last_Updated:now,Updated_By:item.Created_By||'',Note:item.Note||'',Photo_URL:item.Photo_URL||''};
      sheet.appendRow(headers.map(h=>rowData[h]!==undefined?rowData[h]:'')); addedIds.push(itemId);
    });
    return respond({ success:true, message:items.length+' items added', itemIds:addedIds });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function updateInventoryItem(data) {
  var permErr=_requirePerm(data,'Can_Manage_Inventory'); if (permErr) return permErr;
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Inventory');
    if (!sheet) return respond({ success:false, message:'Inventory sheet မရှိပါ' });
    const rows=sheet.getDataRange().getValues(), headers=rows[0].map(h=>h.toString().trim()), idCol=headers.indexOf('Item_ID'), now=getTodayGAS();
    for (let i=1;i<rows.length;i++) {
      if ((rows[i][idCol]||'').toString().trim()===data.Item_ID.toString().trim()) {
        const updates=Object.assign({},data,{Last_Updated:now});
        if (updates.Item_Type !== undefined) updates.Item_Type = _normalizeInvType(updates.Item_Type);
        headers.forEach((h,j) => { if(updates[h]!==undefined) sheet.getRange(i+1,j+1).setValue(updates[h]); });
        return respond({ success:true, message:'Update ပြီးပါပြီ' });
      }
    }
    return respond({ success:false, message:'Item မတွေ့ပါ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function logInventoryUsage(data) {
  var permErr=_requirePerm(data,'Can_Manage_Inventory'); if (permErr) return permErr;
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    let logSheet=ss.getSheetByName('Inventory_Log');
    if (!logSheet) { logSheet=ss.insertSheet('Inventory_Log'); logSheet.appendRow(['Date','Item_ID','Item_Name','Qty_Change','Action','Done_By','Note']); logSheet.getRange(1,1,1,7).setFontWeight('bold'); }
    const now=getTodayGAS();
    logSheet.appendRow([now,data.Item_ID,data.Item_Name,data.Qty_Change,data.Action,data.Done_By,data.Note||'']);
    const invSheet=ss.getSheetByName('Inventory');
    if (invSheet) {
      const rows=invSheet.getDataRange().getValues(), headers=rows[0].map(h=>h.toString().trim()), idCol=headers.indexOf('Item_ID'), qtyCol=headers.indexOf('Stock_Qty');
      for (let i=1;i<rows.length;i++) { if ((rows[i][idCol]||'').toString().trim()===data.Item_ID.toString().trim()) { invSheet.getRange(i+1,qtyCol+1).setValue(Math.max(0,Number(rows[i][qtyCol])+Number(data.Qty_Change))); invSheet.getRange(i+1,headers.indexOf('Last_Updated')+1).setValue(now); invSheet.getRange(i+1,headers.indexOf('Updated_By')+1).setValue(data.Done_By||''); break; } }
    }
    return respond({ success:true, message:'Log တင်ပြီးပါပြီ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function transferInventoryItem(data) {
  var permErr=_requirePerm(data,'Can_Manage_Inventory'); if (permErr) return permErr;
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Inventory');
    if (!sheet) return respond({ success:false, message:'Inventory sheet မတွေ့ပါ' });
    var rows=sheet.getDataRange().getValues(), headers=rows[0].map(h=>h.toString().trim()), idCol=headers.indexOf('Item_ID'), locCol=headers.indexOf('Location');
    for (var i=1;i<rows.length;i++) {
      if ((rows[i][idCol]||'').toString().trim()===data.Item_ID.toString().trim()) {
        var oldLoc=rows[i][locCol]; sheet.getRange(i+1,locCol+1).setValue(data.New_Location);
        try { var logSheet=ss.getSheetByName('Inventory_Log'); if(!logSheet){logSheet=ss.insertSheet('Inventory_Log');logSheet.appendRow(['Date','Item_ID','Item_Name','Action','Qty_Change','Done_By','Note']);} var logHeaders=logSheet.getDataRange().getValues()[0].map(h=>h.toString().trim()); var logRow=logHeaders.map(h=>{var m={Date:getTodayGAS(),Item_ID:data.Item_ID,Item_Name:data.Item_Name,Action:'Transfer',Qty_Change:0,Done_By:data.Done_By||'',Note:'From: '+oldLoc+' → To: '+data.New_Location+(data.Note?' | '+data.Note:'')};return m[h]!==undefined?m[h]:'';});logSheet.appendRow(logRow);} catch(e2){}
        return respond({ success:true, message:'Transfer ပြီးပါပြီ' });
      }
    }
    return respond({ success:false, message:'Item_ID မတွေ့ပါ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function getItemHistory(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),logSheet=ss.getSheetByName('Inventory_Log'); if(!logSheet) return respond({success:true,data:[]}); return respond({success:true,data:sheetToObjects(logSheet).filter(r=>(r.Item_ID||'').toString().trim()===data.Item_ID.toString().trim()).reverse()}); } catch(e) { return respond({success:false,message:e.toString()}); } }
function getInventoryLog(data) { try { const ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Inventory_Log'); if(!sheet) return respond({success:true,data:[]}); return respond({success:true,data:sheetToObjects(sheet).reverse()}); } catch(e) { return respond({success:false,message:e.toString()}); } }

function submitPurchaseRequest(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Purchase_Requests');
    if (!sheet) { sheet=ss.insertSheet('Purchase_Requests'); sheet.appendRow(['Request_ID','Date','Item_Name','Category','Qty_Requested','Unit','Reason','Requested_By','Status','Note']); sheet.getRange(1,1,1,10).setFontWeight('bold'); }
    var id='PR-'+new Date().getTime().toString().slice(-6), today=getTodayGAS();
    sheet.appendRow([id,today,data.Item_Name||'',data.Category||'',data.Qty||'',data.Unit||'',data.Reason||'',data.Requested_By||'','Pending','']);
    return respond({ success:true, message:'Request တင်ပြီးပါပြီ ('+id+')', Request_ID:id });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function getPurchaseRequests(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Purchase_Requests'); if(!sheet) return respond({success:true,data:[]}); return respond({success:true,data:sheetToObjects(sheet).sort((a,b)=>(b.Date||'').localeCompare(a.Date||''))}); } catch(e) { return respond({success:false,message:e.toString()}); } }

// ══════════════════════════════════════════════════════
// LOST & FOUND
// ══════════════════════════════════════════════════════
function getLostFound(data) { try { const ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Lost_Found'); if(!sheet) return respond({success:true,data:[]}); return respond({success:true,data:sheetToObjects(sheet).reverse()}); } catch(e) { return respond({success:false,message:e.toString()}); } }

function submitLostFound(data) {
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    let sheet=ss.getSheetByName('Lost_Found');
    if (!sheet) { sheet=ss.insertSheet('Lost_Found'); sheet.appendRow(['LF_ID','Date','Reported_By','Reporter_Type','Item_Name','Description','Found_Location','Photo_URL','Status','Claimed_By','Claim_Date','Note']); sheet.getRange(1,1,1,12).setFontWeight('bold'); }
    const lfId='LF'+String(sheet.getLastRow()).padStart(4,'0');
    sheet.appendRow([lfId,getTodayGAS(),data.Reported_By||'',data.Reporter_Type||'Student',data.Item_Name||'',data.Description||'',data.Found_Location||'',data.Photo_URL||'','Unclaimed','','',data.Note||'']);
    return respond({ success:true, message:'တင်သွင်းပြီးပါပြီ', lfId });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

function updateLostFound(data) {
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Lost_Found');
    if (!sheet) return respond({ success:false, message:'Lost_Found sheet မရှိပါ' });
    const rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim()),idCol=headers.indexOf('LF_ID');
    for (let i=1;i<rows.length;i++) { if ((rows[i][idCol]||'').toString().trim()===data.LF_ID.toString().trim()) { if(data.Status) sheet.getRange(i+1,headers.indexOf('Status')+1).setValue(data.Status); if(data.Claimed_By) sheet.getRange(i+1,headers.indexOf('Claimed_By')+1).setValue(data.Claimed_By); if(data.Status==='Claimed') sheet.getRange(i+1,headers.indexOf('Claim_Date')+1).setValue(getTodayGAS()); if(data.Note) sheet.getRange(i+1,headers.indexOf('Note')+1).setValue(data.Note); return respond({ success:true, message:'Update ပြီးပါပြီ' }); } }
    return respond({ success:false, message:'Record မတွေ့ပါ' });
  } catch(e) { return respond({ success:false, message:e.toString() }); }
}

// ══════════════════════════════════════════════════════
// VEHICLES & VENDORS
// ══════════════════════════════════════════════════════
function getVehicles(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Vehicles'); if(!sheet) return respond({success:true,data:[]}); return respond({success:true,data:sheetToObjects(sheet).reverse()}); } catch(e){return respond({success:false,message:e.toString()});}}

function saveVehicle(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Vehicles');
    if (!sheet) { sheet=ss.insertSheet('Vehicles'); sheet.appendRow(['Reg_ID','Date','User_Type','User_ID','Name','Vehicle_Type','Plate_No','Color','Brand','Status','Registered_By','Note']); sheet.getRange(1,1,1,12).setFontWeight('bold'); }
    var regId=data.Reg_ID||'VHC'+String(sheet.getLastRow()).padStart(4,'0');
    if (data.Reg_ID) {
      var rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim()),idCol=headers.indexOf('Reg_ID');
      for (var i=1;i<rows.length;i++) { if ((rows[i][idCol]||'').toString().trim()===regId) { var upd={User_Type:data.User_Type,User_ID:data.User_ID,Name:data.Name,Vehicle_Type:data.Vehicle_Type,Plate_No:data.Plate_No,Color:data.Color,Brand:data.Brand,Status:data.Status||'Active',Note:data.Note||''}; Object.keys(upd).forEach(k=>{var ci=headers.indexOf(k);if(ci>=0)sheet.getRange(i+1,ci+1).setValue(upd[k]);}); return respond({success:true,message:'Update ပြီးပါပြီ'}); } }
    }
    sheet.appendRow([regId,getTodayGAS(),data.User_Type||'',data.User_ID||'',data.Name||'',data.Vehicle_Type||'',data.Plate_No||'',data.Color||'',data.Brand||'','Active',data.Registered_By||'',data.Note||'']);
    return respond({ success:true, message:'မှတ်ပုံတင်ပြီးပါပြီ', Reg_ID:regId });
  } catch(e){return respond({success:false,message:e.toString()});}
}

function deleteVehicle(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Vehicles'); if(!sheet) return respond({success:false,message:'Sheet မတွေ့ပါ'}); var rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim()),idCol=headers.indexOf('Reg_ID'); for(var i=1;i<rows.length;i++){if((rows[i][idCol]||'').toString().trim()===data.Reg_ID){sheet.deleteRow(i+1);return respond({success:true,message:'ဖျက်ပြီးပါပြီ'});}} return respond({success:false,message:'မတွေ့ပါ'}); } catch(e){return respond({success:false,message:e.toString()});}}

function getVendors(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Vendors_Directory');
    if (!sheet) { sheet=ss.insertSheet('Vendors_Directory'); sheet.appendRow(['Vendor_ID','Company','Name','Position','Category','Sub_Category','Grouping','Phone_1','Phone_2','Phone_3','Viber','Telegram','Email','Address','Services','Note','Photo_URL','Status','Updated_By','Last_Updated']); sheet.getRange(1,1,1,20).setFontWeight('bold'); return respond({success:true,data:[]}); }
    return respond({ success:true, data:sheetToObjects(sheet).reverse() });
  } catch(e){return respond({success:false,message:e.toString()});}
}

function saveVendor(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Vendors_Directory');
    if (!sheet) { sheet=ss.insertSheet('Vendors_Directory'); sheet.appendRow(['Vendor_ID','Company','Name','Position','Category','Sub_Category','Grouping','Phone_1','Phone_2','Phone_3','Viber','Telegram','Email','Address','Services','Note','Photo_URL','Status','Updated_By','Last_Updated']); sheet.getRange(1,1,1,20).setFontWeight('bold'); }
    var vid=data.Vendor_ID||'VND'+String(sheet.getLastRow()).padStart(4,'0'), now=getTodayGAS();
    var rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim());
    if (data.Vendor_ID) {
      var idCol=headers.indexOf('Vendor_ID');
      for (var i=1;i<rows.length;i++) { if ((rows[i][idCol]||'').toString().trim()===vid) { var upd={Company:data.Company,Name:data.Name,Position:data.Position,Category:data.Category,Sub_Category:data.Sub_Category,Grouping:data.Grouping,Phone_1:data.Phone_1,Phone_2:data.Phone_2,Phone_3:data.Phone_3,Viber:data.Viber,Telegram:data.Telegram,Email:data.Email,Address:data.Address,Services:data.Services,Note:data.Note,Photo_URL:data.Photo_URL,Status:data.Status||'Active',Updated_By:data.Updated_By,Last_Updated:now}; Object.keys(upd).forEach(k=>{var ci=headers.indexOf(k);if(ci>=0)sheet.getRange(i+1,ci+1).setValue(upd[k]!==undefined?upd[k]:'');}); return respond({success:true,message:'Vendor Update ပြီးပါပြီ'}); } }
    }
    var newRow=headers.map(h=>({Vendor_ID:vid,Company:data.Company||'',Name:data.Name||'',Position:data.Position||'',Category:data.Category||'',Sub_Category:data.Sub_Category||'',Grouping:data.Grouping||'',Phone_1:data.Phone_1||'',Phone_2:data.Phone_2||'',Phone_3:data.Phone_3||'',Viber:data.Viber||'',Telegram:data.Telegram||'',Email:data.Email||'',Address:data.Address||'',Services:data.Services||'',Note:data.Note||'',Photo_URL:data.Photo_URL||'',Status:data.Status||'Active',Updated_By:data.Updated_By||'',Last_Updated:now})[h]||'');
    sheet.appendRow(newRow);
    return respond({ success:true, message:'Vendor အသစ် မှတ်ပုံတင်ပြီးပါပြီ', Vendor_ID:vid });
  } catch(e){return respond({success:false,message:e.toString()});}
}

function deleteVendor(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Vendors_Directory'); if(!sheet) return respond({success:false,message:'Sheet မတွေ့ပါ'}); var rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim()),idCol=headers.indexOf('Vendor_ID'); for(var i=1;i<rows.length;i++){if((rows[i][idCol]||'').toString().trim()===data.Vendor_ID){sheet.deleteRow(i+1);return respond({success:true,message:'ဖျက်ပြီးပါပြီ'});}} return respond({success:false,message:'မတွေ့ပါ'}); } catch(e){return respond({success:false,message:e.toString()});}}

// ══════════════════════════════════════════════════════
// FLEXIBLE TIMETABLE
// ══════════════════════════════════════════════════════
function ensureFlexibleTimetableSheets() {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var exSheet=ss.getSheetByName('Exceptions'); if(!exSheet){exSheet=ss.insertSheet('Exceptions');exSheet.appendRow(['Date','Class','Type','ScheduleOverride','Reason','Created_By','Created_At']);exSheet.getRange(1,1,1,7).setFontWeight('bold');}
  var seaSheet=ss.getSheetByName('SeasonalRules'); if(!seaSheet){seaSheet=ss.insertSheet('SeasonalRules');seaSheet.appendRow(['Name','StartDate','EndDate','ApplyToAll','OverrideDays','Created_By','Created_At']);seaSheet.getRange(1,1,1,7).setFontWeight('bold');}
}

function getEffectiveTimetable(data) {
  try {
    ensureFlexibleTimetableSheets();
    var ss=SpreadsheetApp.getActiveSpreadsheet(), grade=data.grade||'', section=data.section||'', dateStr=data.date?_formatDateVal(data.date):getTodayGAS();
    var exSheet=ss.getSheetByName('Exceptions'), exceptions=sheetToObjects(exSheet);
    var matchedEx=exceptions.find(r=>r.Date===dateStr&&(r.Class==='all'||r.Class===grade));
    if (matchedEx) {
      if (matchedEx.Type==='holiday') return respond({success:true,data:[],isHoliday:true,reason:matchedEx.Reason||'ကျောင်းပိတ်ရက်'});
      else if (matchedEx.Type==='special'&&matchedEx.ScheduleOverride) return respond({success:true,data:[],specialSchedule:matchedEx.ScheduleOverride,reason:matchedEx.Reason});
    }
    var seaSheet=ss.getSheetByName('SeasonalRules'), seasonal=sheetToObjects(seaSheet), today=new Date(dateStr);
    var activeSeason=seasonal.find(r=>{var s=new Date(r.StartDate),e=new Date(r.EndDate);return today>=s&&today<=e;});
    if (activeSeason) { try { var od=JSON.parse(activeSeason.OverrideDays||'{}'); if(od[getDayName(dateStr)]==='closed') return respond({success:true,data:[],isHoliday:true,reason:activeSeason.Name+' (ရာသီပိတ်ရက်)'}); } catch(e){} }
    var ttSheet=ss.getSheetByName('Timetable'); if(!ttSheet) return respond({success:true,data:[]});
    var rows=sheetToObjects(ttSheet);
    if (grade) rows=rows.filter(r=>String(r.Grade||'').trim()===String(grade).trim());
    if (section) { var secU=String(section).trim().toUpperCase(); rows=rows.filter(r=>{var rS=String(r.Section||'').trim().toUpperCase();return rS===''||rS===secU;}); }
    return respond({ success:true, data:rows, isHoliday:false });
  } catch(e){return respond({success:false,message:e.toString()});}
}

function getExceptions(data) { try { ensureFlexibleTimetableSheets(); var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Exceptions'),rows=sheetToObjects(sheet); if(data.date) rows=rows.filter(r=>r.Date===data.date); if(data.class) rows=rows.filter(r=>r.Class===data.class||r.Class==='all'); return respond({success:true,data:rows}); } catch(e){return respond({success:false,message:e.toString()});}}
function saveException(data) { try { ensureFlexibleTimetableSheets(); var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Exceptions'); sheet.appendRow([data.Date||'',data.Class||'all',data.Type||'holiday',data.ScheduleOverride||'',data.Reason||'',data.Created_By||'',getTodayGAS()]); return respond({success:true,message:'Exception သိမ်းပြီးပါပြီ'}); } catch(e){return respond({success:false,message:e.toString()});}}
function deleteException(data) { try { ensureFlexibleTimetableSheets(); var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Exceptions'),rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim()),dateIdx=headers.indexOf('Date'),classIdx=headers.indexOf('Class'); for(var i=rows.length-1;i>=1;i--){if((rows[i][dateIdx]||'').toString().trim()===data.Date&&(rows[i][classIdx]||'').toString().trim()===data.Class){sheet.deleteRow(i+1);return respond({success:true,message:'ဖျက်ပြီးပါပြီ'});}} return respond({success:false,message:'မတွေ့ပါ'}); } catch(e){return respond({success:false,message:e.toString()});}}
function getSeasonalRules(data) { try { ensureFlexibleTimetableSheets(); var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('SeasonalRules'); return respond({success:true,data:sheetToObjects(sheet)}); } catch(e){return respond({success:false,message:e.toString()});}}
function saveSeasonalRule(data) { try { ensureFlexibleTimetableSheets(); var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('SeasonalRules'); sheet.appendRow([data.Name||'',data.StartDate||'',data.EndDate||'',data.ApplyToAll?'TRUE':'FALSE',data.OverrideDays||'{}',data.Created_By||'',getTodayGAS()]); return respond({success:true,message:'Seasonal rule သိမ်းပြီးပါပြီ'}); } catch(e){return respond({success:false,message:e.toString()});}}
function deleteSeasonalRule(data) { try { ensureFlexibleTimetableSheets(); var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('SeasonalRules'),rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim()),nameIdx=headers.indexOf('Name'); for(var i=rows.length-1;i>=1;i--){if((rows[i][nameIdx]||'').toString().trim()===data.Name){sheet.deleteRow(i+1);return respond({success:true,message:'ဖျက်ပြီးပါပြီ'});}} return respond({success:false,message:'မတွေ့ပါ'}); } catch(e){return respond({success:false,message:e.toString()});}}

// ══════════════════════════════════════════════════════
// HOSTEL INVENTORY (Full version with rich summary & log)
// ══════════════════════════════════════════════════════
var HOSTEL_HEADERS = ['Asset_ID','Hostel_Name','Item_Name','Category','Unit','Condition','Location','Assigned_To','Purchase_Date','Unit_Price','Useful_Life_Years','Serial_No','Warranty_Until','Note','Photo_URL','Last_Updated','Updated_By'];

function _getOrCreateHostelSheet(ss) {
  var sheet=ss.getSheetByName('Hostel_Inventory');
  if (!sheet) { sheet=ss.insertSheet('Hostel_Inventory'); sheet.getRange(1,1,1,HOSTEL_HEADERS.length).setValues([HOSTEL_HEADERS]).setFontWeight('bold'); }
  return sheet;
}

function _getOrCreateHostelLog(ss) {
  var sheet=ss.getSheetByName('Hostel_Inventory_Log');
  if (!sheet) { sheet=ss.insertSheet('Hostel_Inventory_Log'); sheet.appendRow(['Date','Asset_ID','Item_Name','Hostel_Name','Action','Old_Value','New_Value','Note','Done_By']); sheet.getRange(1,1,1,9).setFontWeight('bold'); }
  return sheet;
}

function migrateHostelInventoryToIndividualItems(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Hostel_Inventory');
    if (!sheet) return respond({success:false,message:'Hostel_Inventory sheet not found'});
    var headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim());
    if (headers.indexOf('Asset_ID')!==-1) return respond({success:false,message:'Already migrated.'});
    var oldData=sheetToObjects(sheet); if (!oldData.length) return respond({success:false,message:'No data'});
    sheet.clear();
    sheet.getRange(1,1,1,HOSTEL_HEADERS.length).setValues([HOSTEL_HEADERS]).setFontWeight('bold');
    var migratedCount=0, now=getTodayGAS();
    oldData.forEach(item => {
      var stockQty=Number(item.Stock_Qty)||0, good=Number(item.Good_Condition)||0, damaged=Number(item.Damaged)||0, needRepair=Number(item.Need_Repair)||0;
      var totalQty=stockQty||(good+damaged+needRepair)||(item.Item_Name?1:0);
      for (var i=0;i<totalQty;i++) {
        var assetId='HST'+String(sheet.getLastRow()+1).padStart(5,'0');
        var condition=i<good?'Good':i<good+damaged?'Damaged':'Need Repair';
        sheet.appendRow([assetId,item.Hostel_Name||'',item.Item_Name||'',item.Category||'',item.Unit||'Pcs',condition,item.Location||'',item.Assigned_To||'',item.Purchase_Date||'',item.Unit_Price||'',item.Useful_Life_Years||'',item.Serial_No||'',item.Warranty_Until||'',item.Note||'',item.Photo_URL||'',now,'System Migration']);
        migratedCount++;
      }
    });
    return respond({success:true,message:'Migration completed. '+migratedCount+' items created.',migratedCount});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function getHostelInventory(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=_getOrCreateHostelSheet(ss);
    var assets=sheetToObjects(sheet);
    if (data.hostel) assets=assets.filter(a=>a.Hostel_Name===data.hostel);
    if (data.category) assets=assets.filter(a=>a.Category===data.category);
    if (data.condition) assets=assets.filter(a=>a.Condition===data.condition);
    var summary={total:assets.length,byHostel:{},byCategory:{},byCondition:{},byLocation:{},byItemName:{},totalValue:0};
    assets.forEach(a=>{var h=a.Hostel_Name||'Unknown',cat=a.Category||'Other',cond=a.Condition||'Unknown',loc=a.Location||'Unknown',iName=a.Item_Name||'Unknown';summary.byHostel[h]=(summary.byHostel[h]||0)+1;summary.byCategory[cat]=(summary.byCategory[cat]||0)+1;summary.byCondition[cond]=(summary.byCondition[cond]||0)+1;summary.byLocation[loc]=(summary.byLocation[loc]||0)+1;summary.byItemName[iName]=(summary.byItemName[iName]||0)+1;summary.totalValue+=Number(a.Unit_Price||0);});
    return respond({success:true,data:assets,summary});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function addHostelItem(data) {
  var permErr=_requirePerm(data,'Can_Manage_Hostel'); if(permErr) return permErr;
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=_getOrCreateHostelSheet(ss);
    var now=getTodayGAS(), assetId='HST'+String(sheet.getLastRow()+1).padStart(5,'0');
    sheet.appendRow([assetId,data.Hostel_Name||'',data.Item_Name||'',data.Category||'',data.Unit||'Pcs',data.Condition||'Good',data.Location||'',data.Assigned_To||'',data.Purchase_Date||'',data.Unit_Price||'',data.Useful_Life_Years||'',data.Serial_No||'',data.Warranty_Until||'',data.Note||'',data.Photo_URL||'',now,data.Updated_By||'']);
    try { _getOrCreateHostelLog(ss).appendRow([now,assetId,data.Item_Name,data.Hostel_Name,'Add','','','',data.Updated_By||'']); } catch(e2){}
    return respond({success:true,message:'Asset added',Asset_ID:assetId});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function addHostelItemsBulk(data) {
  var permErr=_requirePerm(data,'Can_Manage_Hostel'); if(permErr) return permErr;
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=_getOrCreateHostelSheet(ss);
    var items=data.items||[]; if (!items.length) return respond({success:false,message:'No items'});
    var now=getTodayGAS(), addedIds=[];
    items.forEach((item,index)=>{var assetId='HST'+String(sheet.getLastRow()+index+1).padStart(5,'0');sheet.appendRow([assetId,item.Hostel_Name||'',item.Item_Name||'',item.Category||'',item.Unit||'Pcs',item.Condition||'Good',item.Location||'',item.Assigned_To||'',item.Purchase_Date||'',item.Unit_Price||'',item.Useful_Life_Years||'',item.Serial_No||'',item.Warranty_Until||'',item.Note||'',item.Photo_URL||'',now,item.Updated_By||'']);addedIds.push(assetId);});
    return respond({success:true,message:items.length+' assets added',Asset_IDs:addedIds});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function updateHostelItem(data) {
  var permErr=_requirePerm(data,'Can_Manage_Hostel'); if(permErr) return permErr;
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=_getOrCreateHostelSheet(ss);
    var rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim()),idCol=headers.indexOf('Asset_ID'),now=getTodayGAS();
    for (var i=1;i<rows.length;i++){if((rows[i][idCol]||'').toString().trim()===data.Asset_ID){var updates=JSON.parse(JSON.stringify(data));updates.Last_Updated=now;headers.forEach((h,j)=>{if(updates[h]!==undefined)sheet.getRange(i+1,j+1).setValue(updates[h]);});return respond({success:true,message:'Asset updated'});}}
    return respond({success:false,message:'Asset not found'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function logHostelUsage(data) {
  var permErr=_requirePerm(data,'Can_Manage_Hostel'); if(permErr) return permErr;
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=_getOrCreateHostelSheet(ss);
    var rows=sheet.getDataRange().getValues(),headers=rows[0].map(h=>h.toString().trim());
    var idCol=headers.indexOf('Asset_ID'),locCol=headers.indexOf('Location'),condCol=headers.indexOf('Condition'),asstCol=headers.indexOf('Assigned_To'),noteCol=headers.indexOf('Note'),now=getTodayGAS();
    var assetRow=-1, oldLoc='', oldCond='', oldAsst='';
    for (var i=1;i<rows.length;i++){if((rows[i][idCol]||'').toString().trim()===data.Asset_ID){assetRow=i+1;oldLoc=rows[i][locCol];oldCond=rows[i][condCol];oldAsst=rows[i][asstCol];break;}}
    if (assetRow===-1) return respond({success:false,message:'Asset not found'});
    if(data.New_Location!==undefined)sheet.getRange(assetRow,locCol+1).setValue(data.New_Location);
    if(data.New_Condition!==undefined)sheet.getRange(assetRow,condCol+1).setValue(data.New_Condition);
    if(data.New_Assigned_To!==undefined)sheet.getRange(assetRow,asstCol+1).setValue(data.New_Assigned_To);
    if(data.Note!==undefined){var oldNote=sheet.getRange(assetRow,noteCol+1).getValue();sheet.getRange(assetRow,noteCol+1).setValue(oldNote+(oldNote?'\n':'')+now+': '+data.Note);}
    sheet.getRange(assetRow,headers.indexOf('Last_Updated')+1).setValue(now);
    if(data.Done_By)sheet.getRange(assetRow,headers.indexOf('Updated_By')+1).setValue(data.Done_By);
    try {
      var logSheet=_getOrCreateHostelLog(ss), action=data.Action||'Update', oldVal='', newVal='';
      if(action==='Transfer'){oldVal=oldLoc;newVal=data.New_Location||'';}
      else if(action==='Condition Change'){oldVal=oldCond;newVal=data.New_Condition||'';}
      else if(action==='Reassign'){oldVal=oldAsst;newVal=data.New_Assigned_To||'';}
      logSheet.appendRow([now,data.Asset_ID,data.Item_Name||'',data.Hostel_Name||'',action,oldVal,newVal,data.Note||'',data.Done_By||'']);
    } catch(e2){}
    return respond({success:true,message:'Log recorded'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function getHostelAssetHistory(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),logSheet=ss.getSheetByName('Hostel_Inventory_Log'); if(!logSheet) return respond({success:true,data:[]}); return respond({success:true,data:sheetToObjects(logSheet).filter(l=>(l.Asset_ID||'').toString().trim()===data.Asset_ID).reverse()}); } catch(e){return respond({success:false,message:e.toString()});}}
function getHostelInventorySummary(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Hostel_Inventory'); if(!sheet) return respond({success:true,summary:{}}); var assets=sheetToObjects(sheet),summary={total:assets.length,byHostel:{},byCategory:{},byCondition:{},byLocation:{},byItemName:{},totalValue:0}; assets.forEach(a=>{var h=a.Hostel_Name||'Unknown',cat=a.Category||'Other',cond=a.Condition||'Unknown',loc=a.Location||'Unknown',iName=a.Item_Name||'Unknown';summary.byHostel[h]=(summary.byHostel[h]||0)+1;summary.byCategory[cat]=(summary.byCategory[cat]||0)+1;summary.byCondition[cond]=(summary.byCondition[cond]||0)+1;summary.byLocation[loc]=(summary.byLocation[loc]||0)+1;summary.byItemName[iName]=(summary.byItemName[iName]||0)+1;summary.totalValue+=Number(a.Unit_Price||0);}); return respond({success:true,summary}); } catch(e){return respond({success:false,message:e.toString()});}}
function getHostelInventoryLog(data) { try { var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Hostel_Inventory_Log'); if(!sheet) return respond({success:true,data:[]}); var items=sheetToObjects(sheet).reverse(); if(data.hostel) items=items.filter(i=>i.Hostel_Name===data.hostel); return respond({success:true,data:items}); } catch(e){return respond({success:false,message:e.toString()});}}

// ══════════════════════════════════════════════════════
// REGISTRY CRUD — Student & Staff (NEW from v2)
// ══════════════════════════════════════════════════════
function getRegistryConfig(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), cfgSheet=ss.getSheetByName('System_Config');
    var houses=[], houseColors={};
    if (cfgSheet) {
      var rows=sheetToObjects(cfgSheet), houseRows=rows.filter(r=>r.Setting_Category==='House_List'&&r.Setting_Name);
      houses=houseRows.map(r=>r.Setting_Name.toString().trim()).filter(Boolean);
      houseRows.forEach(r=>{houseColors[r.Setting_Name.toString().trim()]=r.Value_2||'#fbbf24';});
    }
    return respond({ success:true, grades:['KG','1','2','3','4','5','6','7','8','9','10','11','12'], sections:['A','B','C','D','E'], houses:houses.length?houses:['House 1','House 2','House 3','House 4'], houseColors, positions:['Principal','Vice Principal','Senior Teacher','Teacher','Assistant Teacher','Admin','Accountant','Librarian','Nurse','Driver','Security','Support Staff'], departments:['Academic','Administration','Finance','Hostel','Sports','Library','Medical'], religions:['Buddhist','Christian','Muslim','Hindu','Other'], schoolHostel:['School','Hostel'], sexOptions:['Male','Female'] });
  } catch(e){return respond({success:false,message:e.toString()});}
}

function getStudentById(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Student_Directory');
    if (!sheet) return respond({success:false,message:'Student_Directory မတွေ့ပါ'});
    var id=(data.id||data.Student_ID||data['Enrollment No.']||'').toString().trim();
    var student=sheetToObjects(sheet).find(r=>(r['Enrollment No.']||r.Student_ID||'').toString().trim()===id);
    if (!student) return respond({success:false,message:'ကျောင်းသား မတွေ့ပါ'});
    return respond({success:true,data:student});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function addStudent(data) {
  try {  // ✅ Management-only permission check
  if (!data || data.userRole !== 'management') {
    return respond({success:false, message:'Management permission လိုအပ်သည်'});
  }

    var ss=SpreadsheetApp.getActiveSpreadsheet(), dirSheet=ss.getSheetByName('Student_Directory');
    if (!dirSheet) return respond({success:false,message:'Student_Directory မတွေ့ပါ'});
    var dirHeaders=dirSheet.getRange(1,1,1,dirSheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim());
    var existingRows=sheetToObjects(dirSheet), enrollNo=(data['Enrollment No.']||data.Student_ID||'').toString().trim();
    if (!enrollNo) return respond({success:false,message:'Enrollment No. လိုအပ်သည်'});
    if (existingRows.find(r=>(r['Enrollment No.']||r.Student_ID||'').toString().trim()===enrollNo)) return respond({success:false,message:'Enrollment No. '+enrollNo+' ရှိပြီးသား'});
    var dirRow=dirHeaders.map(h=>data[h]!==undefined?data[h]:'');
    var statusIdx=dirHeaders.indexOf('Status'); if(statusIdx>=0) dirRow[statusIdx]=true;
    dirSheet.appendRow(dirRow);
    // Auto-create login
    var loginSheet=ss.getSheetByName('Student_Login');
    if (loginSheet) {
      var loginHeaders=loginSheet.getRange(1,1,1,loginSheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim());
      var loginMap={'Enrollment No.':enrollNo,'Student_ID':enrollNo,'Username':enrollNo,'Password':data.Password||enrollNo,'Name':data['Name (ALL CAPITAL)']||data.Name||'','Status':true};
      loginSheet.appendRow(loginHeaders.map(h=>loginMap[h]!==undefined?loginMap[h]:''));
    }
    return respond({success:true,message:'ကျောင်းသား ထည့်ပြီးပါပြီ — Login auto-created (Password: '+(data.Password||enrollNo)+')'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function updateStudent(data) {
  try {  // ✅ Management-only permission check
  if (!data || data.userRole !== 'management') {
    return respond({success:false, message:'Management permission လိုအပ်သည်'});
  }

    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Student_Directory');
    if (!sheet) return respond({success:false,message:'Student_Directory မတွေ့ပါ'});
    var allRows=sheet.getDataRange().getValues(), headers=allRows[0].map(h=>h.toString().trim()), idCol=-1;
    ['Enrollment No.','Student_ID'].forEach(c=>{if(idCol<0&&headers.indexOf(c)>=0)idCol=headers.indexOf(c);});
    if (idCol<0) return respond({success:false,message:'ID column မတွေ့ပါ'});
    var targetId=(data['Enrollment No.']||data.Student_ID||data.id||'').toString().trim();
    for (var i=1;i<allRows.length;i++) { if(allRows[i][idCol].toString().trim()===targetId){headers.forEach((h,j)=>{if(data[h]!==undefined&&h!=='Enrollment No.'&&h!=='Student_ID')sheet.getRange(i+1,j+1).setValue(data[h]);});return respond({success:true,message:'ကျောင်းသားအချက်အလက် ပြင်ဆင်ပြီးပါပြီ'});} }
    return respond({success:false,message:'ကျောင်းသား မတွေ့ပါ (ID: '+targetId+')'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function deleteStudent(data) {
  try {  // ✅ Management-only permission check
  if (!data || data.userRole !== 'management') {
    return respond({success:false, message:'Management permission လိုအပ်သည်'});
  }

    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Student_Directory');
    if (!sheet) return respond({success:false,message:'Student_Directory မတွေ့ပါ'});
    var allRows=sheet.getDataRange().getValues(), headers=allRows[0].map(h=>h.toString().trim()), idCol=-1;
    ['Enrollment No.','Student_ID'].forEach(c=>{if(idCol<0&&headers.indexOf(c)>=0)idCol=headers.indexOf(c);});
    var statusCol=headers.indexOf('Status'), targetId=(data['Enrollment No.']||data.Student_ID||data.id||'').toString().trim(), hardDelete=data.hardDelete===true;
    for (var i=1;i<allRows.length;i++) {
      if(allRows[i][idCol].toString().trim()===targetId){
        if(hardDelete){sheet.deleteRow(i+1);return respond({success:true,message:'ကျောင်းသားကို အပြည့်အဝ ဖျက်ပြီးပါပြီ'});}
        else{if(statusCol>=0)sheet.getRange(i+1,statusCol+1).setValue(false);return respond({success:true,message:'ကျောင်းသားကို Archive (Inactive) ပြုလုပ်ပြီးပါပြီ'});}
      }
    }
    return respond({success:false,message:'ကျောင်းသား မတွေ့ပါ'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function getStaffById(data) {
  try {
    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Staff_Login');
    if (!sheet) return respond({success:false,message:'Staff_Login မတွေ့ပါ'});
    var id=(data.id||data.Staff_ID||data.Username||'').toString().trim();
    var staff=sheetToObjects(sheet).find(r=>(r.Staff_ID||r.Username||'').toString().trim()===id);
    if (!staff) return respond({success:false,message:'ဝန်ထမ်း မတွေ့ပါ'});
    var safe=Object.assign({},staff); ['Password','password','Pass','pass','PIN'].forEach(k=>delete safe[k]);
    return respond({success:true,data:safe});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function addStaff(data) {
  try {  // ✅ Management-only permission check
  if (!data || data.userRole !== 'management') {
    return respond({success:false, message:'Management permission လိုအပ်သည်'});
  }

    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Staff_Login');
    if (!sheet) return respond({success:false,message:'Staff_Login မတွေ့ပါ'});
    var headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim());
    var existingRows=sheetToObjects(sheet), staffId=(data.Staff_ID||data.Username||'').toString().trim();
    if (!staffId) return respond({success:false,message:'Staff_ID လိုအပ်သည်'});
    if (existingRows.find(r=>(r.Staff_ID||r.Username||'').toString().trim()===staffId)) return respond({success:false,message:'Staff_ID '+staffId+' ရှိပြီးသား'});
    var defaultPw=data.Password||staffId, staffMap=Object.assign({Status:true,Password:defaultPw,Username:staffId},data);
    var newRow=headers.map(h=>staffMap[h]!==undefined?staffMap[h]:'');
    var statusIdx=headers.indexOf('Status'); if(statusIdx>=0) newRow[statusIdx]=true;
    sheet.appendRow(newRow);
    // Auto-create Staff_Permissions row
    var permSheet=getOrCreatePermSheet(ss), permHeaders=permSheet.getRange(1,1,1,permSheet.getLastColumn()).getValues()[0].map(h=>h.toString().trim());
    var permMap={Staff_ID:staffId,Name:data['Name (ALL CAPITAL)']||data.Name||'',Status:'TRUE'};
    getPermCols().forEach(k=>{permMap[k]='FALSE';});
    permSheet.appendRow(permHeaders.map(h=>permMap[h]!==undefined?permMap[h]:''));
    return respond({success:true,message:'ဝန်ထမ်း ထည့်ပြီးပါပြီ (Default Password: '+defaultPw+')'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function updateStaff(data) {
  try {  // ✅ Management-only permission check
  if (!data || data.userRole !== 'management') {
    return respond({success:false, message:'Management permission လိုအပ်သည်'});
  }

    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Staff_Login');
    if (!sheet) return respond({success:false,message:'Staff_Login မတွေ့ပါ'});
    var allRows=sheet.getDataRange().getValues(), headers=allRows[0].map(h=>h.toString().trim()), idCol=-1;
    ['Staff_ID','Username'].forEach(c=>{if(idCol<0&&headers.indexOf(c)>=0)idCol=headers.indexOf(c);});
    if (idCol<0) return respond({success:false,message:'ID column မတွေ့ပါ'});
    var targetId=(data.Staff_ID||data.Username||data.id||'').toString().trim();
    for (var i=1;i<allRows.length;i++){
      if(allRows[i][idCol].toString().trim()===targetId){
        headers.forEach((h,j)=>{if(data[h]!==undefined&&h!=='Staff_ID'&&h!=='Username'){if((h==='Password'||h==='password')&&!data[h]) return; sheet.getRange(i+1,j+1).setValue(data[h]);}});
        // Sync name to Staff_Permissions
        if(data.Name||data['Name (ALL CAPITAL)']){try{var permSheet=ss.getSheetByName('Staff_Permissions');if(permSheet){var pRows=permSheet.getDataRange().getValues(),pH=pRows[0].map(h=>h.toString().trim()),pIdCol=pH.indexOf('Staff_ID'),pNCol=pH.indexOf('Name');for(var j=1;j<pRows.length;j++){if(pIdCol>=0&&pRows[j][pIdCol].toString().trim()===targetId){if(pNCol>=0&&data['Name (ALL CAPITAL)'])permSheet.getRange(j+1,pNCol+1).setValue(data['Name (ALL CAPITAL)']);break;}}}}catch(e2){}}
        return respond({success:true,message:'ဝန်ထမ်းအချက်အလက် ပြင်ဆင်ပြီးပါပြီ'});
      }
    }
    return respond({success:false,message:'ဝန်ထမ်း မတွေ့ပါ'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

function deleteStaff(data) {
  try {  // ✅ Management-only permission check
  if (!data || data.userRole !== 'management') {
    return respond({success:false, message:'Management permission လိုအပ်သည်'});
  }

    var ss=SpreadsheetApp.getActiveSpreadsheet(), sheet=ss.getSheetByName('Staff_Login');
    if (!sheet) return respond({success:false,message:'Staff_Login မတွေ့ပါ'});
    var allRows=sheet.getDataRange().getValues(), headers=allRows[0].map(h=>h.toString().trim()), idCol=-1;
    ['Staff_ID','Username'].forEach(c=>{if(idCol<0&&headers.indexOf(c)>=0)idCol=headers.indexOf(c);});
    var statusCol=headers.indexOf('Status'), targetId=(data.Staff_ID||data.id||'').toString().trim(), hardDelete=data.hardDelete===true;
    for (var i=1;i<allRows.length;i++){
      if(allRows[i][idCol].toString().trim()===targetId){
        if(hardDelete) sheet.deleteRow(i+1); else if(statusCol>=0) sheet.getRange(i+1,statusCol+1).setValue(false);
        // Deactivate in Staff_Permissions
        try{var permSheet=ss.getSheetByName('Staff_Permissions');if(permSheet){var pRows=permSheet.getDataRange().getValues(),pH=pRows[0].map(h=>h.toString().trim()),pIdCol=pH.indexOf('Staff_ID'),pStatCol=pH.indexOf('Status');for(var j=1;j<pRows.length;j++){if(pIdCol>=0&&pRows[j][pIdCol].toString().trim()===targetId){if(pStatCol>=0)permSheet.getRange(j+1,pStatCol+1).setValue('FALSE');break;}}}}catch(e2){}
        return respond({success:true,message:hardDelete?'ဝန်ထမ်းကို အပြည့်အဝ ဖျက်ပြီးပါပြီ':'ဝန်ထမ်းကို Deactivate ပြုလုပ်ပြီးပါပြီ'});
      }
    }
    return respond({success:false,message:'ဝန်ထမ်း မတွေ့ပါ'});
  } catch(e){return respond({success:false,message:e.toString()});}
}

// ══════════════════════════════════════════════════════
// SHEET ANALYSIS UTILITY
// ══════════════════════════════════════════════════════
function analyzeSheets() {
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet(), sheets=ss.getSheets();
    let output='===== SHEET ANALYSIS REPORT =====\nGenerated: '+new Date()+'\nTotal Sheets: '+sheets.length+'\n\n';
    const knownSheets={'Inventory':'ပစ္စည်းစာရင်း','Inventory_Log':'ပစ္စည်းသုံးစွဲမှုမှတ်တမ်း','Inventory_Config':'ပစ္စည်းစနစ်ပြင်ဆင်မှု','Purchase_Requests':'ဝယ်ယူရန်တောင်းဆိုချက်','Lost_Found':'ပစ္စည်းပျောက်ဆုံးမှု','Student_Directory':'ကျောင်းသားစာရင်း','Staff_Login':'ဝန်ထမ်းဝင်ရောက်ခွင့်','Management_Login':'စီမံခန့်ခွဲသူ','Student_Login':'ကျောင်းသားဝင်ရောက်ခွင့်','Fees_Management':'ကျောင်းလခ','House_Points':'အိမ်အမှတ်','System_Config':'စနစ်ပြင်ဆင်မှု','Announcements':'ကြေညာချက်','Events_Calendar':'ပွဲပြက္ခဒိန်','Timetable':'အချိန်ဇယား','Timetable_Config':'အချိန်ဇယားပြင်ဆင်မှု','Vehicles':'ယာဉ်','Vendors_Directory':'ကုန်သည်','Exceptions':'ချွင်းချက်','SeasonalRules':'ရာသီစည်းမျဉ်း','Hostel_Inventory':'အဆောင်ပစ္စည်း','Hostel_Inventory_Log':'အဆောင်မှတ်တမ်း','Staff_Permissions':'ဝန်ထမ်းခွင့်ပြု','Leave_Records':'ခွင့်မှတ်တမ်း','Exam_Records':'စာမေးပွဲ','Shoutbox':'Shoutbox','Student_Notes_Log':'ကျောင်းသားမှတ်စု'};
    sheets.forEach((sheet,idx)=>{var n=sheet.getName(),lr=sheet.getLastRow(),lc=sheet.getLastColumn();output+='─────────────────\nSheet #'+(idx+1)+': '+n+'\n  Rows: '+lr+', Cols: '+lc+'\n';if(lr>0&&lc>0){var h=sheet.getRange(1,1,1,lc).getValues()[0].join(', ');output+='  Headers: '+(h.length>100?h.substring(0,100)+'...':h)+'\n';}output+='  Purpose: '+(knownSheets[n]||'(Unknown)')+'\n';if(lr<=1)output+='  ⚠️ ဤ Sheet သည် ဗလာ\n';});
    var rSheet=ss.getSheetByName('Sheet_Analysis')||ss.insertSheet('Sheet_Analysis');
    rSheet.clear(); rSheet.getRange('A1').setValue(output).setFontFamily('Courier New');
    SpreadsheetApp.getUi().alert('Analysis Complete! Check "Sheet_Analysis" sheet.');
  } catch(e){SpreadsheetApp.getUi().alert('Error: '+e.toString());}
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📊 Sheet Tools').addItem('🔍 Analyze Sheets','analyzeSheets').addToUi();
}
