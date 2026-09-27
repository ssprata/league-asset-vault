import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import { AudioAsset } from '../../shared/types';
import { audioService } from '../services/audioService';

export function registerAudioHandler(currentVersionGetter: () => string): void {
  ipcMain.handle(IPC_CHANNELS.GET_AUDIO_ASSETS, async (_event, version?: string) => {
    const targetVersion = version || currentVersionGetter();
    return await audioService.getAudioLibrary(targetVersion);
  });

  ipcMain.handle(
    IPC_CHANNELS.GET_CHAMPION_AUDIO,
    async (_event, championKey: string, championName: string) => {
      return await audioService.getChampionAudio(championKey, championName);
    }
  );

  ipcMain.handle(IPC_CHANNELS.ENSURE_AUDIO_CACHED, async (_event, asset: AudioAsset) => {
    return await audioService.ensureAudioCached(asset);
  });

  ipcMain.handle(IPC_CHANNELS.GET_AUDIO_PLAY_URL, async (_event, asset: AudioAsset) => {
    return await audioService.getAudioPlayUrl(asset);
  });
}
