# League Asset Vault

A standalone Windows desktop application designed for video editors, streamers, and motion designers. It serves as a high-resolution asset library for League of Legends champion and item icons, integrating Riot Games' Data Dragon CDN, native Windows OLE file drag-and-drop (CF_HDROP), and an on-device waifu2x-ncnn-vulkan neural super-resolution pipeline.

---

## Overview

Video editing and compositing suites such as Adobe Premiere Pro, Adobe After Effects, and DaVinci Resolve cannot import browser image payloads or web URLs dragged from standard web applications. They strictly listen for the native Windows clipboard format `CF_HDROP`, which requires a physical, validated file path on the local disk.

League Asset Vault solves this workflow bottleneck. It fetches official game assets directly from Riot Games' static CDN, runs offline AI super-resolution using waifu2x CU-Net to upscale low-resolution icons (64x64 items and 128x128 champions) up to 4x Ultra-HD with noise elimination, caches them on disk, and initiates native OS drag payloads directly into editing software timelines.

---

## Key Features

### 1. Official Riot Games Data Dragon Ingestion
- Fetches active and legacy game versions dynamically from `https://ddragon.leagueoflegends.com/api/versions.json`.
- Ingests full metadata manifests for Champions (170+ entries) and Items (860+ entries).
- Downloads icon assets on demand from Riot CDN to local disk storage; operates completely offline once cached.
- Zero web scraping and zero API keys required.

### 2. Native Windows OLE Drag-and-Drop (CF_HDROP)
- Dragging an asset card out of the window registers an authentic Win32 OLE `IDataObject` containing `CF_HDROP` (`DROPFILES`).
- Full compatibility with:
  - Adobe Premiere Pro
  - Adobe After Effects
  - Adobe Photoshop
  - DaVinci Resolve
  - Discord Desktop
  - Windows File Explorer

### 3. Native waifu2x-ncnn-vulkan Super-Resolution Engine
- Standalone Vulkan GPU-accelerated inference using the `models-cunet` (Artwork) model.
- Multi-level noise reduction controls:
  - Level 0 (None): Maximum line sharpness, preserves source texture.
  - Level 1 (Medium): Subtle denoising.
  - Level 2 (High): Strong denoising, eliminates standard compression artifacts.
  - Level 3 (Highest - Recommended): Maximum artifact elimination, producing vector-like flat illustration surfaces.
- Parameter-fingerprinted file naming prevents stale cache collisions:
  - `<assetId>_scale<scale>x_noise<noiseLevel>.png` (e.g. `3031_scale4x_noise3.png`).

### 4. Disk Cache Management
- Local cache path: `%APPDATA%\league-asset-vault\cache\`.
- Real-time disk usage calculation displayed in the application header.
- Safe cache purging: Deletes all generated upscaled files while preserving core configuration files (`versions.json`, manifest caches) and downloaded 1x originals.
- One-click button to open the cache directory in Windows Explorer.

### 5. High-Performance Virtualized User Interface
- React 19 with custom Hextech dark theme styling.
- Responsive chunked grid rendering 800+ assets at 60 FPS without UI stutter.
- Instant search filtering across names, titles, and item stats.
- Role and category tag filters (Fighter, Mage, Assassin, Tank, Marksman, Support, Boots, Damage, etc.).
- Side-by-side zoom inspector with live on-disk base64 preview and in-modal drag-to-timeline.

---

## Technology Stack

- **Desktop Framework**: Electron (v34)
- **Frontend Framework**: React (v19)
- **Build Tool / Bundler**: Vite (v6)
- **Language**: TypeScript (v5)
- **Neural Inference Engine**: waifu2x-ncnn-vulkan (NCNN runtime with Vulkan GPU acceleration)
- **Icons**: Lucide React
- **Packaging**: electron-builder (v25)

---

## Project Structure

```
League-Images-Tool/
├── package.json               # Dependencies, build scripts, and extraResources configuration
├── tsconfig.json              # TypeScript configuration for the React renderer
├── tsconfig.electron.json     # TypeScript configuration for Electron Main and Preload
├── vite.config.ts             # Vite bundler configuration
├── .gitignore                 # Excluded build artifacts and node_modules
├── resources/
│   └── bin/
│       └── waifu2x/           # Bundled waifu2x-ncnn-vulkan binary, DLLs, and models-cunet
│
├── src/
│   ├── main/                  # Electron Main Process (Node.js runtime)
│   │   ├── index.ts           # Application lifecycle and window creation
│   │   ├── preload.ts         # Secure contextBridge IPC exposure
│   │   ├── upscaler.ts        # waifu2x child_process.execFile wrapper and path resolver
│   │   ├── ipc/
│   │   │   ├── dragHandler.ts     # Win32 CF_HDROP startDrag payload handler
│   │   │   ├── ddragonHandler.ts  # Data Dragon catalog and cache management IPC
│   │   │   └── upscalerHandler.ts # Single, batch, and inspect upscale IPC handlers
│   │   └── services/
│   │       ├── cacheManager.ts    # Recursive size calculator and cache cleaner
│   │       ├── ddragonService.ts  # Riot CDN fetcher and offline manifest store
│   │       ├── imageResampler.ts  # High-order Lanczos-3 fallback resampler
│   │       └── upscalerService.ts # Worker concurrency queue and data URL generator
│   │
│   ├── shared/                # Cross-process TypeScript contracts
│   │   ├── constants.ts       # Riot CDN endpoints, IPC channels, and filter tags
│   │   └── types.ts           # Asset interfaces, scale types, and IPC API definitions
│   │
│   └── renderer/              # Modern React 19 Frontend
│       ├── index.html         # Application HTML root
│       └── src/
│           ├── main.tsx       # React DOM mount
│           ├── App.tsx        # Master view, filtering logic, and state coordination
│           ├── components/
│           │   ├── Header.tsx        # Patch selector, scale toggle, composite cache control
│           │   ├── SearchFilter.tsx  # Tabs, search bar, and category pills
│           │   ├── AssetGrid.tsx     # Responsive virtualized asset grid
│           │   ├── AssetCard.tsx     # Asset card with drag listeners and quick zoom
│           │   ├── PreviewModal.tsx  # Side-by-side zoom modal with denoise selector
│           │   └── StatusBar.tsx     # Background worker progress bar and status indicator
│           └── styles/
│               └── index.css         # Custom Hextech design system stylesheet
```

---

## Installation and Setup

### Prerequisites
- Node.js (version 18 or higher; tested on Node.js v24)
- npm (version 9 or higher)
- Windows 10 or Windows 11 (64-bit)
- Dedicated or integrated GPU supporting Vulkan (AMD, NVIDIA, or Intel)

### 1. Clone the Repository
```bash
git clone https://github.com/ssprata/league-asset-vault.git
cd league-asset-vault
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode
Starts the Vite dev server with Hot Module Replacement (HMR) and launches the Electron application:
```bash
npm run dev
```

### 4. Build Standalone Executable
To generate an unpacked Windows directory containing the runnable `.exe`:
```bash
npm run package:dir
```
The output will be placed in:
`release/win-unpacked/League Asset Vault.exe`

To compile the full standalone installer and portable `.exe`:
```bash
npm run build
```

---

## How It Works

### Native CF_HDROP Drag Pipeline
1. The user initiates a drag gesture on an asset card or from inside the Inspect Modal.
2. The renderer suppresses the browser default drag event (`e.preventDefault()`) and dispatches a request to the main process via `window.electronAPI.startDrag({ assetId, assetType, scale, noiseLevel })`.
3. The main process verifies that the fingerprinted asset exists in `%APPDATA%\league-asset-vault\cache\`. If not, it executes waifu2x to generate the file on disk.
4. Electron's `event.sender.startDrag()` initiates the Windows COM `DoDragDrop` routine, supplying a `CF_HDROP` payload containing the absolute file path on disk.
5. External applications (Adobe Premiere Pro, Photoshop, DaVinci Resolve) accept the drop event as an authentic local file import.

### Super-Resolution Pipeline
- The engine uses `waifu2x-ncnn-vulkan` with the `models-cunet` model.
- CLI execution arguments:
  `-i <input_path> -o <output_path> -s <scale> -n <noise_level> -m <model_dir> -f png`
- Concurrency limiting ensures multiple simultaneous upscale requests do not saturate GPU memory.
- If Vulkan hardware is unavailable, the service automatically falls back to an integrated separable Lanczos-3 resampler with unsharp mask sharpening.

---

## Legal and Attributions

- **Riot Games**: League Asset Vault is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
- **waifu2x-ncnn-vulkan**: Created by nihui and contributors under the MIT License.
- **Application License**: This project is licensed under the MIT License.
