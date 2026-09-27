import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { app } from 'electron';
import { AudioAsset } from '../../shared/types';
import { DDRAGON_ENDPOINTS } from '../../shared/constants';
import { cacheManager } from './cacheManager';
import { ddragonService } from './ddragonService';

export class AudioService {
  private bundledSoundsDir: string;

  constructor() {
    // When running in dev, resources/sounds is relative to project root
    // In production, electron-builder copies extraResources to process.resourcesPath/sounds
    const devPath = path.join(process.cwd(), 'resources', 'sounds');
    const prodPath = path.join((process as any).resourcesPath || '', 'sounds');
    this.bundledSoundsDir = fs.existsSync(devPath) ? devPath : prodPath;
  }

  /**
   * Returns the directory where bundled sound effects live.
   */
  public getBundledDir(): string {
    return this.bundledSoundsDir;
  }

  /**
   * Returns directory where downloaded audio files are cached on disk.
   */
  public getAudioCacheDir(): string {
    const dir = path.join(cacheManager.getBaseCacheDir(), 'audio');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Builds the default sound effects catalog (Summoner spells, items, pings, announcer, and champion VO).
   */
  public async getAudioLibrary(version: string): Promise<AudioAsset[]> {
    const list: AudioAsset[] = [];

    // Helper to read bundled sound as safe base64 Data URL for instant in-app playback
    const getBundledDataUrl = (fileName: string): string => {
      const filePath = path.join(this.bundledSoundsDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          const buf = fs.readFileSync(filePath);
          const ext = path.extname(fileName).toLowerCase();
          const mime = ext === '.ogg' ? 'audio/ogg' : ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
          return `data:${mime};base64,${buf.toString('base64')}`;
        } catch (e) {
          console.warn('[AudioService] Failed reading bundled sound:', fileName, e);
        }
      }
      return `file://${filePath.replace(/\\/g, '/')}`;
    };

    // 1. Authentic Summoner Spells SFX (16-bit PCM Broadcast WAV)
    const spells = [
      { id: 'flash_sfx', name: 'Flash SFX', file: 'flash.wav', duration: '0:01' },
      { id: 'ignite_sfx', name: 'Ignite SFX', file: 'ignite.wav', duration: '0:01' },
      { id: 'smite_sfx', name: 'Smite SFX', file: 'smite.wav', duration: '0:01' },
      { id: 'ghost_sfx', name: 'Ghost SFX', file: 'ghost.wav', duration: '0:01' },
      { id: 'cleanse_sfx', name: 'Cleanse SFX', file: 'cleanse.wav', duration: '0:02' },
      { id: 'heal_sfx', name: 'Heal SFX', file: 'heal.wav', duration: '0:02' },
      { id: 'teleport_sfx', name: 'Teleport SFX', file: 'teleport.wav', duration: '0:03' },
      { id: 'barrier_sfx', name: 'Barrier SFX', file: 'barrier.wav', duration: '0:01' },
      { id: 'exhaust_sfx', name: 'Exhaust SFX', file: 'exhaust.wav', duration: '0:01' },
      { id: 'recall_sfx', name: 'Recall SFX', file: 'recall.wav', duration: '0:08' },
    ];

    for (const s of spells) {
      const filePath = path.join(this.bundledSoundsDir, s.file);
      const playUrl = getBundledDataUrl(s.file);
      list.push({
        type: 'audio',
        id: s.id,
        name: s.name,
        category: 'spell',
        fileName: s.file,
        cdnUrl: playUrl,
        playUrl,
        duration: s.duration,
        cachedPath: fs.existsSync(filePath) ? filePath : undefined,
        tags: ['Spells', 'Summoners'],
      });
    }

    // 2. Authentic Game Items SFX (16-bit PCM Broadcast WAV)
    const items = [
      { id: 'zhonya_sfx', name: "Zhonya's Hourglass Stasis SFX", file: 'zhonya.wav', duration: '0:02' },
      { id: 'guardian_angel_sfx', name: 'Guardian Angel Revive SFX', file: 'guardian_angel.wav', duration: '0:04' },
      { id: 'blade_ruined_king_sfx', name: 'Blade of the Ruined King SFX', file: 'blade_of_the_ruined_king.wav', duration: '0:02' },
      { id: 'heartsteel_sfx', name: 'Heartsteel Trigger SFX', file: 'heartsteel.wav', duration: '0:01' },
      { id: 'redemption_sfx', name: 'Redemption Active SFX', file: 'redemption.wav', duration: '0:02' },
      { id: 'locket_solari_sfx', name: 'Locket of the Iron Solari SFX', file: 'locket_solari.wav', duration: '0:02' },
    ];

    for (const it of items) {
      const filePath = path.join(this.bundledSoundsDir, it.file);
      const playUrl = getBundledDataUrl(it.file);
      list.push({
        type: 'audio',
        id: it.id,
        name: it.name,
        category: 'item',
        fileName: it.file,
        cdnUrl: playUrl,
        playUrl,
        duration: it.duration,
        cachedPath: fs.existsSync(filePath) ? filePath : undefined,
        tags: ['Items'],
      });
    }

    // 3. Authentic Smart Pings SFX (16-bit PCM Broadcast WAV)
    const pings = [
      { id: 'ping_danger', name: 'Danger / Caution Alert Ping', file: 'ping_danger.wav', duration: '0:01' },
      { id: 'ping_missing', name: 'Enemy Missing (?) Ping', file: 'ping_missing.wav', duration: '0:01' },
      { id: 'ping_assist', name: 'Assist Me Ping', file: 'ping_assist.wav', duration: '0:01' },
      { id: 'ping_onmyway', name: 'On My Way Ping', file: 'ping_onmyway.wav', duration: '0:01' },
      { id: 'ping_allin', name: 'All In Ping', file: 'ping_allin.wav', duration: '0:01' },
      { id: 'ping_retreat', name: 'Retreat / Fall Back Ping', file: 'ping_retreat.wav', duration: '0:01' },
      { id: 'ping_needvision', name: 'Need Vision Ping', file: 'ping_needvision.wav', duration: '0:01' },
    ];

    for (const p of pings) {
      const filePath = path.join(this.bundledSoundsDir, p.file);
      const playUrl = getBundledDataUrl(p.file);
      list.push({
        type: 'audio',
        id: p.id,
        name: p.name,
        category: 'ping',
        fileName: p.file,
        cdnUrl: playUrl,
        playUrl,
        duration: p.duration,
        cachedPath: fs.existsSync(filePath) ? filePath : undefined,
        tags: ['Pings'],
      });
    }

    // 4. Authentic Classic Female Announcer Lines (Karen Strassman / Summoner's Rift)
    const announcer = [
      { id: 'announcer_welcome', name: "Welcome to Summoner's Rift", file: 'announcer_welcome.wav', duration: '0:03' },
      { id: 'announcer_minions', name: 'Thirty Seconds Until Minions Spawn', file: 'announcer_minions.wav', duration: '0:03' },
      { id: 'announcer_minions_spawned', name: 'Minions Have Spawned', file: 'announcer_minions_spawned.wav', duration: '0:02' },
      { id: 'announcer_first_blood', name: 'First Blood Announcement', file: 'announcer_first_blood.wav', duration: '0:02' },
      { id: 'announcer_enemy_slain', name: 'An Enemy Has Been Slain', file: 'announcer_enemy_slain.wav', duration: '0:02' },
      { id: 'announcer_double_kill', name: 'Double Kill Announcement', file: 'announcer_double_kill.wav', duration: '0:02' },
      { id: 'announcer_triple_kill', name: 'Triple Kill Announcement', file: 'announcer_triple_kill.wav', duration: '0:02' },
      { id: 'announcer_quadra_kill', name: 'Quadra Kill Announcement', file: 'announcer_quadra_kill.wav', duration: '0:02' },
      { id: 'announcer_penta_kill', name: 'Pentakill! Announcement', file: 'announcer_penta_kill.wav', duration: '0:02' },
      { id: 'announcer_ace', name: 'Ace! Announcement', file: 'announcer_ace.wav', duration: '0:02' },
      { id: 'announcer_executed', name: 'Executed Announcement', file: 'announcer_executed.wav', duration: '0:01' },
      { id: 'announcer_shutdown', name: 'Shutdown! Announcement', file: 'announcer_shutdown.wav', duration: '0:02' },
      { id: 'announcer_killing_spree', name: 'Killing Spree Announcement', file: 'announcer_killing_spree.wav', duration: '0:02' },
      { id: 'announcer_rampage', name: 'Rampage! Announcement', file: 'announcer_rampage.wav', duration: '0:02' },
      { id: 'announcer_unstoppable', name: 'Unstoppable! Announcement', file: 'announcer_unstoppable.wav', duration: '0:02' },
      { id: 'announcer_godlike', name: 'Godlike! Announcement', file: 'announcer_godlike.wav', duration: '0:02' },
      { id: 'announcer_legendary', name: 'Legendary! Announcement', file: 'announcer_legendary.wav', duration: '0:02' },
      { id: 'announcer_turret_destroyed', name: 'Your Team Has Destroyed a Turret', file: 'announcer_turret_destroyed.wav', duration: '0:03' },
      { id: 'announcer_victory', name: 'Victory Announcement', file: 'announcer_victory.wav', duration: '0:02' },
      { id: 'announcer_defeat', name: 'Defeat Announcement', file: 'announcer_defeat.wav', duration: '0:02' },
    ];

    for (const a of announcer) {
      const filePath = path.join(this.bundledSoundsDir, a.file);
      const playUrl = getBundledDataUrl(a.file);
      list.push({
        type: 'audio',
        id: a.id,
        name: a.name,
        category: 'announcer',
        fileName: a.file,
        cdnUrl: playUrl,
        playUrl,
        duration: a.duration,
        cachedPath: fs.existsSync(filePath) ? filePath : undefined,
        tags: ['Announcer'],
      });
    }

    // 5. Champion Choose VO, Ban VO, and Signature Stinger SFX (PCM Broadcast WAV)
    try {
      const champions = await ddragonService.getChampions(version);
      const audioCacheDir = this.getAudioCacheDir();

      for (const champ of champions) {
        const champKey = champ.key;
        const champName = champ.name;

        // Choose VO
        const chooseFile = `${champKey}_choose.wav`;
        const chooseLocal = path.join(audioCacheDir, chooseFile);
        list.push({
          type: 'audio',
          id: `vo_${champKey}_choose`,
          name: `${champName} - Pick Voice Line`,
          category: 'champion_vo',
          championId: champ.id,
          championName: champName,
          fileName: chooseFile,
          cdnUrl: DDRAGON_ENDPOINTS.CD_CHOOSE_VO(champKey),
          duration: '0:03',
          cachedPath: fs.existsSync(chooseLocal) ? chooseLocal : undefined,
          tags: ['Voice Lines', 'Champion VO'],
        });

        // Ban VO
        const banFile = `${champKey}_ban.wav`;
        const banLocal = path.join(audioCacheDir, banFile);
        list.push({
          type: 'audio',
          id: `vo_${champKey}_ban`,
          name: `${champName} - Ban Voice Line`,
          category: 'champion_vo',
          championId: champ.id,
          championName: champName,
          fileName: banFile,
          cdnUrl: DDRAGON_ENDPOINTS.CD_BAN_VO(champKey),
          duration: '0:03',
          cachedPath: fs.existsSync(banLocal) ? banLocal : undefined,
          tags: ['Voice Lines', 'Champion VO'],
        });

        // Signature SFX Stinger
        const sfxFile = `${champKey}_sfx.wav`;
        const sfxLocal = path.join(audioCacheDir, sfxFile);
        list.push({
          type: 'audio',
          id: `sfx_${champKey}_stinger`,
          name: `${champName} - Signature Stinger SFX`,
          category: 'champion_sfx',
          championId: champ.id,
          championName: champName,
          fileName: sfxFile,
          cdnUrl: DDRAGON_ENDPOINTS.CD_SFX_AUDIO(champKey),
          duration: '0:04',
          cachedPath: fs.existsSync(sfxLocal) ? sfxLocal : undefined,
          tags: ['Voice Lines', 'SFX'],
        });
      }
    } catch (err) {
      console.warn('[AudioService] Could not append champions audio to library:', err);
    }

    return list;
  }

  /**
   * Returns the audio lines for a specific champion (Choose VO, Ban VO, Stinger SFX).
   */
  public async getChampionAudio(championKey: string, championName: string): Promise<AudioAsset[]> {
    const audioCacheDir = this.getAudioCacheDir();

    const chooseFile = `${championKey}_choose.wav`;
    const chooseLocal = path.join(audioCacheDir, chooseFile);

    const banFile = `${championKey}_ban.wav`;
    const banLocal = path.join(audioCacheDir, banFile);

    const sfxFile = `${championKey}_sfx.wav`;
    const sfxLocal = path.join(audioCacheDir, sfxFile);

    return [
      {
        type: 'audio',
        id: `vo_${championKey}_choose`,
        name: `${championName} - Pick Voice Line`,
        category: 'champion_vo',
        championId: championKey,
        championName,
        fileName: chooseFile,
        cdnUrl: DDRAGON_ENDPOINTS.CD_CHOOSE_VO(championKey),
        duration: '0:03',
        cachedPath: fs.existsSync(chooseLocal) ? chooseLocal : undefined,
        tags: ['Voice Lines', 'Champion VO'],
      },
      {
        type: 'audio',
        id: `vo_${championKey}_ban`,
        name: `${championName} - Ban Voice Line`,
        category: 'champion_vo',
        championId: championKey,
        championName,
        fileName: banFile,
        cdnUrl: DDRAGON_ENDPOINTS.CD_BAN_VO(championKey),
        duration: '0:03',
        cachedPath: fs.existsSync(banLocal) ? banLocal : undefined,
        tags: ['Voice Lines', 'Champion VO'],
      },
      {
        type: 'audio',
        id: `sfx_${championKey}_stinger`,
        name: `${championName} - Signature Stinger SFX`,
        category: 'champion_sfx',
        championId: championKey,
        championName,
        fileName: sfxFile,
        cdnUrl: DDRAGON_ENDPOINTS.CD_SFX_AUDIO(championKey),
        duration: '0:04',
        cachedPath: fs.existsSync(sfxLocal) ? sfxLocal : undefined,
        tags: ['Voice Lines', 'SFX'],
      },
    ];
  }

  /**
   * Returns a playback-ready Data URL or valid web stream URL for any AudioAsset.
   */
  public async getAudioPlayUrl(asset: AudioAsset): Promise<string> {
    if (asset.playUrl && asset.playUrl.startsWith('data:')) {
      return asset.playUrl;
    }
    if (asset.cdnUrl && asset.cdnUrl.startsWith('data:')) {
      return asset.cdnUrl;
    }

    try {
      const targetAudioPath = await this.ensureAudioCached(asset);
      if (fs.existsSync(targetAudioPath)) {
        const ext = path.extname(targetAudioPath).toLowerCase();
        const mime = ext === '.ogg' ? 'audio/ogg' : ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
        const buffer = await fs.promises.readFile(targetAudioPath);
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      console.warn('[AudioService] Could not convert audio to data URL:', e);
    }

    return asset.cdnUrl;
  }

  /**
   * Ensures an audio asset is saved to local disk cache as a 16-bit PCM .wav file for Premiere Pro compatibility.
   */
  public async ensureAudioCached(asset: AudioAsset): Promise<string> {
    const rawName = asset.fileName || `${asset.id}.wav`;
    const wavFileName = rawName.endsWith('.wav')
      ? rawName
      : `${path.basename(rawName, path.extname(rawName))}.wav`;

    // 1. Check if bundled sound file in resources/sounds
    const inBundled = path.join(this.bundledSoundsDir, wavFileName);
    if (fs.existsSync(inBundled) && fs.statSync(inBundled).size > 0) {
      return inBundled;
    }

    // 2. Check if file:// URL
    if (asset.cdnUrl.startsWith('file://')) {
      const localFilePath = asset.cdnUrl.replace('file://', '');
      const normalized = path.resolve(localFilePath);
      if (fs.existsSync(normalized)) {
        return normalized;
      }
    }

    // 3. Check if already in audio cache as .wav
    const cacheDir = this.getAudioCacheDir();
    const targetWavPath = path.join(cacheDir, wavFileName);
    if (fs.existsSync(targetWavPath) && fs.statSync(targetWavPath).size > 0) {
      return targetWavPath;
    }

    // 4. Download from CDN
    console.log(`[AudioService] Downloading audio ${asset.name} from ${asset.cdnUrl}`);
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (asset.cdnUrl.includes('wikia') || asset.cdnUrl.includes('fandom')) {
      headers['Referer'] = 'https://leagueoflegends.fandom.com/';
    }

    const res = await fetch(asset.cdnUrl, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download audio from ${asset.cdnUrl}: ${res.statusText}`);
    }

    const arrayBuf = await res.arrayBuffer();
    const downloadedBuf = Buffer.from(arrayBuf);

    // If already a WAV file (starts with 'RIFF')
    if (downloadedBuf.slice(0, 4).toString('ascii') === 'RIFF') {
      await fs.promises.writeFile(targetWavPath, downloadedBuf);
      return targetWavPath;
    }

    // Convert OGG or other source formats to uncompressed 16-bit 44.1kHz stereo PCM WAV using ffmpeg
    const tempInput = path.join(cacheDir, `temp_${Date.now()}_${path.basename(asset.fileName, '.wav')}.ogg`);
    try {
      await fs.promises.writeFile(tempInput, downloadedBuf);
      try {
        execSync(`ffmpeg -y -i "${tempInput}" -acodec pcm_s16le -ar 44100 "${targetWavPath}"`, { stdio: 'pipe' });
      } catch (convErr) {
        console.warn('[AudioService] ffmpeg conversion failed, saving downloaded buffer directly:', convErr);
        await fs.promises.writeFile(targetWavPath, downloadedBuf);
      }
    } finally {
      if (fs.existsSync(tempInput)) {
        try { fs.unlinkSync(tempInput); } catch (_) {}
      }
    }

    return targetWavPath;
  }
}

export const audioService = new AudioService();
