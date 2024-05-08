import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bedrockServer } from "bdsx/launcher";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { EnchantUtils, Enchant, EnchantmentNames } from "bdsx/bds/enchants";
import { NBT } from "bdsx/bds/nbt";
import * as fs from "fs";
import * as path from "path";
import { Vec3 } from "bdsx/bds/blockpos";
interface clogconfig {
    combattime: number,
    disablekillmessageonclog: boolean,
    disabletridentsincombat: boolean,
    maxtridentusesincombat: number,
    disablepearlsincombat: boolean
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
events.entityDie.on(async ev => {
if (ev.entity.isPlayer() === false) return;
const combatTime = combatmap.get(ev.entity.getName());
if (combatTime !== undefined) {
    if (combatTime === 0) return;
    combatmap.set(ev.entity.getName(), 0);
    tridentusemap.set(ev.entity.getName(), 0)
}
})
let tridentStartPosition: Vec3 | undefined;
const tridentusemap = new Map<string, number>()
events.packetBefore(MinecraftPacketIds.InventoryTransaction).on((pkt, ni) => {
    const type = pkt.transaction?.type;
    const combatTime = combatmap.get(ni.getActor()?.getName());
    if (combatTime !== undefined) {
    if (combatTime === 0) return;
    if (type !== undefined) {
        const item = ni.getActor()?.getMainhandSlot();
        if (type === 2) {
            tridentStartPosition = ni.getActor()?.getPosition();
        } else if (type === 4 && tridentStartPosition) {
            const data = EnchantUtils.getEnchantLevel(Enchant.Type.TridentRiptide, item);
            const itemData = item?.save();
            if (item?.getRawNameId() === "trident" && data > 0 && config.disabletridentsincombat === true) {
                const uses = tridentusemap.get(ni.getActor()?.getName())
            if (uses === undefined) {
            tridentusemap.set(ni.getActor()?.getName(), 0)
            ni.getActor()?.sendMessage(`Warning: You have been teleported back to your previous location tridents are not allowed in combat.`)
            console.log(`${ni.getActor()?.getName()} tried to use a trident in combat with ${combatTime}s of combat left.`)
            } else {
                if (config.maxtridentusesincombat-uses !== 0) {
                ni.getActor()?.sendMessage(`Warning: You are currently in combat and are not allowed to use a trident. You have ${config.maxtridentusesincombat-uses} use(s) remaining.`)
                console.log(`${ni.getActor()?.getName()} tried to use a trident in combat with ${combatTime}s of combat left and ${config.maxtridentusesincombat-uses} use(s) left until riptide removal.` )
                }
                tridentusemap.set(ni.getActor()?.getName(), uses+1)
            }
                if (itemData && itemData.tag && Array.isArray(itemData.tag.ench)) {
                    const enchants = itemData.tag.ench;
                    for (let i = 0; i < enchants.length; i++) {
                        const enchant = enchants[i];
                        if ((enchant.id as NBT.Short).value === EnchantmentNames.Riptide) {
                            if (uses !== undefined) {
                            if (uses >= config.maxtridentusesincombat) {
                            enchants.splice(i, 1);
                            item.load(itemData);
                            ni.getActor()?.sendInventory()
                            ni.getActor()?.sendMessage(`You have used your trident ${config.maxtridentusesincombat} times in combat. Riptide removed.`)
                            console.log(`${ni.getActor()?.getName()} got their riptide removed from using it ${config.maxtridentusesincombat} times in combat`)
                            tridentusemap.set(ni.getActor()?.getName(), 0)
                            }
                            break;
                        }
                    }
                    }
                }
                
                ni.getActor()?.teleport(tridentStartPosition);
                tridentStartPosition = undefined;
                return CANCEL;
            }
        } else if (type === 4) {
            tridentStartPosition = undefined;
        }
        if (item?.getRawNameId() === "ender_pearl" && config.disablepearlsincombat === true) {
            ni.getActor()?.sendInventory()
            ni.getActor()?.sendMessage(`Ender pearls are not allowed in combat.`)
            console.log(`${ni.getActor()?.getName()} tried to use a ender pearl in combat.`)
            return CANCEL;
           }
    }
}
});
interval = setInterval(() => {
    for (const player of bedrockServer.serverInstance.getPlayers()) {
        if (!player) return;

        const combatTime = combatmap.get(player.getName());
        if (combatTime !== undefined) {
            if (combatTime === 0) {
                tridentusemap.set(player.getName(), 0)
                 return;
            }

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