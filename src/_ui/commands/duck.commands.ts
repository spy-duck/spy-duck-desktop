import { invoke } from "@tauri-apps/api/core";

export type TConnectionMode = "system" | "tun" | "combine";
export const getConnectionMode = () =>
  invoke<TConnectionMode>("get_connection_mode");

export const setConnectionMode = (mode: TConnectionMode) =>
  invoke<TConnectionMode>("set_connection_mode", { mode });
