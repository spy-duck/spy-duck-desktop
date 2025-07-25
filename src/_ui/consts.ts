export const IS_DEV_MODE = import.meta.env.MODE === "development";

export const FORMAT = {
  DATETIME: "DD.MM.YYYY HH:mm",
  DATETIME_FULL: "DD.MM.YYYY HH:mm:ss",
  DATE: "DD.MM.YYYY",
  TIME: "HH:mm",
};

export const STORAGE_ACCESS_TOKEN = "access-token";
export const STORAGE_IS_PROXIES_INIT = "is-proxies-init";
export const STORAGE_KEY_GROUP = "clash-verge-selected-proxy-group";
export const STORAGE_KEY_PROXY = "clash-verge-selected-proxy";

export const DEV_URLS = [
  "tauri://localhost",
  "http://tauri.localhost",
  "http://localhost:3000",
];
