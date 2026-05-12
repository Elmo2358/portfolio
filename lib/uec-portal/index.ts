// UECポータル連携メインモジュール

export { loginToUecPortal, manualLogin, checkLoginStatus } from "./login";
export { fetchAllUecData, extractNotices, extractSchedule, extractTimetable } from "./scraper";
export { saveSession, loadSession, sessionExists, deleteSession } from "./session";

export type { LoginCredentials, LoginResult } from "./login";
export type { UecNotice, UecScheduleEntry, UecTimetableEntry } from "./scraper";
export type { SessionMeta } from "./session";
