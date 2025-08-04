use crate::config::{Config, IVerge};
use crate::core::{handle, service, tray};
use crate::feat;
use crate::module::mihomo::MihomoManager;
use crate::utils::help;
use anyhow::Result;
use reqwest_dav::re_exports::serde::{Deserialize, Serialize};
use serde_json::json;
use std::fmt;
use tauri::Emitter;
use urlencoding::encode;

pub const DUCK_CONFIG: &str = "duck.yaml";

/**
** Events
**/
const EVENT_CHANGE_CONNECTION_STATE: &str = "duck:change_connection_state";
const EVENT_CHANGE_CONNECTION_MODE: &str = "duck:change_connection_mode";
const EVENT_CHANGE_PROXY: &str = "duck:change_proxy";

fn send_event(event: &str, data: Option<serde_json::Value>) {
    let app_handle = handle::Handle::global().app_handle().unwrap();
    app_handle
        .emit(event, data)
        .unwrap_or_else(|e| log::error!(target: "app", "Failed to emit event: {e}"));
}

/**
** Connection mode
**/
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ConnectionMode {
    System,
    Tun,
    Combine,
}
impl ConnectionMode {
    pub fn is(&self, mode: ConnectionMode) -> bool {
        self.to_string() == mode.to_string()
    }
}
impl fmt::Display for ConnectionMode {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}
impl Default for ConnectionMode {
    fn default() -> Self {
        ConnectionMode::System
    }
}

/**
** Config
**/
#[derive(Default, Debug, Clone, Deserialize, Serialize)]
struct DuckConfig {
    connection_mode: ConnectionMode,
}
impl DuckConfig {
    fn template() -> Self {
        DuckConfig {
            connection_mode: ConnectionMode::default(),
        }
    }
}

fn read_from_config() -> Result<DuckConfig> {
    let config_path = crate::utils::dirs::app_home_dir()?.join(DUCK_CONFIG);
    let config =
        help::read_yaml::<DuckConfig>(&config_path).unwrap_or_else(|_| DuckConfig::template());
    Ok(config)
}

fn write_to_config(config: DuckConfig) -> Result<()> {
    let config_path = crate::utils::dirs::app_home_dir()?.join(DUCK_CONFIG);
    help::save_yaml(&config_path, &config, Some("# Duck Config"))?;
    Ok(())
}

/**
** Methods
**/
pub fn get_connection_mode() -> Result<ConnectionMode> {
    let duck_config = read_from_config()?;
    Ok(duck_config.connection_mode)
}

pub fn set_connection_mode(mode: String) -> Result<ConnectionMode> {
    let mode: ConnectionMode = match mode.as_str() {
        "system" => ConnectionMode::System,
        "tun" => ConnectionMode::Tun,
        "combine" => ConnectionMode::Combine,
        _ => ConnectionMode::System,
    };

    let mut duck_config = read_from_config()?;
    duck_config.connection_mode = mode.clone();
    write_to_config(duck_config)?;

    send_event(EVENT_CHANGE_CONNECTION_MODE, None);

    Ok(mode)
}

pub fn is_connected() -> bool {
    let verge = Config::verge().latest_ref().clone();
    let system_proxy = verge.enable_system_proxy.as_ref().unwrap_or(&false);
    let tun_mode = verge.enable_tun_mode.as_ref().unwrap_or(&false);

    *system_proxy || *tun_mode
}

async fn close_all_connections() {
    let manager = MihomoManager::global();
    match manager.close_all_connections().await {
        Ok(_) => {
            log::info!(target: "app", "Connections closed successfully");
        }
        Err(err) => {
            log::error!(target: "app", "Failed to close all connections: {err}");
        }
    }
}

pub fn toggle_connection() -> Result<()> {
    let connection_mode = get_connection_mode()?;

    let is_connected = is_connected();

    let is_combined = connection_mode.is(ConnectionMode::Combine);

    if !is_connected {
        send_event(
            EVENT_CHANGE_CONNECTION_STATE,
            Some(json!({"state": "connecting"})),
        );
    }

    tauri::async_runtime::spawn(async move {
        if connection_mode.is(ConnectionMode::Tun) || connection_mode.is(ConnectionMode::Combine) {
            let available = service::is_service_available().await;
            if available.is_err() {
                log::info!(target: "app", "Service is not available");

                if let Err(e) = service::install_service().await {
                    log::error!(target: "app", "Failed to install service: {e}");
                    return Err("Failed to install service");
                }
            }
        }

        match feat::patch_verge(
            IVerge {
                enable_tun_mode: Some(match is_connected {
                    true => false,
                    false => is_combined || connection_mode.is(ConnectionMode::Tun),
                }),
                enable_system_proxy: Some(match is_connected {
                    true => false,
                    false => is_combined || connection_mode.is(ConnectionMode::System),
                }),
                ..IVerge::default()
            },
            false,
        )
        .await
        {
            Ok(_) => {
                if is_connected {
                    close_all_connections().await;
                }
                handle::Handle::refresh_verge();
                send_event(
                    EVENT_CHANGE_CONNECTION_STATE,
                    Some(json!({
                        "state": match is_connected {
                            true => "disconnected",
                            false => "connected",
                        },
                    })),
                );
                Ok(())
            }
            Err(err) => {
                log::error!(target: "app", "{err}");
                Err("Failed to update verge")
            }
        }
    });
    Ok(())
}

pub fn disconnect() {
    send_event(
        EVENT_CHANGE_CONNECTION_STATE,
        Some(json!({"state": "connecting"})),
    );
    tauri::async_runtime::spawn(async move {
        if feat::patch_verge(
            IVerge {
                enable_tun_mode: Some(false),
                enable_system_proxy: Some(false),
                ..Default::default()
            },
            false,
        )
        .await
        .is_ok()
        {
            close_all_connections().await;
            handle::Handle::refresh_verge();
            send_event(
                EVENT_CHANGE_CONNECTION_STATE,
                Some(json!({
                    "state":"disconnected",
                })),
            );
        }
    });
}

#[derive(Debug)]
pub struct ProxySelector {
    pub name: String,
    pub current_proxy: String,
    pub proxies: Vec<String>,
}

pub async fn get_proxies_selector() -> Option<ProxySelector> {
    let manager = MihomoManager::global();
    if let Err(err) = manager.is_mihomo_running().await {
        log::error!(target: "app", "Mihomo is not running: {err}");
        return None;
    }

    let value = manager.get_providers_proxies().await.expect("fetch failed");

    if let Some(providers) = value.get("providers").and_then(|v| v.as_object()) {
        if let Some(proxy_provider) = providers.get("PROXY").and_then(|v| v.as_object()) {
            if let Some(proxies) = proxy_provider.get("proxies").and_then(|v| v.as_array()) {
                for proxy in proxies {
                    if let Some(proxy_type) = proxy.get("type").and_then(|v| v.as_str()) {
                        if proxy_type == "Selector" {
                            let name = proxy
                                .get("name")
                                .and_then(|v| v.as_str())
                                .unwrap_or_default()
                                .to_string();

                            let current_proxy = proxy
                                .get("now")
                                .and_then(|v| v.as_str())
                                .unwrap_or_default()
                                .to_string();

                            let proxies_list: Vec<String> = proxy
                                .get("all") // Use "all" for the array of proxies
                                .and_then(|v| v.as_array())
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str())
                                        .map(|s| s.to_string())
                                        .collect()
                                })
                                .unwrap_or_default();
                            return Some(ProxySelector {
                                name,
                                current_proxy,
                                proxies: proxies_list,
                            });
                        }
                    }
                }
            }
        }
    }
    log::error!(target: "app", "No selector found");
    None
}

pub async fn set_current_proxy(group: String, proxy: String) -> Result<(), String> {
    let manager = MihomoManager::global();
    log::info!(target: "app", "Setting current proxy: [{}] {}", encode(group.as_str()).to_string(), &proxy);

    match manager
        .set_proxy(encode(group.as_str()).to_string(), proxy.clone())
        .await
    {
        Ok(_) => {
            log::info!(target: "app", "Proxy set successfully");
            let _ = tray::Tray::global().update_menu();

            send_event(
                EVENT_CHANGE_PROXY,
                Some(json!({
                    "group": group,
                    "proxy": proxy,
                })),
            );

            if is_connected() {
                close_all_connections().await;
            }
            Ok(())
        }
        Err(err) => {
            log::error!(target: "app", "Failed to close all connections: {err}");
            Err(err)
        }
    }
}
