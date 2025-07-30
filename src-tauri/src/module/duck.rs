use crate::cmd::CmdResult;
use crate::config::{Config, IVerge};
use crate::core::handle;
use crate::feat;
use crate::process::AsyncHandler;
use crate::utils::help;
use anyhow::Result;
use reqwest_dav::re_exports::serde::{Deserialize, Serialize};
use std::fmt;
use tauri::Emitter;
use tauri_plugin_clipboard_manager::ClipboardExt;

pub const DUCK_CONFIG: &str = "duck.yaml";

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
    fn is(&self, mode: ConnectionMode) -> bool {
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
** Events
**/
const EVENT_CHANGE_CONNECTION_STATE: &str = "duck:change_connection_state";

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
    Ok(mode)
}

pub fn toggle_connection() {
    let app_handle = handle::Handle::global().app_handle().unwrap();
    let verge = Config::verge().latest_ref().clone();
    let connection_mode = get_connection_mode().unwrap();

    let system_proxy = verge.enable_system_proxy.as_ref().unwrap_or(&false);
    let tun_mode = verge.enable_tun_mode.as_ref().unwrap_or(&false);

    let is_connected = *system_proxy || *tun_mode;

    let is_combined = connection_mode.is(ConnectionMode::Combine);

    if !is_connected {
        app_handle
            .emit(EVENT_CHANGE_CONNECTION_STATE, "connecting")
            .ok();
    }

    AsyncHandler::spawn(async move || {
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
                handle::Handle::refresh_verge();
                app_handle
                    .emit(
                        EVENT_CHANGE_CONNECTION_STATE,
                        match is_connected {
                            true => "disconnected",
                            false => "connected",
                        },
                    )
                    .ok();
            }
            Err(err) => log::error!(target: "app", "{err}"),
        }
    });
}
