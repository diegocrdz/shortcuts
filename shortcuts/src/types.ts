/**
 * Types definition to use across the application.
 */

export type Theme = "light" | "dark" | "system";

export interface Shortcut {
  id: string;
  name: string;
  target: string;
  icon_path?: string | null;
  args?: string | null;
  source: string;
  is_favorite: boolean;
  tags: string[];
  category: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  deletable: boolean;
}

export interface Settings {
  theme: Theme;
  language: string; // "en" | "es"
  update_interval: number; // hours between automatic sync with game launchers
  position: string; // "bottom-center" | "bottom-left" | "center"
  show_onboarding: boolean; // Show onboarding screen on first launch
}
