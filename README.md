# Shortcuts

![Banner](/docs/banner.png)

A Windows desktop app that brings all your games and launchers together in one place. It automatically syncs your library from Steam, Epic Games, and Riot Client, and lets you organize everything with custom categories and tags so you can find and launch anything in seconds.

## Features

- **Automatic library sync** from Steam, Epic Games, and Riot Client.
- **Manual shortcuts** — add any `.exe` or shortcut you want quick access to.
- **Custom categories** with icons, reorderable via drag and drop.
- **Tags** for cross-cutting classification, also reorderable.
- **Favorites** for quick access to what you use most.
- **Instant search** by name.
- **Multi-select** to reassign category or delete multiple shortcuts at once.
- **Multi-language support** (English / Spanish).
- **Guided onboarding** the first time you open the app.

## Download

You can download the latest version from the [Releases](../../releases) section of this repository.

1. Go to [Releases](../../releases).
2. Download the latest installer (`.msi` or `.exe`, depending on the available build).
3. Run the installer and follow the steps.
4. Open **Shortcuts** from the Start menu.

> Requirements: Windows 10/11. The app is built on Tauri, so the installer is lightweight (no bundled Electron/Chromium required).

## Usage

- The first time you open the app, a welcome wizard walks you through syncing your library.
- Use the refresh icon in the bottom bar to re-sync whenever you install new games.
- Right-click any shortcut to mark it as a favorite, assign tags, change its category, or delete it.
- Drag categories and tags to reorder them to your liking.

## Development

This project is built with:

- [Tauri](https://tauri.app/) — native desktop shell
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [react-i18next](https://react.i18next.com/) for internationalization
- [dnd-kit](https://dndkit.com/) for drag and drop

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/tools/install) and the Tauri toolchain
- See [Tauri's prerequisites](https://tauri.app/start/prerequisites/) for your operating system

### Installation

```bash
git clone https://github.com/diegocrdz/shortcuts.git
cd shortcuts
npm install
```

### Run in development mode

```bash
npm run tauri:dev
```

### Build for production

```bash
npm run tauri build
```

The generated installer will be located in `src-tauri/target/release/bundle/`.

## Project structure

```
├── src/                     # Frontend (React + TypeScript)
│   ├── components/          # UI components
│   ├── pages/               # Dashboard, Onboarding, Settings
│   ├── lib/api/             # invoke() wrappers to the backend
│   └── contexts/            # React contexts (Settings, etc.)
├── src-tauri/               # Backend (Rust)
│   └── src/
│       ├── shortcuts.rs     # Shortcut logic
│       ├── categories.rs    # Category logic
│       ├── tags.rs          # Tag logic
│       └── settings.rs      # Settings and onboarding
└── public/locales/          # Translation files
```

## Contributing

Contributions are welcome. If you want to report a bug or suggest an improvement, open an [issue](../../issues). For code changes, fork the repo, create a descriptive branch, and open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).