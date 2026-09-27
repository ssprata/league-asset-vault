const fs = require('fs');
const path = require('path');

const soundsToDownload = [
  // Spells
  {
    file: 'flash.ogg',
    title: 'File:Flash SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/3/39/Flash_SFX.ogg/revision/latest?cb=20220703045631'
  },
  {
    file: 'ignite.ogg',
    title: 'File:Ignite SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/b/b9/Ignite_SFX.ogg/revision/latest?cb=20220703045658'
  },
  {
    file: 'smite.ogg',
    title: 'File:Smite active SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/1/18/Smite_active_SFX.ogg/revision/latest?cb=20220703045718'
  },
  {
    file: 'ghost.ogg',
    title: 'File:Ghost SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/f/f9/Ghost_SFX.ogg/revision/latest?cb=20220703045633'
  },
  {
    file: 'cleanse.ogg',
    title: 'File:Cleanse SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/6/6d/Cleanse_SFX.ogg/revision/latest?cb=20220703045615'
  },
  {
    file: 'heal.ogg',
    title: 'File:Heal SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/2/25/Heal_SFX.ogg/revision/latest?cb=20220703045643'
  },
  {
    file: 'teleport.ogg',
    title: 'File:Teleport SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/f/f3/Teleport_SFX.ogg/revision/latest?cb=20220703045721'
  },
  {
    file: 'barrier.ogg',
    title: 'File:Barrier SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/4/44/Barrier_SFX.ogg/revision/latest?cb=20220703045609'
  },
  {
    file: 'exhaust.ogg',
    title: 'File:Exhaust SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/f/f1/Exhaust_SFX.ogg/revision/latest?cb=20220703045628'
  },
  {
    file: 'recall.ogg',
    title: 'File:Recall SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/3/32/Recall_SFX.ogg/revision/latest?cb=20220703045717'
  },

  // Items
  {
    file: 'zhonya.ogg',
    title: "File:Zhonya's Hourglass active SFX.ogg",
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/5/5c/Zhonya%27s_Hourglass_active_SFX.ogg/revision/latest?cb=20220702210743'
  },
  {
    file: 'guardian_angel.ogg',
    title: 'File:Guardian Angel passive SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/7/71/Guardian_Angel_passive_SFX.ogg/revision/latest?cb=20220702210557'
  },
  {
    file: 'blade_of_the_ruined_king.ogg',
    title: 'File:Blade of the Ruined King passive SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/b/bf/Blade_of_the_Ruined_King_passive_SFX.ogg/revision/latest?cb=20220702210507'
  },
  {
    file: 'heartsteel.ogg',
    title: 'File:Heartsteel trigger SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/9/95/Heartsteel_trigger_SFX.ogg/revision/latest?cb=20221118195001'
  },
  {
    file: 'redemption.ogg',
    title: 'File:Redemption active SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/6/66/Redemption_active_SFX.ogg/revision/latest?cb=20220702210703'
  },
  {
    file: 'locket_solari.ogg',
    title: 'File:Locket of the Iron Solari active SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/9/9f/Locket_of_the_Iron_Solari_active_SFX.ogg/revision/latest?cb=20220702210627'
  },

  // Pings
  {
    file: 'ping_danger.ogg',
    title: 'File:Caution ping SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/4/40/Caution_ping_SFX.ogg/revision/latest?cb=20230303075615'
  },
  {
    file: 'ping_missing.ogg',
    title: 'File:Enemy Missing ping SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/8/81/Enemy_Missing_ping_SFX.ogg/revision/latest?cb=20230303075618'
  },
  {
    file: 'ping_assist.ogg',
    title: 'File:Assist Me ping SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/4/4a/Assist_Me_ping_SFX.ogg/revision/latest?cb=20230303075611'
  },
  {
    file: 'ping_onmyway.ogg',
    title: 'File:On My Way ping SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/4/48/On_My_Way_ping_SFX.ogg/revision/latest?cb=20230303075633'
  },
  {
    file: 'ping_allin.ogg',
    title: 'File:All In ping SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/d/dd/All_In_ping_SFX.ogg/revision/latest?cb=20230303075607'
  },
  {
    file: 'ping_retreat.ogg',
    title: 'File:Retreat ping SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/f/ff/Retreat_ping_SFX.ogg/revision/latest?cb=20230303075638'
  },
  {
    file: 'ping_needvision.ogg',
    title: 'File:Need Vision ping SFX.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/d/d2/Need_Vision_ping_SFX.ogg/revision/latest?cb=20230303075628'
  },

  // Announcer
  {
    file: 'announcer_first_blood.ogg',
    title: 'File:Announcer OnFirstBlood 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/e/e4/Announcer_OnFirstBlood_0_old2.ogg/revision/latest?cb=20221225230523'
  },
  {
    file: 'announcer_ace.ogg',
    title: 'File:Announcer OnAce 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/c/c6/Announcer_OnAce_0_old2.ogg/revision/latest?cb=20221225230246'
  },
  {
    file: 'announcer_double_kill.ogg',
    title: 'File:Announcer OnChampionDoubleKill 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/3/3d/Announcer_OnChampionDoubleKill_0_old2.ogg/revision/latest?cb=20221225230250'
  },
  {
    file: 'announcer_triple_kill.ogg',
    title: 'File:Announcer OnChampionTripleKill 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/d/d1/Announcer_OnChampionTripleKill_0_old2.ogg/revision/latest?cb=20221225230411'
  },
  {
    file: 'announcer_quadra_kill.ogg',
    title: 'File:Announcer OnChampionQuadraKill 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/1/15/Announcer_OnChampionQuadraKill_0_old2.ogg/revision/latest?cb=20221225230404'
  },
  {
    file: 'announcer_penta_kill.ogg',
    title: 'File:Announcer OnChampionPentaKill 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/e/e9/Announcer_OnChampionPentaKill_0_old2.ogg/revision/latest?cb=20221225230356'
  },
  {
    file: 'announcer_welcome.ogg',
    title: 'File:Announcer OnWelcomeSummonersRift 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/8/88/Announcer_OnWelcomeSummonersRift_0_old2.ogg/revision/latest?cb=20221225230909'
  },
  {
    file: 'announcer_minions.ogg',
    title: 'File:Announcer OnMinionsSpawn 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/e/e5/Announcer_OnMinionsSpawn_0_old2.ogg/revision/latest?cb=20221225230734'
  },
  {
    file: 'announcer_victory.ogg',
    title: 'File:Announcer OnVictory 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/1/19/Announcer_OnVictory_0_old2.ogg/revision/latest?cb=20221225230904'
  },
  {
    file: 'announcer_defeat.ogg',
    title: 'File:Announcer OnDefeat 0 old2.ogg',
    url: 'https://static.wikia.nocookie.net/leagueoflegends/images/f/fb/Announcer_OnDefeat_0_old2.ogg/revision/latest?cb=20221225230509'
  }
];

const targetDir = path.join(__dirname, '..', 'resources', 'sounds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadAll() {
  console.log(`Starting download of ${soundsToDownload.length} authentic sound effects into ${targetDir}...`);
  for (const item of soundsToDownload) {
    const dest = path.join(targetDir, item.file);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://leagueoflegends.fandom.com/'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`✓ Downloaded ${item.file} (${buf.length} bytes)`);
    } catch (err) {
      console.error(`✗ Failed downloading ${item.file}:`, err.message);
    }
  }
  console.log('Download complete.');
}

downloadAll();
