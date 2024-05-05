import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import * as fs from "fs";
import * as path from "path";
interface clogconfig {
    combattime: number,
    disablekillmessageonclog: boolean
  }
  const configdata = fs.readFileSync(path.join(__dirname, "./config.json"), 'utf8');
    const config: clogconfig = JSON.parse(configdata);
    let interval: NodeJS.Timeout;
    function Sequence(): void {
        const combatmap = new Map<string, number>();
events.entityKnockback.on(event => {
    if (event.source && event.target) {
        if (event.source.isPlayer() === false) return;
        if (event.target.isPlayer() === false) return;
        combatmap.set(event.source.getName(), config.combattime)
        combatmap.set(event.target.getName(), config.combattime)
    }
})
events.playerLeft.on(async ev => {
    const combatTime = combatmap.get(ev.player.getName());
    if (combatTime !== undefined) {
        if (combatTime === 0) return;
        if (config.disablekillmessageonclog === true) bedrockServer.executeCommand(`gamerule showdeathmessages false`)
    ev.player.kill()
    if (config.disablekillmessageonclog === true) bedrockServer.executeCommand(`gamerule showdeathmessages true`)
    console.log(`${ev.player.getName()} just combat logged with ${combatTime}s left of combat!`)
    for (const player of bedrockServer.serverInstance.getPlayers()) {
        player.sendMessage(`${ev.player.getName()} just combat logged!`)
    }
   }
})
interval = setInterval(() => {
    for (const player of bedrockServer.serverInstance.getPlayers()) {
        if (!player) return;
    
        const combatTime = combatmap.get(player.getName());
        if (combatTime !== undefined) {
            if (combatTime === 0) return;
    
            player.sendActionbar(`You are in combat for ${combatTime}s`);
    
            combatmap.set(player.getName(), combatTime - 1);
        }
    }
}, 1000);
    }
    events.serverOpen.on(Sequence);
    events.serverStop.on(() => {
        clearInterval(interval)
    })