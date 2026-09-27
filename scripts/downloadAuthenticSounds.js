const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, '..', 'resources', 'sounds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 43 Authentic League of Legends Sound Effects (16-bit 44.1kHz PCM Broadcast WAV for Premiere Pro compatibility)
const soundsToDownload = [
  // Summoner Spells
  { file: 'flash.wav', title: 'File:Flash SFX.ogg' },
  { file: 'ignite.wav', title: 'File:Ignite SFX.ogg' },
  { file: 'smite.wav', title: 'File:Smite active SFX.ogg' },
  { file: 'ghost.wav', title: 'File:Ghost SFX.ogg' },
  { file: 'cleanse.wav', title: 'File:Cleanse SFX.ogg' },
  { file: 'heal.wav', title: 'File:Heal SFX.ogg' },
  { file: 'teleport.wav', title: 'File:Teleport SFX.ogg' },
  { file: 'barrier.wav', title: 'File:Barrier SFX.ogg' },
  { file: 'exhaust.wav', title: 'File:Exhaust SFX.ogg' },
  { file: 'recall.wav', title: 'File:Recall SFX.ogg' },

  // Items
  { file: 'zhonya.wav', title: "File:Zhonya's Hourglass active SFX.ogg" },
  { file: 'guardian_angel.wav', title: 'File:Guardian Angel passive SFX.ogg' },
  { file: 'blade_of_the_ruined_king.wav', title: 'File:Blade of the Ruined King passive SFX.ogg' },
  { file: 'heartsteel.wav', title: 'File:Heartsteel trigger SFX.ogg' },
  { file: 'redemption.wav', title: 'File:Redemption active SFX.ogg' },
  { file: 'locket_solari.wav', title: 'File:Locket of the Iron Solari active SFX.ogg' },

  // Smart Pings
  { file: 'ping_danger.wav', title: 'File:Caution ping SFX.ogg' },
  { file: 'ping_missing.wav', title: 'File:Enemy Missing ping SFX.ogg' },
  { file: 'ping_assist.wav', title: 'File:Assist Me ping SFX.ogg' },
  { file: 'ping_onmyway.wav', title: 'File:On My Way ping SFX.ogg' },
  { file: 'ping_allin.wav', title: 'File:All In ping SFX.ogg' },
  { file: 'ping_retreat.wav', title: 'File:Retreat ping SFX.ogg' },
  { file: 'ping_needvision.wav', title: 'File:Need Vision ping SFX.ogg' },

  // Classic Female Announcer (Karen Strassman / Summoner's Rift)
  { file: 'announcer_welcome.wav', title: 'File:Announcer Female1 117.ogg' },
  { file: 'announcer_minions.wav', title: 'File:Announcer Female1 109.ogg' },
  { file: 'announcer_minions_spawned.wav', title: 'File:Announcer Female1 092.ogg' },
  { file: 'announcer_first_blood.wav', title: 'File:Announcer Female1 052.ogg' },
  { file: 'announcer_enemy_slain.wav', title: 'File:Announcer Female1 014.ogg' },
  { file: 'announcer_double_kill.wav', title: 'File:Announcer Female1 006.ogg' },
  { file: 'announcer_triple_kill.wav', title: 'File:Announcer Female1 036.ogg' },
  { file: 'announcer_quadra_kill.wav', title: 'File:Announcer Female1 032.ogg' },
  { file: 'announcer_penta_kill.wav', title: 'File:Announcer Female1 029.ogg' },
  { file: 'announcer_ace.wav', title: 'File:Announcer Female1 002.ogg' },
  { file: 'announcer_executed.wav', title: 'File:Announcer Female1 021.ogg' },
  { file: 'announcer_shutdown.wav', title: 'File:Announcer Female1 054.ogg' },
  { file: 'announcer_killing_spree.wav', title: 'File:Announcer Female1 059.ogg' },
  { file: 'announcer_rampage.wav', title: 'File:Announcer Female1 064.ogg' },
  { file: 'announcer_unstoppable.wav', title: 'File:Announcer Female1 070.ogg' },
  { file: 'announcer_godlike.wav', title: 'File:Announcer Female1 078.ogg' },
  { file: 'announcer_legendary.wav', title: 'File:Announcer Female1 084.ogg' },
  { file: 'announcer_turret_destroyed.wav', title: 'File:Announcer Female1 111.ogg' },
  { file: 'announcer_victory.wav', title: 'File:Announcer Female1 114.ogg' },
  { file: 'announcer_defeat.wav', title: 'File:Announcer Female1 051.ogg' },
];

async function downloadAndConvert() {
  console.log(`Starting download of ${soundsToDownload.length} authentic sound effects into ${targetDir}...`);
  const titles = soundsToDownload.map(s => s.title);

  // Batch query MediaWiki image URLs
  const titlesParam = encodeURIComponent(titles.join('|'));
  const apiUrl = `https://leagueoflegends.fandom.com/api.php?action=query&titles=${titlesParam}&prop=imageinfo&iiprop=url&format=json`;

  const res = await fetch(apiUrl);
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});
  const urlMap = {};
  for (const p of pages) {
    if (p.imageinfo && p.imageinfo[0]) {
      urlMap[p.title] = p.imageinfo[0].url;
    }
  }

  for (const item of soundsToDownload) {
    const directUrl = urlMap[item.title];
    if (!directUrl) {
      console.warn(`Could not resolve URL for ${item.title}`);
      continue;
    }

    const wavPath = path.join(targetDir, item.file);
    const tempOgg = path.join(targetDir, `_temp_${Date.now()}_${path.basename(item.file, '.wav')}.ogg`);

    try {
      const audioRes = await fetch(directUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://leagueoflegends.fandom.com/'
        }
      });
      if (!audioRes.ok) throw new Error(`HTTP ${audioRes.status}`);

      const buf = Buffer.from(await audioRes.arrayBuffer());
      fs.writeFileSync(tempOgg, buf);

      // Transcode to standard 16-bit 44.1kHz stereo PCM WAV for universal video editor compatibility
      execSync(`ffmpeg -y -i "${tempOgg}" -acodec pcm_s16le -ar 44100 "${wavPath}"`, { stdio: 'pipe' });
      console.log(`✓ Saved ${item.file} (${fs.statSync(wavPath).size} bytes)`);
    } catch (err) {
      console.error(`✗ Failed for ${item.file}:`, err.message);
    } finally {
      if (fs.existsSync(tempOgg)) {
        try { fs.unlinkSync(tempOgg); } catch (_) {}
      }
    }
  }

  console.log('Finished downloading authentic sounds.');
}

downloadAndConvert().catch(console.error);
