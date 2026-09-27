import fs from 'fs';
import path from 'path';
import { ipcMain, nativeImage } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { DragStartRequest } from '../../shared/types';
import { cacheManager } from '../services/cacheManager';
import { ddragonService } from '../services/ddragonService';
import { upscalerService } from '../services/upscalerService';
import { audioService } from '../services/audioService';

// 64x64 Hextech gold audio waveform icon for Windows native drag cursor feedback
const AUDIO_DRAG_ICON = nativeImage.createFromDataURL(
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABaElEQVR4AeXBsXXCMBiF0U//UeVGeAOPkVoDqMwK6hgmnVag1ACqGYMNsBpaQuGCIjlpwJi8ex1/OB72V97cx+eX4xeOHwzjNPNPXc6nHXccd4ZxmhFxOZ923DgWwzjNiLmcTztDnONmGKcZQa2kYIgzxNnxsL8izBBniDPEGeIMcYY4Q5whzhBniPO8SCspsIi5dl7EEOd5klZSYBFz7WyUZ6NaSYFFzLXzJIY4z0paSYFFzLWzEZ6NaCUFFjHXzkqMB2klhVZSaCUFVtBKCjyA5020kgKLmGvnQQxxhjhDnCHOEGeIM8QZ4gxxhjjPm4i5dp7A8yAx186KYq6dB/BsRMy18wKelcRcOxtkiPNsVMy1swLPk8RcO2/AEOd5kZhrZwMMcYY4Q5whzhBniDPEGeIMcYY4x80wTjOCWknBEGeIcyyGcZoRczmfdoY4x51hnGZEXM6nHTeOHxwP+yv/1Mfnl+PON72/Vl8jOMj8AAAAAElFTkSuQmCC'
);

export function registerDragHandler(currentVersionGetter: () => string): void {
  ipcMain.on(IPC_CHANNELS.START_DRAG, async (event, request: DragStartRequest) => {
    try {
      const version = currentVersionGetter();
      const {
        assetId,
        assetType,
        scale = '1x',
        noiseLevel = 3,
        maskShape = 'square',
        frameStyle = 'none',
        stampBadge = false,
        badgeText,
        imageFileName,
        cdnUrl: requestCdnUrl,
      } = request;

      // Special Handling for Native Audio Files
      if (assetType === 'audio') {
        const rawFileName = imageFileName || `${assetId}.wav`;
        const fileName = rawFileName.endsWith('.wav')
          ? rawFileName
          : `${path.basename(rawFileName, path.extname(rawFileName))}.wav`;
        const cdnUrl = requestCdnUrl || '';
        const audioAsset: any = {
          type: 'audio',
          id: assetId,
          name: assetId,
          fileName,
          cdnUrl,
        };

        // Check synchronously if file is already on disk (bundled in resources or cached)
        const bundledCandidate = path.join(audioService.getBundledDir(), fileName);
        const cacheCandidate = path.join(audioService.getAudioCacheDir(), fileName);

        let targetAudioPath = '';
        if (fs.existsSync(bundledCandidate) && fs.statSync(bundledCandidate).size > 0) {
          targetAudioPath = bundledCandidate;
        } else if (fs.existsSync(cacheCandidate) && fs.statSync(cacheCandidate).size > 0) {
          targetAudioPath = cacheCandidate;
        } else {
          targetAudioPath = await audioService.ensureAudioCached(audioAsset);
        }

        const absoluteAudioPath = path.resolve(targetAudioPath);

        // Native Win32 DoDragDrop with CF_HDROP payload and valid drag icon thumbnail
        event.sender.startDrag({
          file: absoluteAudioPath,
          icon: AUDIO_DRAG_ICON,
        });

        console.log(`[DragHandler] Initiated native audio CF_HDROP drag payload: ${absoluteAudioPath}`);
        return;
      }

      // Visual Asset Handling
      let fileName = imageFileName || `${assetId}.png`;
      let cdnUrl = requestCdnUrl || '';

      if (!cdnUrl) {
        if (assetType === 'champion') {
          const champs = await ddragonService.getChampions(version);
          const champ = champs.find((c) => c.id === assetId);
          if (champ) {
            fileName = champ.imageFileName;
            cdnUrl = champ.cdnUrl;
          }
        } else if (assetType === 'item') {
          const items = await ddragonService.getItems(version);
          const item = items.find((i) => i.id === assetId);
          if (item) {
            fileName = item.imageFileName;
            cdnUrl = item.cdnUrl;
          }
        } else if (assetType === 'summoner') {
          const spells = await ddragonService.getSummonerSpells(version);
          const spell = spells.find((s) => s.id === assetId);
          if (spell) {
            fileName = spell.imageFileName;
            cdnUrl = spell.cdnUrl;
          }
        } else if (assetType === 'rune') {
          const runes = await ddragonService.getRunes(version);
          const rune = runes.find((r) => r.id === assetId);
          if (rune) {
            fileName = rune.imageFileName;
            cdnUrl = rune.cdnUrl;
          }
        }
      }

      // Check if requested scale, noise level, mask shape, frame style, and badge stamp is already on disk
      let targetFilePath = cacheManager.getAssetPath(
        version,
        assetType,
        fileName,
        scale,
        noiseLevel,
        maskShape,
        frameStyle,
        stampBadge
      );

      if (!fs.existsSync(targetFilePath) || fs.statSync(targetFilePath).size === 0) {
        console.log(
          `[DragHandler] Resolving asset on disk before drag: ${fileName} (${scale}, noise ${noiseLevel}, ${maskShape}, ${frameStyle}, badge: ${stampBadge})`
        );
        const dummyAsset: any = {
          type: assetType,
          id: assetId,
          imageFileName: fileName,
          cdnUrl,
        };

        targetFilePath = await upscalerService.upscaleAsset(
          version,
          dummyAsset,
          scale,
          noiseLevel,
          maskShape,
          frameStyle,
          stampBadge,
          badgeText
        );
      }

      // Ensure normalized Windows absolute path for Win32 CF_HDROP payload
      const absolutePath = path.resolve(targetFilePath);

      // Create a native drag thumbnail image for Windows cursor feedback
      let dragIcon = nativeImage.createFromPath(absolutePath);
      if (dragIcon.isEmpty()) {
        dragIcon = nativeImage.createEmpty();
      } else {
        // Resize drag preview to a neat 64x64 icon preview so it doesn't obstruct the user's view
        dragIcon = dragIcon.resize({ width: 64, height: 64 });
      }

      // Electron's startDrag triggers Win32 DoDragDrop with CF_HDROP format
      event.sender.startDrag({
        file: absolutePath,
        icon: dragIcon,
      });

      console.log(`[DragHandler] Initiated native CF_HDROP drag payload: ${absolutePath}`);
    } catch (err) {
      console.error('[DragHandler] Failed to initiate native file drag:', err);
    }
  });
}
