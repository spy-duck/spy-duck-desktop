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
pub fn toggle_connection() -> CmdResult<()> {
    duck::toggle_connection().unwrap();
    Ok(())
}

#[tauri::command]
pub async fn set_connection_mode(mode: String) -> CmdResult<String> {
    Ok(duck::set_connection_mode(mode)
        .unwrap()
        .to_string()
        .to_lowercase())
}

#[tauri::command]
pub async fn set_current_proxy(group: String, proxy: String) -> CmdResult<()> {
    duck::set_current_proxy(group, proxy).await?;
    Ok(())
}
