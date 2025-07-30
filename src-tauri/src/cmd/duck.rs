use crate::cmd::CmdResult;
use crate::module::duck;

#[tauri::command]
pub fn get_connection_mode() -> CmdResult<String> {
    Ok(duck::get_connection_mode()
        .unwrap()
        .to_string()
        .to_lowercase())
}

#[tauri::command]
pub async fn set_connection_mode(mode: String) -> CmdResult<String> {
    Ok(duck::set_connection_mode(mode)
        .unwrap()
        .to_string()
        .to_lowercase())
}
