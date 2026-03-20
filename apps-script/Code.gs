
/**
 * Taskify Apps Script API
 * - Web App endpoint using action-based routing
 * - Core modules: tasks, notifications, finance, sheets, system
 */

var API_VERSION = "1.1.0";
var APP_TIMEZONE = "Asia/Ho_Chi_Minh";
var DEFAULT_DUE_TIME = "17:00";
var DEFAULT_EVENT_DURATION_MINUTES = 30;

var REMINDER_1H_MINUTES = 60;
var REMINDER_15M_MINUTES = 15;

var CORE_SHEETS = {
  tasks: "Tasks",
  notifications: "Notifications",
  finance: "Finance",
};

var CORE_HEADERS = {
  tasks: [
    "id",
    "title",
    "description",
    "status",
    "priority",
    "startDate",
    "dueDate",
    "dueAt",
    "syncCalendar",
    "calendarEventId",
    "notified1hAt",
    "notified15mAt",
    "createdAt",
    "updatedAt",
  ],
  notifications: [
    "id",
    "type",
    "subject",
    "message",
    "from",
    "timestamp",
    "read",
    "starred",
    "priority",
    "relatedTaskId",
    "createdAt",
    "updatedAt",
  ],
  finance: [
    "id",
    "date",
    "category",
    "type",
    "amount",
    "note",
    "createdAt",
    "updatedAt",
  ],
};

var WRITE_ACTIONS = {
  "tasks.create": true,
  "tasks.update": true,
  "tasks.delete": true,
  "notifications.create": true,
  "notifications.markRead": true,
  "notifications.toggleStar": true,
  "notifications.delete": true,
  "notifications.markAllRead": true,
  "finance.create": true,
  "sheets.append": true,
  "sheets.create": true,
  "system.runReminderSweep": true,
  "system.setupReminderTrigger": true,
  "system.clearReminderTrigger": true,
};

function doGet(e) {
  return handleRequest_("GET", e || {});
}

function doPost(e) {
  return handleRequest_("POST", e || {});
}

function handleRequest_(method, e) {
  try {
    var request = parseRequest_(method, e);

    if (!request.action) {
      return jsonSuccess_(
        {
          name: "Taskify Apps Script API",
          version: API_VERSION,
          now: nowIso_(),
          actions: getSupportedActions_(),
        },
        {}
      );
    }

    var auth = authorizeRequest_(request);
    if (!auth.ok) {
      return jsonError_(401, auth.message, auth.code);
    }

    var result;
    if (WRITE_ACTIONS[request.action]) {
      result = withScriptLock_(function () {
        return routeAction_(request);
      });
    } else {
      result = routeAction_(request);
    }

    return jsonSuccess_(result.data, result.meta || {});
  } catch (error) {
    return jsonError_(500, toErrorMessage_(error), "INTERNAL_ERROR");
  }
}

function routeAction_(request) {
  var action = request.action;
  var query = request.query;
  var payload = request.payload;

  switch (action) {
    case "system.health":
      return {
        data: {
          status: "ok",
          version: API_VERSION,
          timestamp: nowIso_(),
          timezone: APP_TIMEZONE,
          reminderPolicy: "1h once + 15m once",
        },
      };

    case "system.runReminderSweep":
      return { data: runReminderSweep_() };

    case "system.setupReminderTrigger":
      return {
        data: setupReminderTrigger_(toNumber_(query.intervalMinutes || payload.intervalMinutes || 5)),
      };

    case "system.clearReminderTrigger":
      return { data: clearReminderTrigger_() };

    case "tasks.list":
      return tasksList_(query);
    case "tasks.create":
      return tasksCreate_(payload);
    case "tasks.update":
      return tasksUpdate_(payload);
    case "tasks.delete":
      return tasksDelete_(payload);
    case "tasks.stats":
      return tasksStats_(query);
    case "tasks.recent":
      return tasksRecent_(query);
    case "tasks.byDate":
      return tasksByDate_(query);
    case "tasks.dueToday":
      return tasksDueToday_();
    case "calendar.events":
      return calendarEvents_(query);

    case "notifications.list":
      return notificationsList_(query);
    case "notifications.create":
      return notificationsCreate_(payload);
    case "notifications.markRead":
      return notificationsMarkRead_(payload);
    case "notifications.toggleStar":
      return notificationsToggleStar_(payload);
    case "notifications.delete":
      return notificationsDelete_(payload);
    case "notifications.markAllRead":
      return notificationsMarkAllRead_();

    case "finance.list":
      return financeList_(query);
    case "finance.create":
      return financeCreate_(payload);
    case "finance.summary":
      return financeSummary_(query);
    case "finance.byCategory":
      return financeByCategory_(query);

    case "sheets.list":
      return sheetsList_();
    case "sheets.headers":
      return sheetsHeaders_(query);
    case "sheets.append":
      return sheetsAppend_(payload);
    case "sheets.create":
      return sheetsCreate_(payload);

    default:
      throw new Error("Unsupported action: " + action);
  }
}

function getSupportedActions_() {
  return [
    "system.health",
    "system.runReminderSweep",
    "system.setupReminderTrigger",
    "system.clearReminderTrigger",
    "tasks.list",
    "tasks.create",
    "tasks.update",
    "tasks.delete",
    "tasks.stats",
    "tasks.recent",
    "tasks.byDate",
    "tasks.dueToday",
    "calendar.events",
    "notifications.list",
    "notifications.create",
    "notifications.markRead",
    "notifications.toggleStar",
    "notifications.delete",
    "notifications.markAllRead",
    "finance.list",
    "finance.create",
    "finance.summary",
    "finance.byCategory",
    "sheets.list",
    "sheets.headers",
    "sheets.append",
    "sheets.create",
  ];
}

function parseRequest_(method, e) {
  var urlQuery = e.parameter || {};
  var body = {};

  if (method === "POST" && e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (error) {
      body = {};
    }
  }

  var bodyQuery = body.query && isObject_(body.query) ? body.query : {};
  var query = mergeObjects_(urlQuery, bodyQuery);

  var action = trim_(query.action || body.action || "");
  var payload = body.payload && isObject_(body.payload) ? body.payload : body;
  var token = trim_(body.token || query.token || "");

  if (token) {
    query.token = token;
    if (isObject_(payload)) {
      payload.token = token;
    }
  }

  return {
    method: method,
    action: action,
    query: query,
    payload: payload || {},
  };
}

function authorizeRequest_(request) {
  if (request.action === "system.health") {
    return { ok: true };
  }

  var requiredToken =
    PropertiesService.getScriptProperties().getProperty("API_TOKEN") || "";

  if (!requiredToken) {
    return {
      ok: false,
      message: "API token is not configured on server.",
      code: "TOKEN_NOT_CONFIGURED",
    };
  }

  var providedToken = trim_(
    request.payload.token || request.query.token || ""
  );

  if (!providedToken || providedToken !== requiredToken) {
    return {
      ok: false,
      message: "Unauthorized",
      code: "INVALID_TOKEN",
    };
  }

  return { ok: true };
}

function withScriptLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function ensureCoreSheets_() {
  ensureSheetWithHeaders_(CORE_SHEETS.tasks, CORE_HEADERS.tasks);
  ensureSheetWithHeaders_(CORE_SHEETS.notifications, CORE_HEADERS.notifications);
  ensureSheetWithHeaders_(CORE_SHEETS.finance, CORE_HEADERS.finance);
}

function getSpreadsheet_() {
  var spreadsheetId =
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "";
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheetWithHeaders_(sheetName, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastColumn() < headers.length) {
    sheet.insertColumnsAfter(
      Math.max(1, sheet.getLastColumn()),
      headers.length - sheet.getLastColumn()
    );
  }

  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (!arrayEquals_(current, headers)) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function getSheetHeaders_(sheet) {
  if (!sheet) return [];
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  return headers.map(function (h) {
    return trim_(h);
  });
}

function getSheetRowsAsObjects_(sheet) {
  var headers = getSheetHeaders_(sheet);
  if (!headers.length) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var result = [];

  for (var i = 0; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    result.push(obj);
  }

  return result;
}

function getSheetRowsWithIndex_(sheet, headers) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var rows = [];

  for (var i = 0; i < values.length; i++) {
    rows.push({
      rowIndex: i + 2,
      obj: rowToObjectByHeaders_(headers, values[i]),
    });
  }

  return rows;
}
function appendObjectRow_(sheet, headers, obj) {
  var row = headers.map(function (header) {
    if (!Object.prototype.hasOwnProperty.call(obj, header)) return "";
    return obj[header];
  });
  sheet.appendRow(row);
}

function findRowIndexById_(sheet, id) {
  var headers = getSheetHeaders_(sheet);
  var idCol = headers.indexOf("id");
  if (idCol === -1) throw new Error("Sheet does not have 'id' column.");

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  var range = sheet.getRange(2, idCol + 1, lastRow - 1, 1);
  var finder = range.createTextFinder(String(id)).matchEntireCell(true).findNext();
  return finder ? finder.getRow() : -1;
}

function rowToObjectByHeaders_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = row[i];
  }
  return obj;
}

function writeObjectToRow_(sheet, rowIndex, headers, obj) {
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([
    headers.map(function (h) {
      if (!Object.prototype.hasOwnProperty.call(obj, h)) return "";
      return obj[h];
    }),
  ]);
}

function dateToYmd_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, APP_TIMEZONE, "yyyy-MM-dd");
  }

  var str = String(value);
  if (str.indexOf("T") > -1) return str.split("T")[0];
  if (str.indexOf(" ") > -1) return str.split(" ")[0];
  return str;
}

function valueToIso_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  var parsed = parseDateTime_(value);
  if (parsed) {
    return Utilities.formatDate(parsed, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  return String(value);
}

function toNumber_(value) {
  var n = Number(value);
  return isNaN(n) ? 0 : n;
}

function toBoolean_(value, fallback) {
  if (value === true || value === false) return value;
  if (value == null || value === "") return fallback === true;
  var str = String(value).toLowerCase();
  return str === "true" || str === "1" || str === "yes";
}

function parseDateTime_(value) {
  if (!value) return null;

  if (Object.prototype.toString.call(value) === "[object Date]") {
    if (isNaN(value.getTime())) return null;
    return value;
  }

  var raw = trim_(String(value));
  if (!raw) return null;

  var nativeParsed = new Date(raw);
  if (!isNaN(nativeParsed.getTime())) return nativeParsed;

  var match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (!match) return null;

  var year = Number(match[1]);
  var month = Number(match[2]);
  var day = Number(match[3]);
  var hour = Number(match[4] || "0");
  var minute = Number(match[5] || "0");
  var second = Number(match[6] || "0");

  return new Date(year, month - 1, day, hour, minute, second);
}

function combineDateAndTimeToIso_(dateText, timeText) {
  if (!dateText) return "";
  var time = trim_(timeText || DEFAULT_DUE_TIME);
  if (!/^\d{2}:\d{2}$/.test(time)) {
    time = DEFAULT_DUE_TIME;
  }

  var parsed = parseDateTime_(dateText + "T" + time + ":00");
  if (!parsed) return "";
  return Utilities.formatDate(parsed, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function extractTimeHHmmFromIso_(isoText) {
  var parsed = parseDateTime_(isoText);
  if (!parsed) return DEFAULT_DUE_TIME;
  return Utilities.formatDate(parsed, APP_TIMEZONE, "HH:mm");
}

function nowIso_() {
  return Utilities.formatDate(new Date(), APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function minutesBetween_(futureDate, fromDate) {
  return Math.floor((futureDate.getTime() - fromDate.getTime()) / 60000);
}

function trim_(value) {
  if (value == null) return "";
  return String(value).replace(/^\s+|\s+$/g, "");
}

function mergeObjects_(base, patch) {
  var out = {};
  for (var key in base) out[key] = base[key];
  for (var patchKey in patch) out[patchKey] = patch[patchKey];
  return out;
}

function isObject_(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function arrayEquals_(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (String(a[i]) !== String(b[i])) return false;
  }
  return true;
}

function toErrorMessage_(error) {
  if (!error) return "Unknown error";
  if (error.message) return error.message;
  return String(error);
}

function normalizeTask_(item) {
  var validStatus = ["todo", "in-progress", "done", "failed"];
  var validPriority = ["low", "medium", "high"];

  var status = trim_(item.status || "todo");
  var priority = trim_(item.priority || "medium");

  if (validStatus.indexOf(status) === -1) status = "todo";
  if (validPriority.indexOf(priority) === -1) priority = "medium";

  var dueDate = dateToYmd_(item.dueDate);
  var dueAt = valueToIso_(item.dueAt);
  if (!dueAt && dueDate) {
    dueAt = combineDateAndTimeToIso_(dueDate, DEFAULT_DUE_TIME);
  }

  return {
    id: trim_(item.id),
    title: String(item.title || ""),
    description: String(item.description || ""),
    status: status,
    priority: priority,
    startDate: dateToYmd_(item.startDate),
    dueDate: dueDate,
    dueAt: dueAt,
    syncCalendar: toBoolean_(item.syncCalendar, true),
    calendarEventId: String(item.calendarEventId || ""),
    notified1hAt: valueToIso_(item.notified1hAt),
    notified15mAt: valueToIso_(item.notified15mAt),
    createdAt: valueToIso_(item.createdAt),
    updatedAt: valueToIso_(item.updatedAt),
  };
}

function applyAutoOverdueStatus_(task) {
  if (!task || !task.id) return task;
  if (task.status === "done" || task.status === "failed") return task;

  var dueAtDate = parseDateTime_(task.dueAt);
  if (!dueAtDate) return task;

  if (dueAtDate.getTime() < new Date().getTime()) {
    return mergeObjects_(task, { status: "failed" });
  }

  return task;
}

function getTaskSheet_() {
  return getSpreadsheet_().getSheetByName(CORE_SHEETS.tasks);
}

function ensureTaskSheet_() {
  return ensureSheetWithHeaders_(CORE_SHEETS.tasks, CORE_HEADERS.tasks);
}

function getAllTasks_(applyAutoStatus) {
  var sheet = getTaskSheet_();
  if (!sheet) return [];

  var raw = getSheetRowsAsObjects_(sheet);
  return raw
    .map(normalizeTask_)
    .filter(function (task) {
      return task.id;
    })
    .map(function (task) {
      return applyAutoStatus ? applyAutoOverdueStatus_(task) : task;
    });
}

function getCalendar_() {
  var calendarId =
    PropertiesService.getScriptProperties().getProperty("CALENDAR_ID") || "";

  if (calendarId) {
    var byId = CalendarApp.getCalendarById(calendarId);
    if (!byId) {
      throw new Error("CALENDAR_ID is set but calendar was not found.");
    }
    return byId;
  }

  var defaultCal = CalendarApp.getDefaultCalendar();
  if (!defaultCal) throw new Error("Default calendar not found.");
  return defaultCal;
}

function upsertCalendarEventForTask_(task, existingEventId) {
  if (!task.syncCalendar || !task.dueAt || task.status === "done") {
    if (existingEventId) {
      deleteCalendarEventById_(existingEventId);
    }
    return "";
  }

  var dueAt = parseDateTime_(task.dueAt);
  if (!dueAt) return "";

  var endAt = new Date(
    dueAt.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000
  );
  var calendar = getCalendar_();
  var event = null;

  if (existingEventId) {
    event = calendar.getEventById(existingEventId);
  }

  var description =
    "Task ID: " +
    task.id +
    "\nPriority: " +
    task.priority +
    "\nStatus: " +
    task.status +
    "\n\n" +
    task.description;

  if (event) {
    event.setTitle(task.title || "Task");
    event.setDescription(description);
    event.setTime(dueAt, endAt);
    safeResetEventReminders_(event);
    return event.getId();
  }

  var created = calendar.createEvent(task.title || "Task", dueAt, endAt, {
    description: description,
  });
  safeResetEventReminders_(created);
  return created.getId();
}

function safeResetEventReminders_(event) {
  try {
    event.removeAllReminders();
    event.addPopupReminder(REMINDER_1H_MINUTES);
    event.addPopupReminder(REMINDER_15M_MINUTES);
  } catch (error) {
    Logger.log("Unable to set reminders for event " + event.getId() + ": " + toErrorMessage_(error));
  }
}

function deleteCalendarEventById_(eventId) {
  if (!eventId) return;
  try {
    var calendar = getCalendar_();
    var event = calendar.getEventById(eventId);
    if (event) event.deleteEvent();
  } catch (error) {
    Logger.log("Unable to delete event " + eventId + ": " + toErrorMessage_(error));
  }
}

function tasksList_(query) {
  var search = trim_(query.search || "").toLowerCase();
  var status = trim_(query.status || "");
  var priority = trim_(query.priority || "");
  var dueFrom = trim_(query.dueFrom || "");
  var dueTo = trim_(query.dueTo || "");
  var page = Math.max(1, toNumber_(query.page || 1));
  var pageSize = Math.min(200, Math.max(1, toNumber_(query.pageSize || 50)));

  var list = getAllTasks_(true).filter(function (task) {
    if (search) {
      var haystack = (task.title + " " + task.description).toLowerCase();
      if (haystack.indexOf(search) === -1) return false;
    }
    if (status && task.status !== status) return false;
    if (priority && task.priority !== priority) return false;
    if (dueFrom && task.dueDate < dueFrom) return false;
    if (dueTo && task.dueDate > dueTo) return false;
    return true;
  });

  list.sort(function (a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  var total = list.length;
  var start = (page - 1) * pageSize;
  var items = list.slice(start, start + pageSize);

  return {
    data: {
      items: items,
      total: total,
      page: page,
      pageSize: pageSize,
    },
  };
}

function tasksCreate_(payload) {
  ensureTaskSheet_();

  var title = trim_(payload.title || "");
  if (!title) throw new Error("title is required");

  var now = nowIso_();
  var dueDate = trim_(payload.dueDate || "") || dateToYmd_(new Date());
  var dueAt =
    trim_(payload.dueAt || "") ||
    combineDateAndTimeToIso_(
      dueDate,
      trim_(payload.dueTime || "") || DEFAULT_DUE_TIME
    );

  var task = normalizeTask_({
    id: Utilities.getUuid(),
    title: title,
    description: payload.description || "",
    status: payload.status || "todo",
    priority: payload.priority || "medium",
    startDate: payload.startDate || dateToYmd_(new Date()),
    dueDate: dueDate,
    dueAt: dueAt,
    syncCalendar: payload.syncCalendar,
    calendarEventId: "",
    notified1hAt: "",
    notified15mAt: "",
    createdAt: now,
    updatedAt: now,
  });

  task.calendarEventId = upsertCalendarEventForTask_(task, "");

  var sheet = getTaskSheet_();
  appendObjectRow_(sheet, CORE_HEADERS.tasks, task);

  return { data: applyAutoOverdueStatus_(task) };
}
function tasksUpdate_(payload) {
  ensureTaskSheet_();

  var id = trim_(payload.id || "");
  if (!id) throw new Error("id is required");

  var sheet = getTaskSheet_();
  var rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex < 0) throw new Error("task not found");

  var headers = CORE_HEADERS.tasks;
  var row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var current = normalizeTask_(rowToObjectByHeaders_(headers, row));

  var nextDueDate =
    payload.dueDate != null ? dateToYmd_(payload.dueDate) : current.dueDate;

  var nextDueAt = current.dueAt;
  if (payload.dueAt != null) {
    nextDueAt = valueToIso_(payload.dueAt);
  } else if (payload.dueDate != null) {
    nextDueAt = combineDateAndTimeToIso_(
      nextDueDate,
      extractTimeHHmmFromIso_(current.dueAt)
    );
  }

  var merged = normalizeTask_({
    id: current.id,
    title: payload.title != null ? payload.title : current.title,
    description: payload.description != null ? payload.description : current.description,
    status: payload.status != null ? payload.status : current.status,
    priority: payload.priority != null ? payload.priority : current.priority,
    startDate: payload.startDate != null ? payload.startDate : current.startDate,
    dueDate: nextDueDate,
    dueAt: nextDueAt,
    syncCalendar:
      payload.syncCalendar != null ? payload.syncCalendar : current.syncCalendar,
    calendarEventId: current.calendarEventId,
    notified1hAt: current.notified1hAt,
    notified15mAt: current.notified15mAt,
    createdAt: current.createdAt,
    updatedAt: nowIso_(),
  });

  if (
    (payload.dueDate != null && payload.dueDate !== current.dueDate) ||
    (payload.dueAt != null && valueToIso_(payload.dueAt) !== current.dueAt)
  ) {
    merged.notified1hAt = "";
    merged.notified15mAt = "";
  }

  if (merged.status === "done") {
    deleteCalendarEventById_(current.calendarEventId);
    merged.calendarEventId = "";
  } else {
    merged.calendarEventId = upsertCalendarEventForTask_(merged, current.calendarEventId);
  }

  writeObjectToRow_(sheet, rowIndex, headers, merged);

  return { data: applyAutoOverdueStatus_(merged) };
}

function tasksDelete_(payload) {
  ensureTaskSheet_();

  var id = trim_(payload.id || "");
  if (!id) throw new Error("id is required");

  var sheet = getTaskSheet_();
  var rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex < 0) throw new Error("task not found");

  var headers = CORE_HEADERS.tasks;
  var row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var current = normalizeTask_(rowToObjectByHeaders_(headers, row));

  deleteCalendarEventById_(current.calendarEventId);
  sheet.deleteRow(rowIndex);

  return { data: { success: true, id: id } };
}

function tasksStats_(query) {
  var dueFrom = trim_(query.dueFrom || "");
  var dueTo = trim_(query.dueTo || "");

  var list = getAllTasks_(true).filter(function (task) {
    if (dueFrom && task.dueDate < dueFrom) return false;
    if (dueTo && task.dueDate > dueTo) return false;
    return true;
  });

  var stats = {
    total: list.length,
    done: 0,
    inProgress: 0,
    todo: 0,
    failed: 0,
  };

  list.forEach(function (task) {
    if (task.status === "done") stats.done += 1;
    if (task.status === "in-progress") stats.inProgress += 1;
    if (task.status === "todo") stats.todo += 1;
    if (task.status === "failed") stats.failed += 1;
  });

  return { data: stats };
}

function tasksRecent_(query) {
  var limit = Math.min(100, Math.max(1, toNumber_(query.limit || 5)));
  var items = getAllTasks_(true)
    .sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit);

  return { data: { items: items } };
}

function tasksByDate_(query) {
  var date = trim_(query.date || "");
  if (!date) throw new Error("date is required (yyyy-MM-dd)");

  var items = getAllTasks_(true).filter(function (task) {
    return task.dueDate === date;
  });

  return { data: { items: items, date: date } };
}

function tasksDueToday_() {
  var today = Utilities.formatDate(new Date(), APP_TIMEZONE, "yyyy-MM-dd");
  var items = getAllTasks_(true).filter(function (task) {
    return task.status !== "done" && task.dueDate === today;
  });
  return { data: { date: today, items: items } };
}

function calendarEvents_(query) {
  var fromRaw = trim_(query.from || "");
  var toRaw = trim_(query.to || "");

  var fromDate = parseDateTime_(fromRaw);
  var toDate = parseDateTime_(toRaw);

  if (!fromDate) {
    var now = new Date();
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  }
  if (!toDate) {
    toDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1, 0, 0, 0);
  }

  if (toDate.getTime() <= fromDate.getTime()) {
    throw new Error("Invalid range: 'to' must be greater than 'from'.");
  }

  var calendar = getCalendar_();
  var events = calendar.getEvents(fromDate, toDate);

  var items = events.map(function (event) {
    return {
      id: event.getId(),
      title: event.getTitle(),
      description: event.getDescription() || "",
      location: event.getLocation() || "",
      startAt: valueToIso_(event.getStartTime()),
      endAt: valueToIso_(event.getEndTime()),
      allDay: event.isAllDayEvent(),
    };
  });

  items.sort(function (a, b) {
    return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return {
    data: {
      from: valueToIso_(fromDate),
      to: valueToIso_(toDate),
      items: items,
    },
  };
}

function runReminderSweep_() {
  ensureCoreSheets_();

  var taskSheet = getTaskSheet_();
  var notificationSheet = getSpreadsheet_().getSheetByName(CORE_SHEETS.notifications);
  var headers = CORE_HEADERS.tasks;
  var rows = getSheetRowsWithIndex_(taskSheet, headers);
  var now = new Date();
  var nowIso = nowIso_();

  var reminded1h = 0;
  var reminded15m = 0;
  var autoFailed = 0;

  for (var i = 0; i < rows.length; i++) {
    var rowMeta = rows[i];
    var task = normalizeTask_(rowMeta.obj);
    if (!task.id) continue;

    var changed = false;
    var dueAtDate = parseDateTime_(task.dueAt);

    if (!dueAtDate && task.dueDate) {
      task.dueAt = combineDateAndTimeToIso_(task.dueDate, DEFAULT_DUE_TIME);
      dueAtDate = parseDateTime_(task.dueAt);
      changed = true;
    }

    if (!dueAtDate) {
      if (changed) {
        task.updatedAt = nowIso;
        writeObjectToRow_(taskSheet, rowMeta.rowIndex, headers, task);
      }
      continue;
    }

    var minutesLeft = minutesBetween_(dueAtDate, now);

    if (task.status !== "done" && minutesLeft <= 0 && task.status !== "failed") {
      task.status = "failed";
      task.updatedAt = nowIso;
      autoFailed += 1;

      if (task.calendarEventId) {
        deleteCalendarEventById_(task.calendarEventId);
        task.calendarEventId = "";
      }

      changed = true;
    }

    if (task.status !== "done" && task.status !== "failed") {
      if (
        minutesLeft > REMINDER_15M_MINUTES &&
        minutesLeft <= REMINDER_1H_MINUTES &&
        !task.notified1hAt
      ) {
        appendReminderNotification_(notificationSheet, task, "1h", minutesLeft);
        task.notified1hAt = nowIso;
        task.updatedAt = nowIso;
        reminded1h += 1;
        changed = true;
      }

      if (
        minutesLeft > 0 &&
        minutesLeft <= REMINDER_15M_MINUTES &&
        !task.notified15mAt
      ) {
        appendReminderNotification_(notificationSheet, task, "15m", minutesLeft);
        task.notified15mAt = nowIso;
        task.updatedAt = nowIso;
        reminded15m += 1;
        changed = true;
      }
    }

    if (changed) {
      writeObjectToRow_(taskSheet, rowMeta.rowIndex, headers, task);
    }
  }

  return {
    reminded1h: reminded1h,
    reminded15m: reminded15m,
    autoFailed: autoFailed,
    checkedAt: nowIso,
  };
}

function appendReminderNotification_(notificationSheet, task, window, minutesLeft) {
  var now = nowIso_();
  var subject =
    window === "1h"
      ? "Reminder: task due in about 1 hour"
      : "Reminder: task due in about 15 minutes";

  var message =
    "Task \"" +
    task.title +
    "\" is due at " +
    (task.dueAt || task.dueDate) +
    ". Remaining: " +
    Math.max(0, minutesLeft) +
    " minute(s).";

  var notification = normalizeNotification_({
    id: Utilities.getUuid(),
    type: "reminder",
    subject: subject,
    message: message,
    from: "Taskify Reminder Bot",
    timestamp: now,
    read: false,
    starred: false,
    priority: "high",
    relatedTaskId: task.id,
    createdAt: now,
    updatedAt: now,
  });

  appendObjectRow_(notificationSheet, CORE_HEADERS.notifications, notification);
}

function setupReminderTrigger_(intervalMinutes) {
  var interval = Math.max(5, Math.min(60, intervalMinutes || 5));
  clearReminderTrigger_();

  var trigger = ScriptApp.newTrigger("runReminderSweep")
    .timeBased()
    .everyMinutes(interval)
    .create();

  return {
    success: true,
    triggerId: trigger.getUniqueId(),
    intervalMinutes: interval,
  };
}

function clearReminderTrigger_() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "runReminderSweep") {
      ScriptApp.deleteTrigger(triggers[i]);
      removed += 1;
    }
  }

  return { success: true, removed: removed };
}

function runReminderSweep() {
  return runReminderSweep_();
}

function setupReminderTrigger() {
  return setupReminderTrigger_(5);
}

function clearReminderTrigger() {
  return clearReminderTrigger_();
}
function normalizeNotification_(item) {
  return {
    id: trim_(item.id),
    type: String(item.type || "reminder"),
    subject: String(item.subject || ""),
    message: String(item.message || ""),
    from: String(item.from || "Taskify System"),
    timestamp: valueToIso_(item.timestamp),
    read: toBoolean_(item.read, false),
    starred: toBoolean_(item.starred, false),
    priority: String(item.priority || "normal"),
    relatedTaskId: String(item.relatedTaskId || ""),
    createdAt: valueToIso_(item.createdAt),
    updatedAt: valueToIso_(item.updatedAt),
  };
}

function getNotificationSheet_() {
  return getSpreadsheet_().getSheetByName(CORE_SHEETS.notifications);
}

function ensureNotificationSheet_() {
  return ensureSheetWithHeaders_(
    CORE_SHEETS.notifications,
    CORE_HEADERS.notifications
  );
}

function getAllNotifications_() {
  var sheet = getNotificationSheet_();
  if (!sheet) return [];
  return getSheetRowsAsObjects_(sheet).map(normalizeNotification_);
}

function notificationsList_(query) {
  var filter = trim_(query.filter || "all");
  var search = trim_(query.search || "").toLowerCase();
  var page = Math.max(1, toNumber_(query.page || 1));
  var pageSize = Math.min(200, Math.max(1, toNumber_(query.pageSize || 50)));

  var all = getAllNotifications_();
  var list = all.filter(function (item) {
    if (filter === "unread" && item.read) return false;
    if (filter === "starred" && !item.starred) return false;
    if (search) {
      var haystack =
        (item.subject + " " + item.message + " " + item.from).toLowerCase();
      if (haystack.indexOf(search) === -1) return false;
    }
    return true;
  });

  list.sort(function (a, b) {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  var total = list.length;
  var unreadCount = all.filter(function (n) {
    return !n.read;
  }).length;
  var start = (page - 1) * pageSize;
  var items = list.slice(start, start + pageSize);

  return {
    data: {
      items: items,
      total: total,
      unreadCount: unreadCount,
      page: page,
      pageSize: pageSize,
    },
  };
}

function notificationsCreate_(payload) {
  ensureNotificationSheet_();

  var subject = trim_(payload.subject || "");
  if (!subject) throw new Error("subject is required");

  var now = nowIso_();
  var item = normalizeNotification_({
    id: Utilities.getUuid(),
    type: payload.type || "reminder",
    subject: subject,
    message: payload.message || "",
    from: payload.from || "Taskify System",
    timestamp: payload.timestamp || now,
    read: payload.read === true,
    starred: payload.starred === true,
    priority: payload.priority || "normal",
    relatedTaskId: payload.relatedTaskId || "",
    createdAt: now,
    updatedAt: now,
  });

  var sheet = getNotificationSheet_();
  appendObjectRow_(sheet, CORE_HEADERS.notifications, item);

  return { data: item };
}

function notificationsMarkRead_(payload) {
  var id = trim_(payload.id || "");
  if (!id) throw new Error("id is required");
  var read = payload.read !== false;
  return notificationsUpdateById_(id, { read: read, updatedAt: nowIso_() });
}

function notificationsToggleStar_(payload) {
  var id = trim_(payload.id || "");
  if (!id) throw new Error("id is required");

  var sheet = getNotificationSheet_();
  if (!sheet) throw new Error("notification sheet not found");

  var rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex < 0) throw new Error("notification not found");

  var headers = CORE_HEADERS.notifications;
  var row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var current = normalizeNotification_(rowToObjectByHeaders_(headers, row));

  return notificationsUpdateById_(id, {
    starred: !current.starred,
    updatedAt: nowIso_(),
  });
}

function notificationsDelete_(payload) {
  var id = trim_(payload.id || "");
  if (!id) throw new Error("id is required");

  var sheet = getNotificationSheet_();
  if (!sheet) throw new Error("notification sheet not found");

  var rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex < 0) throw new Error("notification not found");

  sheet.deleteRow(rowIndex);
  return { data: { success: true, id: id } };
}

function notificationsMarkAllRead_() {
  var sheet = getNotificationSheet_();
  if (!sheet) return { data: { updatedCount: 0 } };

  var headers = CORE_HEADERS.notifications;
  var readIndex = headers.indexOf("read");
  var updatedAtIndex = headers.indexOf("updatedAt");
  if (readIndex < 0 || updatedAtIndex < 0) {
    throw new Error("Invalid notification schema");
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { data: { updatedCount: 0 } };

  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var updatedCount = 0;
  var now = nowIso_();

  for (var i = 0; i < values.length; i++) {
    if (!toBoolean_(values[i][readIndex], false)) {
      values[i][readIndex] = true;
      values[i][updatedAtIndex] = now;
      updatedCount += 1;
    }
  }

  if (updatedCount > 0) {
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }

  return { data: { updatedCount: updatedCount } };
}

function notificationsUpdateById_(id, patch) {
  var sheet = getNotificationSheet_();
  if (!sheet) throw new Error("notification sheet not found");

  var rowIndex = findRowIndexById_(sheet, id);
  if (rowIndex < 0) throw new Error("notification not found");

  var headers = CORE_HEADERS.notifications;
  var row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  var current = normalizeNotification_(rowToObjectByHeaders_(headers, row));

  var merged = normalizeNotification_(mergeObjects_(current, patch));
  writeObjectToRow_(sheet, rowIndex, headers, merged);

  return { data: merged };
}

function normalizeFinance_(item) {
  var type = String(item.type || "expense");
  if (type !== "income" && type !== "expense") type = "expense";

  return {
    id: trim_(item.id),
    date: dateToYmd_(item.date),
    category: String(item.category || ""),
    type: type,
    amount: toNumber_(item.amount),
    note: String(item.note || ""),
    createdAt: valueToIso_(item.createdAt),
    updatedAt: valueToIso_(item.updatedAt),
  };
}

function getFinanceSheet_() {
  return getSpreadsheet_().getSheetByName(CORE_SHEETS.finance);
}

function ensureFinanceSheet_() {
  return ensureSheetWithHeaders_(CORE_SHEETS.finance, CORE_HEADERS.finance);
}

function getAllFinance_() {
  var sheet = getFinanceSheet_();
  if (!sheet) return [];

  return getSheetRowsAsObjects_(sheet)
    .map(normalizeFinance_)
    .filter(function (item) {
      return item.id;
    });
}

function filterFinance_(list, query) {
  var type = trim_(query.type || "");
  var search = trim_(query.search || "").toLowerCase();
  var from = trim_(query.from || "");
  var to = trim_(query.to || "");

  return list.filter(function (item) {
    if (type && type !== "all" && item.type !== type) return false;
    if (from && item.date < from) return false;
    if (to && item.date > to) return false;
    if (search) {
      var haystack = (item.category + " " + item.note).toLowerCase();
      if (haystack.indexOf(search) === -1) return false;
    }
    return true;
  });
}

function financeList_(query) {
  var list = filterFinance_(getAllFinance_(), query).sort(function (a, b) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  var page = Math.max(1, toNumber_(query.page || 1));
  var pageSize = Math.min(200, Math.max(1, toNumber_(query.pageSize || 100)));
  var total = list.length;
  var start = (page - 1) * pageSize;
  var items = list.slice(start, start + pageSize);

  return {
    data: {
      items: items,
      total: total,
      page: page,
      pageSize: pageSize,
    },
  };
}

function financeCreate_(payload) {
  ensureFinanceSheet_();

  var date = trim_(payload.date || "");
  var category = trim_(payload.category || "");
  if (!date) throw new Error("date is required");
  if (!category) throw new Error("category is required");

  var now = nowIso_();
  var item = normalizeFinance_({
    id: Utilities.getUuid(),
    date: date,
    category: category,
    type: payload.type || "expense",
    amount: payload.amount,
    note: payload.note || "",
    createdAt: now,
    updatedAt: now,
  });

  var sheet = getFinanceSheet_();
  appendObjectRow_(sheet, CORE_HEADERS.finance, item);

  return { data: item };
}

function financeSummary_(query) {
  var list = filterFinance_(getAllFinance_(), query);
  var totalIncome = 0;
  var totalExpense = 0;
  var expenseByCategory = {};

  list.forEach(function (item) {
    if (item.type === "income") totalIncome += item.amount;
    if (item.type === "expense") {
      totalExpense += item.amount;
      expenseByCategory[item.category] =
        (expenseByCategory[item.category] || 0) + item.amount;
    }
  });

  var topCategory = "";
  var topAmount = 0;
  for (var key in expenseByCategory) {
    if (expenseByCategory[key] > topAmount) {
      topCategory = key;
      topAmount = expenseByCategory[key];
    }
  }

  return {
    data: {
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      balance: totalIncome - totalExpense,
      topCategory: topCategory || "None",
      topAmount: topAmount,
    },
  };
}

function financeByCategory_(query) {
  var list = filterFinance_(getAllFinance_(), query);
  var expenseByCategory = {};

  list.forEach(function (item) {
    if (item.type !== "expense") return;
    expenseByCategory[item.category] =
      (expenseByCategory[item.category] || 0) + item.amount;
  });

  var items = [];
  for (var key in expenseByCategory) {
    items.push({ name: key, value: expenseByCategory[key] });
  }
  items.sort(function (a, b) {
    return b.value - a.value;
  });

  return { data: { items: items } };
}

function sheetsList_() {
  var ss = getSpreadsheet_();
  var names = ss.getSheets().map(function (sheet) {
    return sheet.getName();
  });
  return { data: { sheetNames: names } };
}

function sheetsHeaders_(query) {
  var sheetName = trim_(query.sheetName || "");
  if (!sheetName) throw new Error("sheetName is required");

  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error("sheet not found");

  var headers = getSheetHeaders_(sheet).filter(function (h) {
    return !!h;
  });
  return { data: { headers: headers, sheetName: sheetName } };
}

function sheetsAppend_(payload) {
  var sheetName = trim_(payload.sheetName || "");
  if (!sheetName) throw new Error("sheetName is required");

  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error("sheet not found");

  var headers = getSheetHeaders_(sheet).filter(function (h) {
    return !!h;
  });
  var rowData = payload.rowData || {};

  if (!headers.length) {
    if (isObject_(rowData)) {
      headers = Object.keys(rowData);
      if (!headers.length) throw new Error("rowData is empty");
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      throw new Error("sheet has no headers");
    }
  }

  var row;
  if (Array.isArray(rowData)) {
    row = rowData;
  } else {
    row = headers.map(function (header) {
      if (!Object.prototype.hasOwnProperty.call(rowData, header)) return "";
      return rowData[header];
    });
  }

  if (row.length < headers.length) {
    while (row.length < headers.length) row.push("");
  }

  sheet.appendRow(row.slice(0, headers.length));
  return {
    data: {
      success: true,
      sheetName: sheetName,
      rowNumber: sheet.getLastRow(),
    },
  };
}

function sheetsCreate_(payload) {
  var sheetName = trim_(payload.sheetName || "");
  var headers = payload.headers || [];

  if (!sheetName) throw new Error("sheetName is required");
  if (!Array.isArray(headers) || !headers.length) {
    throw new Error("headers must be a non-empty array");
  }

  var cleanedHeaders = headers
    .map(function (h) {
      return trim_(h);
    })
    .filter(function (h) {
      return !!h;
    });

  if (!cleanedHeaders.length) throw new Error("headers are empty");

  var ss = getSpreadsheet_();
  if (ss.getSheetByName(sheetName)) {
    throw new Error("sheet already exists");
  }

  var sheet = ss.insertSheet(sheetName);
  sheet.getRange(1, 1, 1, cleanedHeaders.length).setValues([cleanedHeaders]);

  return {
    data: {
      success: true,
      sheetName: sheetName,
      headers: cleanedHeaders,
    },
  };
}

function jsonSuccess_(data, meta) {
  var payload = {
    success: true,
    data: data || null,
    error: null,
    meta: meta || {},
  };
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function jsonError_(status, message, code) {
  var payload = {
    success: false,
    data: null,
    error: {
      status: status,
      code: code || "UNKNOWN",
      message: message || "Unexpected error",
    },
    meta: {},
  };
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
