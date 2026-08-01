/*
 * Detect installed Windows programs by scanning Start Menu shortcuts (.lnk),
 * so the user can add any of them as a shortcut with a single click.
 */

use crate::shortcuts::extract_icon_from_exe;
use lnk::ShellLink;
use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::collections::HashSet;
use std::env;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use tauri::AppHandle;

// Keywords that mark a shortcut as "noise" rather than an actual program the
// user would want to launch (uninstallers, readmes, web links bundled
// alongside the real app in the same Start Menu folder, etc.)
const EXCLUDE_KEYWORDS: &[&str] = &[
    "uninstall",
    "unins000",
    "readme",
    "license",
    "eula",
    "documentation",
    "help",
    "on the web",
    "website",
    "support",
    "changelog",
    "faq",
];

#[derive(Debug, Serialize, Clone)]
pub struct InstalledProgram {
    pub id: String,
    pub name: String,
    pub target: String,
    pub args: Option<String>,
    pub icon_path: Option<String>,
}

// Get the two Start Menu "Programs" directories: all-users and current-user.
fn start_menu_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    if let Ok(program_data) = env::var("ProgramData") {
        dirs.push(PathBuf::from(program_data).join(r"Microsoft\Windows\Start Menu\Programs"));
    }
    if let Ok(app_data) = env::var("APPDATA") {
        dirs.push(PathBuf::from(app_data).join(r"Microsoft\Windows\Start Menu\Programs"));
    }

    dirs.into_iter().filter(|d| d.exists()).collect()
}

// Recursively collect every .lnk file under a directory
fn collect_lnk_files(dir: &Path, results: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_lnk_files(&path, results);
        } else if path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case("lnk"))
            .unwrap_or(false)
        {
            results.push(path);
        }
    }
}

// Check if a program name looks like noise (uninstaller, readme, web link, etc.)
fn is_noise(name: &str) -> bool {
    let lower = name.to_lowercase();
    EXCLUDE_KEYWORDS.iter().any(|kw| lower.contains(kw))
}

// Generate a stable id from the lnk path,
// so that the same program will always have the same id across scans.
fn stable_id(lnk_path: &Path) -> String {
    let mut hasher = DefaultHasher::new();
    lnk_path.to_string_lossy().to_lowercase().hash(&mut hasher);
    format!("installed-{:x}", hasher.finish())
}

// Resolve a single .lnk file into (name, target, args), if it points to a
// valid, existing .exe.
fn resolve_lnk(path: &Path) -> Option<(String, String, Option<String>)> {
    let shortcut = ShellLink::open(path, lnk::encoding::WINDOWS_1252).ok()?;

    let target = shortcut.link_target()?;
    if !target.to_lowercase().ends_with(".exe") {
        return None;
    }
    if !Path::new(&target).exists() {
        return None;
    }

    let name = path.file_stem()?.to_str()?.to_string();
    if is_noise(&name) {
        return None;
    }

    let args = shortcut.string_data().command_line_arguments().clone();

    Some((name, target, args))
}

// Scan Start Menu shortcuts and return the list of installed programs
// detected, deduplicated by (name, target).
#[tauri::command]
pub fn list_installed_programs(app: AppHandle) -> Vec<InstalledProgram> {
    let mut lnk_paths = Vec::new();
    for dir in start_menu_dirs() {
        collect_lnk_files(&dir, &mut lnk_paths);
    }

    let mut seen: HashSet<(String, String)> = HashSet::new();
    let mut results = Vec::new();

    for lnk_path in lnk_paths {
        let Some((name, target, args)) = resolve_lnk(&lnk_path) else {
            continue;
        };

        let dedup_key = (name.to_lowercase(), target.to_lowercase());
        if !seen.insert(dedup_key) {
            continue;
        }

        let id = stable_id(&lnk_path);

        // Skip re-extracting the icon if we already cached it from a
        // previous scan.
        let icon_path = crate::shortcuts::icons_dir(&app)
            .map(|dir| dir.join(format!("{}.png", id)))
            .filter(|p| p.exists())
            .map(|p| p.to_string_lossy().to_string())
            .or_else(|| extract_icon_from_exe(&app, &target, &id));

        results.push(InstalledProgram {
            id,
            name,
            target,
            args,
            icon_path,
        });
    }

    results.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    results
}
