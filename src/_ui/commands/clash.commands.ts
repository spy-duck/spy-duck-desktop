import { invoke } from "@tauri-apps/api/core";

export const forceUpdateProxiesCommand = () => invoke("force_refresh_proxies");
