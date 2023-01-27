import { ChestGUI, Page } from "./chestGUI";
import  {world, system, Block, ItemStack, Items} from "@minecraft/server";

/**
 *## KNOWN BUGS
 * * If a gui is opened on the first few ticks after a reload its fucked
 * 
 */

//Say gui in chat to see this example
const menu = new Page()
menu.setFill({typeId: `minecraft:deny`})
menu.setSlots({
    12: { type: `input` },
    13: { type: `button`, item: { typeId: `minecraft:diamond`, nameTag: `Click Me` }, exe: (int) => int.gui.close()},
    14: { type: `output`, item: { typeId: `minecraft:diamond_sword`, nameTag: `Take me!!!!` } }
   }, true)
menu.on(`input`, (data) => {
    if (data.item) data.player.getComponent(`inventory`).container.addItem(data.item)
})
menu.on(`output`, (data) => {
    data.player.tell(`You're welcome`)
})
menu.on(`button`, async (data) => {
    console.warn(`${data.player.name} pressed a button`)
})

world.events.beforeChat.subscribe(data => {
    if (data.message !== `gui`) return
    const gui = new ChestGUI()

    gui.page(true, menu)

    gui.summon(data.sender)
})


//Try and open a crafting table to see this one!
const crafting = new Page()
crafting.setTitle(`double_chest:Crafting`)
crafting.setFill(new ItemStack(Items.get(`minecraft:deny`)))
crafting.pattern([1, 1], [
    `ooo`,
    `ooo_x`,
    `ooo`
], {
    x: {type: `output`},
    o: { type: `input` }
})
crafting.on(`input`, (data) => {
    console.warn(`${data.item?.typeId ? `${data.item.typeId} inputed at ${data.cordinate}!` : `item tooken out of ${data.cordinate}`} `)
})
crafting.on(`any`, (data) => {
    console.warn(`something happened`)
})

crafting.setCloseCondition((gui) => gui.player?.getBlockFromViewVector()?.typeId !== `minecraft:crafting_table`)
//I dont really recommend using this method but it defo works
crafting.setOpenCondition((player) => player.getBlockFromViewVector()?.typeId === `minecraft:crafting_table`)
