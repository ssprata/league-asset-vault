import fs from 'fs';
import path from 'path';
import { ipcMain, nativeImage } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { DragStartRequest } from '../../shared/types';
import { cacheManager } from '../services/cacheManager';
import { ddragonService } from '../services/ddragonService';
import { upscalerService } from '../services/upscalerService';

export function registerDragHandler(currentVersionGetter: () => string): void {
  ipcMain.on(IPC_CHANNELS.START_DRAG, async (event, request: DragStartRequest) => {
    try {
      const version = currentVersionGetter();
      const {
        assetId,
        assetType,
        scale,
        noiseLevel = 3,
        maskShape = 'square',
        imageFileName,
        cdnUrl: requestCdnUrl,
      } = request;

      // Find asset info from DDragon catalog if not passed
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
        }
      }

      // Check if requested scale, noise level, and mask shape is already on disk
      let targetFilePath = cacheManager.getAssetPath(
        version,
        assetType,
        fileName,
        scale,
        noiseLevel,
        maskShape
      );

      if (!fs.existsSync(targetFilePath) || fs.statSync(targetFilePath).size === 0) {
        console.log(
          `[DragHandler] Resolving asset on disk before drag: ${fileName} (${scale}, noise ${noiseLevel}, ${maskShape})`
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
          maskShape
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
