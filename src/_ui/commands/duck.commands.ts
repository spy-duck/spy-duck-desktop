import { invoke } from "@tauri-apps/api/core";
import { TConnectionMode } from "@ui/types";

export const getConnectionModeCommand = (): Promise<TConnectionMode> =>
  invoke<TConnectionMode>("get_connection_mode");

export const setConnectionModeCommand = (
  mode: TConnectionMode,
): Promise<TConnectionMode> =>
  invoke<TConnectionMode>("set_connection_mode", { mode });

export const toggleConnectionCommand = (): Promise<void> =>
  invoke<void>("toggle_connection");

export const setCurrentProxyCommand = (
  group: string,
  proxy: string,
): Promise<void> =>
  invoke<void>("set_current_proxy", {
    group,
    proxy,
  });
