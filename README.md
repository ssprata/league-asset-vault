# League Asset Vault

A standalone Windows desktop application designed for video editors, streamers, and motion designers. It serves as a high-resolution asset library for League of Legends champion, item, summoner spell, and ability icons, integrating Riot Games' Data Dragon CDN, native Windows OLE file drag-and-drop (CF_HDROP), raw clipboard bitmap transfer, and an on-device waifu2x-ncnn-vulkan neural super-resolution pipeline.

---

## Overview

Video editing and compositing suites such as Adobe Premiere Pro, Adobe After Effects, and DaVinci Resolve cannot import browser image payloads or web URLs dragged from standard web applications. They strictly listen for the native Windows clipboard format `CF_HDROP`, which requires a physical, validated file path on the local disk.

League Asset Vault solves this workflow bottleneck. It fetches official game assets directly from Riot Games' static CDN, runs offline AI super-resolution using waifu2x CU-Net to upscale low-resolution icons (64x64 items/spells and 128x128 champions) up to 4x Ultra-HD with noise elimination, caches them on disk, and initiates native OS drag payloads directly into editing software timelines.

---

## Key Features

### 1. Official Riot Games Data Dragon Ingestion
- Fetches active and legacy game versions dynamically from `https://ddragon.leagueoflegends.com/api/versions.json`.
- Ingests full metadata manifests for Champions (170+ entries), Items (860+ entries), Summoner Spells (Flash, Ignite, Smite, etc.), and Runes Reforged (all 5 trees + Keystones).
- Fetches detailed Champion Abilities manifests (Passive, Q, W, E, R) and official Champion Skins with full HD 16:9 splash art and vertical loading screen cards.
- Downloads icon assets on demand from Riot CDN to local disk storage; operates completely offline once cached.
- Zero web scraping and zero API keys required.

### 2. Interactive Before / After Split Comparison Slider
- Draggable comparison lens in the preview modal comparing pixelated 1x originals against waifu2x 4x CU-Net smooth vector-grade artwork in real time.
- Smooth mouse and touch drag control with instant visual proof of super-resolution clarity.
- Quick toggle between interactive Split Lens and classic Side-by-Side views.

### 3. Custom Framing Presets (Gold Border & Drop Shadow)
- **Hextech Gold Border**: Crisp 2px metallic League gold outline conforming to square or circular cutouts.
- **Soft Dark Drop Shadow**: Padded ambient shadow layer that makes icons pop immediately over bright Summoner's Rift gameplay without manual After Effects or Photoshop effects.
- Direct output to transparent PNGs with full alpha channel preservation.

### 4. Native Windows OLE Drag-and-Drop (CF_HDROP)
- Dragging an asset card out of the window registers an authentic Win32 OLE `IDataObject` containing `CF_HDROP` (`DROPFILES`).
- Full compatibility with:
  - Adobe Premiere Pro
  - Adobe After Effects
  - Adobe Photoshop
  - DaVinci Resolve
  - Discord Desktop
  - Windows File Explorer

### 5. Direct Native Clipboard Copy (Ctrl+C)
- Instant 1-click or `Ctrl+C` keyboard shortcut to copy uncompressed DIB bitmap data directly into the Windows OS clipboard (`clipboard.writeImage`).
- Allows immediate pasting into Adobe Photoshop, Figma, Discord, or any graphics suite without dragging files to disk first.

### 6. Anti-Aliased Circular Alpha Cutouts (Transparent PNG)
- High-precision sub-pixel feathering algorithm generates transparent circular alpha masks (`_circle.png`).
- Eliminates manual masking in Premiere Pro and After Effects for character portrait overlays, stream alerts, and YouTube thumbnails.
- Supports both standard square borders and circular cutouts across all assets and upscaling scales.

### 7. Project Quick Bin (Favorites Dock Tray)
- Persistent project pinboard dock at the bottom of the workspace.
- Pin frequently used champion portraits, summoner spells, or items for quick access during editing sessions.
- Pinned items persist across application reboots via local storage.
- Supports direct drag-and-drop and clipboard copying right from the bin.

### 8. Hardware Inference Settings & Multi-GPU Support
- Configurable GPU Device Selection (`-g` flag): Primary GPU (`0`), Secondary Discrete GPU (`1`), or CPU (`-1`).
- Configurable Inference Tile Size (`-t` flag): Auto, 100 (2GB VRAM), 200 (4GB VRAM), or 400 (8GB+ High Performance).
- Default denoise, scale, and mask shape preferences saved persistently to `%APPDATA%\league-asset-vault\settings.json`.

### 9. Full Offline Pre-Caching Engine
- Background concurrency pool allowing users to download all original assets (champions, items, summoners, abilities) for a game patch in advance.
- Live progress feedback showing download counts and percent completion.
- Enables complete editing workflow functionality with zero internet connectivity.

### 10. Native waifu2x-ncnn-vulkan Super-Resolution Engine
- Standalone Vulkan GPU-accelerated inference using the `models-cunet` (Artwork) model.
- Multi-level noise reduction controls:
  - Level 0 (None): Maximum line sharpness, preserves source texture.
  - Level 1 (Medium): Subtle denoising.
  - Level 2 (High): Strong denoising, eliminates standard compression artifacts.
  - Level 3 (Highest - Recommended): Maximum artifact elimination, producing vector-like flat illustration surfaces.
- Parameter-fingerprinted file naming prevents stale cache collisions:
  - `<assetId>_scale<scale>x_noise<noiseLevel>[_circle].png` (e.g. `3031_scale4x_noise3.png`).

### 11. Disk Cache Management
- Local cache path: `%APPDATA%\league-asset-vault\cache\`.
- Real-time disk usage calculation displayed in the application header.
- Safe cache purging: Deletes all generated upscaled files while preserving core configuration files (`versions.json`, manifest caches) and downloaded 1x originals.
- One-click button to open the cache directory in Windows Explorer.

---

## Technology Stack

- Desktop Framework: Electron (v34)
- Frontend Framework: React (v19)
- Build Tool / Bundler: Vite (v6)
- Language: TypeScript (v5)
- Image Processing: pngjs (Pure JS PNG encoder/decoder for circular alpha masking)
- Neural Inference Engine: waifu2x-ncnn-vulkan (NCNN runtime with Vulkan GPU acceleration)
- Icons: Lucide React
- Packaging: electron-builder (v25)

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
│   │   │   ├── clipboardHandler.ts # Native OS clipboard bitmap copy handler
│   │   │   ├── dragHandler.ts      # Win32 CF_HDROP startDrag payload handler
│   │   │   ├── ddragonHandler.ts   # Data Dragon catalog, settings, and precache IPC
│   │   │   └── upscalerHandler.ts  # Single, batch, and inspect upscale IPC handlers
│   │   └── services/
│   │       ├── alphaMasker.ts     # Anti-aliased circular alpha masking service
│   │       ├── cacheManager.ts    # Recursive size calculator and cache cleaner
│   │       ├── ddragonService.ts  # Riot CDN fetcher and offline manifest store
│   │       ├── imageResampler.ts  # High-order Lanczos-3 fallback resampler
│   │       ├── settingsManager.ts # Persistent application configuration store
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
│           │   ├── Header.tsx        # Patch selector, scale toggle, shape toggle, cache control
│           │   ├── SearchFilter.tsx  # Champions, Items, and Summoner Spells tabs
│           │   ├── AssetGrid.tsx     # Responsive virtualized asset grid
│           │   ├── AssetCard.tsx     # Asset card with pin, copy, and drag listeners
│           │   ├── PreviewModal.tsx  # Abilities strip, circular cutout toggle, clipboard copy
│           │   ├── QuickBin.tsx      # Persistent project favorites dock tray
│           │   ├── SettingsModal.tsx # GPU selection, tile size, offline pre-cache
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
1. The user initiates a drag gesture on an asset card, from inside the Preview Modal, or from the Quick Bin.
2. The renderer suppresses the browser default drag event (`e.preventDefault()`) and dispatches a request to the main process via `window.electronAPI.startDrag({ assetId, assetType, scale, noiseLevel, maskShape })`.
3. The main process verifies that the fingerprinted asset exists in `%APPDATA%\league-asset-vault\cache\`. If not, it executes waifu2x and/or alpha masking to generate the file on disk.
4. Electron's `event.sender.startDrag()` initiates the Windows COM `DoDragDrop` routine, supplying a `CF_HDROP` payload containing the absolute file path on disk.
5. External applications (Adobe Premiere Pro, Photoshop, DaVinci Resolve) accept the drop event as an authentic local file import.

### Direct Native Clipboard Copy
- When copying via `Ctrl+C` or the copy button, the main process decodes the cached file into an uncompressed `nativeImage` bitmap.
- `clipboard.writeImage(nativeImage)` pushes the bitmap directly to the Windows OS clipboard buffer.
- This allows immediate pasting into Photoshop (`Ctrl+V`) as a new raster layer without intermediate filesystem navigation.

### Super-Resolution Pipeline
- The engine uses `waifu2x-ncnn-vulkan` with the `models-cunet` model.
- CLI execution arguments:
  `-i <input_path> -o <output_path> -s <scale> -n <noise_level> -m <model_dir> -f png -g <gpuId> -t <tileSize>`
- Concurrency limiting ensures multiple simultaneous upscale requests do not saturate GPU memory.
- If Vulkan hardware is unavailable, the service automatically falls back to an integrated separable Lanczos-3 resampler with unsharp mask sharpening.

---

## Legal and Attributions

- Riot Games: League Asset Vault is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
- waifu2x-ncnn-vulkan: Created by nihui and contributors under the MIT License.
- Application License: This project is licensed under the MIT License.
