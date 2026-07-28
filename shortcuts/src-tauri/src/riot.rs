/*
 * Scan and detect Riot launcher and games on the system
 */

use crate::shortcuts::{game_shortcut, launcher_shortcut, extract_icon_from_exe, Shortcut, SOURCE_RIOT};
use crate::utilities::find_install_location_from_uninstall;
use serde::Deserialize;
use std::env;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

// Structure of C:\ProgramData\Riot Games\RiotClientInstalls.json
// Written by the Riot Client itself, so it reflects the real install
// location regardless of where the user chose to install (unlike guessing
// common directories).
#[derive(Debug, Deserialize)]
struct RiotClientInstalls {
    rc_default: Option<String>,
    rc_live: Option<String>,
    rc_beta: Option<String>,
}

// Structure of ProgramData\Riot Games\Metadata\<product>.live\<product>.live.product_settings.yaml
// Written per-product, also reflects the real install location.
#[derive(Debug, Deserialize)]
struct ProductSettings {
    product_install_full_path: Option<String>,
}

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

// Get the paths to the Riot Client executable in possible installation directories (fallback)
fn riot_client_paths() -> Vec<PathBuf> {
    riot_roots()
        .into_iter()
        .map(|root| root.join("Riot Client").join("RiotClientServices.exe"))
        .collect()
}

// ProgramData\Riot Games, resolved via the environment variable instead of
// hardcoding C:\ProgramData
fn riot_program_data_dir() -> Option<PathBuf> {
    let program_data = env::var("ProgramData").ok()?;
    Some(PathBuf::from(program_data).join("Riot Games"))
}

// Read and parse RiotClientInstalls.json
fn riot_client_installs() -> Option<RiotClientInstalls> {
    let path = riot_program_data_dir()?.join("RiotClientInstalls.json");
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

// Get the real RiotClientServices.exe path from RiotClientInstalls.json,
// preferring the live channel.
fn riot_client_exe_from_installs() -> Option<PathBuf> {
    let installs = riot_client_installs()?;
    let candidate = installs.rc_live.or(installs.rc_default).or(installs.rc_beta)?;
    // Riot stores paths with forward slashes (e.g. "C:/Riot Games/Riot Client/...").
    // PathBuf::exists() tolerates that fine, but some Win32 APIs used downstream
    // (icon extraction) do not resolve them correctly, so normalize here.
    let normalized = candidate.replace('/', "\\");
    let path = PathBuf::from(normalized);
    if path.exists() { Some(path) } else { None }
}

// Get a product's real install directory from its product_settings.yaml metadata file.
// `product_id` matches the folder/patchline naming Riot uses internally
// (e.g. "valorant", "league_of_legends").
fn product_install_dir(product_id: &str) -> Option<PathBuf> {
    let base = riot_program_data_dir()?;
    let yaml_path = base
        .join("Metadata")
        .join(format!("{}.live", product_id))
        .join(format!("{}.live.product_settings.yaml", product_id));

    let content = fs::read_to_string(&yaml_path).ok()?;
    let settings: ProductSettings = serde_yaml::from_str(&content).ok()?;
    settings
        .product_install_full_path
        .map(|p| PathBuf::from(p.replace('/', "\\")))
}

// Scan for Riot Client and games, returning a list of detected shortcuts
pub fn scan_riot(app: &AppHandle, excluded_ids: &HashSet<String>) -> Vec<Shortcut> {
    let mut results = Vec::new();

    // Launcher: prefer RiotClientInstalls.json (most reliable, always written by
    // the client itself); then the Windows uninstall registry (only written if
    // the user kept "create shortcuts" enabled during install, so it's a weaker
    // signal); finally fall back to guessed common roots.
    let client_path = riot_client_exe_from_installs()
        .or_else(|| {
            find_install_location_from_uninstall("Riot Client")
                .map(|base| base.join("RiotClientServices.exe"))
                .filter(|p| p.exists())
        })
        .or_else(|| first_existing(riot_client_paths()));

    if let Some(launcher) = &client_path {
        let mut shortcut = launcher_shortcut("launcher-riot", "Riot Client", launcher.to_string_lossy().to_string(), SOURCE_RIOT);
        shortcut.icon_path = extract_icon_from_exe(app, &shortcut.target, &shortcut.id);
        results.push(shortcut);
    }

    // Define the Riot games that should be started through the Riot Client.
    // relative_exe is joined onto the install dir found via product_settings.yaml;
    // fallback_candidates are used if that metadata file isn't found.
    let riot_products: Vec<(&str, &str, &str, Vec<PathBuf>)> = vec![
        (
            "VALORANT",
            "valorant",
            "live/VALORANT.exe",
            riot_roots().iter().map(|r| r.join("VALORANT").join("live").join("VALORANT.exe")).collect(),
        ),
        (
            "League of Legends",
            "league_of_legends",
            "LeagueClient.exe",
            riot_roots().iter().map(|r| r.join("League of Legends").join("LeagueClient.exe")).collect(),
        ),
    ];

    // For each Riot game, if the executable exists, create a shortcut
    for (name, patchline_id, relative_exe, fallback_candidates) in riot_products {
        let id = format!("riot-{}", name.to_lowercase().replace(' ', "-"));
        if excluded_ids.contains(&id) { continue; } // Skip excluded shortcuts

        let exe = product_install_dir(patchline_id)
            .map(|install_dir| install_dir.join(relative_exe))
            .filter(|p| p.exists())
            .or_else(|| first_existing(fallback_candidates));

        if let Some(exe) = exe {
            if let Some(client) = &client_path {
                let mut shortcut = game_shortcut(
                    id,
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

    // Legends of Runeterra doesn't use Vanguard, so we can launch it directly
    // if the executable exists.
    if !excluded_ids.contains("riot-legends-of-runeterra") {
        if let Some(exe) = first_existing(
            riot_roots().iter().map(|r| r.join("Legends of Runeterra").join("LegendsOfRuneterra.exe")).collect(),
        ) {
            results.push(game_shortcut(
                "riot-legends-of-runeterra",
                "Legends of Runeterra",
                exe.to_string_lossy().to_string(),
                SOURCE_RIOT,
            ));
        }
    }

    results
}