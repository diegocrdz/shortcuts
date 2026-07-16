/*
 * Scan and detect Riot launcher and games on the system
 */

use crate::shortcuts::{game_shortcut, launcher_shortcut, Shortcut, SOURCE_RIOT};
use std::env;
use std::path::PathBuf;

fn riot_roots() -> Vec<PathBuf> {
    let mut roots = vec![PathBuf::from(r"C:\Riot Games")];

    for env_var in ["PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"] {
        if let Ok(value) = env::var(env_var) {
            roots.push(PathBuf::from(value).join("Riot Games"));
        }
    }

    roots
}

fn first_existing(paths: Vec<PathBuf>) -> Option<PathBuf> {
    paths.into_iter().find(|path| path.exists())
}

fn riot_client_paths() -> Vec<PathBuf> {
    riot_roots()
        .into_iter()
        .map(|root| root.join("Riot Client").join("RiotClientServices.exe"))
        .collect()
}

fn riot_game_paths() -> Vec<(String, Vec<PathBuf>)> {
    let roots = riot_roots();

    vec![
        (
            "League of Legends".to_string(),
            roots
                .iter()
                .map(|root| root.join("League of Legends").join("LeagueClient.exe"))
                .collect(),
        ),
        (
            "VALORANT".to_string(),
            roots
                .iter()
                .map(|root| root.join("VALORANT").join("live").join("VALORANT.exe"))
                .collect(),
        ),
        (
            "Legends of Runeterra".to_string(),
            roots
                .iter()
                .map(|root| root.join("Legends of Runeterra").join("live").join("Game").join("Game.exe"))
                .collect(),
        ),
    ]
}

pub fn scan_riot() -> Vec<Shortcut> {
    let mut results = Vec::new();

    if let Some(launcher) = first_existing(riot_client_paths()) {
        results.push(launcher_shortcut(
            "launcher-riot",
            "Riot Client",
            launcher.to_string_lossy().to_string(),
            SOURCE_RIOT,
        ));
    }

    for (name, candidates) in riot_game_paths() {
        if let Some(exe) = first_existing(candidates) {
            results.push(game_shortcut(
                format!("riot-{}", name.to_lowercase().replace(' ', "-")),
                name,
                exe.to_string_lossy().to_string(),
                SOURCE_RIOT,
            ));
        }
    }

    results
}