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