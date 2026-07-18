/*
 * Scan and detect Riot launcher and games on the system
 */

use crate::shortcuts::{game_shortcut, launcher_shortcut, extract_icon_from_exe, Shortcut, SOURCE_RIOT};
use std::env;
use std::path::PathBuf;
use tauri::AppHandle;

// Get the possible root directories for Riot Games installations
fn riot_roots() -> Vec<PathBuf> {
    let mut roots = vec![PathBuf::from(r"C:\Riot Games")];

    for env_var in ["PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"] {
        if let Ok(value) = env::var(env_var) {
            roots.push(PathBuf::from(value).join("Riot Games"));
        }
    }

    roots
}

// Return the first existing path from a list of candidates
fn first_existing(paths: Vec<PathBuf>) -> Option<PathBuf> {
    paths.into_iter().find(|path| path.exists())
}

// Get the paths to the Riot Client executable in possible installation directories
fn riot_client_paths() -> Vec<PathBuf> {
    riot_roots()
        .into_iter()
        .map(|root| root.join("Riot Client").join("RiotClientServices.exe"))
        .collect()
}

// Scan for Riot Client and games, returning a list of detected shortcuts
pub fn scan_riot(app: &AppHandle) -> Vec<Shortcut> {
    let mut results = Vec::new();

    let client_path = first_existing(riot_client_paths());

    if let Some(launcher) = &client_path {
        let mut shortcut = launcher_shortcut("launcher-riot", "Riot Client", launcher.to_string_lossy().to_string(), SOURCE_RIOT);
        shortcut.icon_path = extract_icon_from_exe(app, &shortcut.target, &shortcut.id);
        results.push(shortcut);
    }

    // Define the Riot games that should be started through the Riot Client
    let riot_products: Vec<(&str, &str, Vec<PathBuf>)> = vec![
        ("VALORANT", "valorant", riot_roots().iter().map(|r| r.join("VALORANT").join("live").join("VALORANT.exe")).collect()),
        ("League of Legends", "league_of_legends", riot_roots().iter().map(|r| r.join("League of Legends").join("LeagueClient.exe")).collect()),
    ];

    // For each Riot game, if the executable exists, create a shortcut
    for (name, patchline_id, exe_candidates) in riot_products {
        if let Some(exe) = first_existing(exe_candidates) {
            if let Some(client) = &client_path {
                let mut shortcut = game_shortcut(
                    format!("riot-{}", name.to_lowercase().replace(' ', "-")),
                    name,
                    client.to_string_lossy().to_string(), // target = Riot Client
                    SOURCE_RIOT,
                );
                shortcut.args = Some(format!("--launch-product={} --launch-patchline=live", patchline_id));
                shortcut.icon_path = extract_icon_from_exe(app, &exe.to_string_lossy(), &shortcut.id);
                results.push(shortcut);
            }
        }
    }

    // Legends of Runeterra doesn't use Vanguard,
    // so we can launch it directly if the executable exists
    if let Some(exe) = first_existing(vec![
        // Check the default installation path for Legends of Runeterra
        riot_roots().iter().map(|r| r.join("Legends of Runeterra").join("LegendsOfRuneterra.exe")).collect(),
    ]) {
        results.push(game_shortcut(
            "riot-legends-of-runeterra",
            "Legends of Runeterra",
            exe.to_string_lossy().to_string(),
            SOURCE_RIOT,
        ));
    }

    results
}