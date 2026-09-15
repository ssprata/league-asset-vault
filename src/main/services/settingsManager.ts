import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppSettings } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants';

export class SettingsManager {
  private settingsPath: string;
  private currentSettings: AppSettings;

  constructor() {
    const userData = app?.getPath
      ? app.getPath('userData')
      : path.join(process.env.APPDATA || process.cwd(), 'league-asset-vault');
    this.settingsPath = path.join(userData, 'settings.json');
    this.currentSettings = this.loadFromDisk();
  }

  public getSettings(): AppSettings {
    return { ...this.currentSettings };
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    this.currentSettings = { ...this.currentSettings, ...settings };
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await fs.promises.writeFile(
        this.settingsPath,
        JSON.stringify(this.currentSettings, null, 2)
      );
    } catch (err) {
      console.error('[SettingsManager] Failed saving settings:', err);
    }
  }

  private loadFromDisk(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf-8');
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[SettingsManager] Error reading settings, using defaults:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }
}

export const settingsManager = new SettingsManager();
