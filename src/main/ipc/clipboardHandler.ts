import fs from 'fs';
import { ipcMain, clipboard, nativeImage } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';

export function registerClipboardHandler(): void {
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_COPY, async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: `File not found on disk: ${filePath}` };
      }

      const img = nativeImage.createFromPath(filePath);
      if (img.isEmpty()) {
        return { success: false, error: 'Failed to decode image bitmap for clipboard' };
      }

      // Write true uncompressed DIB bitmap directly to Windows OS Clipboard
      clipboard.writeImage(img);
      console.log(`[ClipboardHandler] Copied image to OS clipboard: ${filePath}`);

      return { success: true };
    } catch (err: any) {
      console.error('[ClipboardHandler] Clipboard copy error:', err);
      return { success: false, error: err.message || 'Clipboard copy failed' };
    }
  });
}
