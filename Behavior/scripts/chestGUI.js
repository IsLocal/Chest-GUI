import { Entity, EntityItemComponent, InventoryComponentContainer, Items, ItemStack, Player, system, Vector, world, Location } from "@minecraft/server";
const air = new ItemStack(Items.get(`minecraft:bedrock`), 0)

// i fucking hate using typescript but love documentation so heres a bunch of jsdoc types 

/**
 * @template {string} T
 * @typedef {Object} Interaction<type>
 * @property {ChestGUI} gui - the gui that was interacted with
 * @property {Player} player - the player the interacted
 * @property {number} slot - the slot that was interacted with
 * @property {[number, number]} cordinate - the cordinate of the slot that was interacted with
 * @property {ItemStack} [item] - the item in the interaction
 * @property {keyof Table} type - the type of slot that was interacted with
 */
/**
 * @typedef {Object} Types
 * @property button
 * @property input
 * @property output
 */

/**
 * @typedef {("hopper:"|"double_chest:"|"spaced:"|"single_row:")} GuiTypes
 */

/**
 * @typedef {Object} Slot
 * @property {keyof Types} type the type of the slot 
 * @property {(int: Interaction<any>) => void} [exe] - callback ran on interaction with slot
 * @property {(ItemObject)} [item]
 */

/** 
    * @template {keyof Types } T
    * @callback Event<T>
    * @param {Interaction<T>} data
    */

/**
 * @typedef {Object} Page
 * @property {string} title
 * @property {Object.<number, Slot>} slots
 * @property { GuiTypes} type
 * @property {Object.<string, (int: Interaction<`any`>) => void>} events
 * @property {(ItemObject)} [fill] - leave undefined for the fill to just be air
 */
/**
 * @typedef {Object} ItemObject
 *  @property {String} typeId
 * @property {Number} [amount]
 * @property {Number} [data]
 * @property {String} [nameTag]
 * @property {Array<String>} [lore]
 * @property {{enchantments: Array<{level: number, type: string}>}} [components]
 */

function addEnchant(item, enchants) {
    /**
     * @type {ItemEnchantsComponent} The enchantment component of the item
     */
    const eC = item.getComponent('enchantments'), eL = eC.enchantments

    for (let i = 0; i < enchants.length; i++) {
        const newEnch = new Enchantment(MinecraftEnchantmentTypes[enchants[i].type], enchants[i].level);
        const rV = eL.addEnchantment(newEnch)
        eC.enchantments = eL
    }

}


/**
 * @param {ItemObject} itemObj 
 */
function itemObjToItemStack(itemObj) {
    const item = new ItemStack(Items.get(itemObj.typeId), itemObj.amount ?? 1, itemObj.data ?? 0)
    if (itemObj.nameTag) item.nameTag = itemObj.nameTag
    if (itemObj?.lore) item.setLore(itemObj.lore)
    if (itemObj?.components?.enchantments) addEnchant(item, itemObj.components.enchantments)
    return item
}


/**
 * 
 * @param {ItemStack} item 
 * @returns {ItemObject} ItemObject
 */
function itemStackToItemObj(item) {
    const MinecraftEnchantments = Object.values(MinecraftEnchantmentTypes);
    const itemEnchants = item.getComponent("enchantments").enchantments;
    const ItemEnchantTypes = [];


    for (const e of MinecraftEnchantments) {
        const ench = itemEnchants.getEnchantment(e);
        if (!ench) continue;
        ItemEnchantTypes.push({ level: ench.level, type: ench.type.id });
    }


    return {
        typeId: item.typeId,
        amount: item.amount,
        data: item.data,
        nameTag: item.nameTag,
        lore: item.getLore(),
        components: {
            enchantments: ItemEnchantTypes,
        }
    };
}


/**
 * 
 * @param {(ItemObject)} item 
 * @returns 
 */
function itemID(item) {
    if (!item) return null
    if (item.getLore) item.lore = item.getLore()
    const itemProps = { typeId: item.typeId, nameTag: item.nameTag, amount: item.amount ?? 1, data: item.data ?? 0 }
    return JSON.stringify(itemProps)
}

/**
 * @param {number} x 
 * @param {number} y 
 * @returns {number}
 */
function indexFromXY(x, y) {
    return y * 9 + x
}

function indexToXY(index) {
    // i == zeroed index of pixel
    const x = index % 9;
    const y = Math.floor(index / 9);
    return [x, y]
}



world.events.worldInitialize.subscribe(data => {
    [...world.getDimension(`overworld`).getPlayers()].forEach(player => {
        player.removeTag(`in-gui`)
    })
})


let s = system.runSchedule(async () => {
    try {
        await world.getDimension("overworld").runCommandAsync(`testfor @a`);
        system.clearRunSchedule(s);
        [...world.getPlayers()].forEach(player => player.removeTag(`in-gui`));
        [...world.getDimension(`overworld`).getEntities({ type: `is:chest_gui` })].forEach(chest => chest.triggerEvent(`is:despawn`));
    } catch (error) { }
}, 5);

world.events.playerJoin.subscribe(data => {
    let sys = system.runSchedule(() => {
        try {
            data.player.removeTag(`in-gui`)
            system.clearRunSchedule(sys);
        } catch (e) {

        }
    })
})

/**
 * Its like the things from node js
 * @author IsLocal yuh
 */
export class EventEmitter {
    constructor() {
        this.events = {}
    }

    /**
     * 
     * @param {string} event 
     * @param {eventCallback} callback 
     */
    on(event, callback) {
        const id = Date.now()
        this.events[event] ??= []
        this.events[event].push({ id: id, callback: callback })
        return id
    }

    once(event, callback) {
        const id = Date.now()
        this.events[event] ??= []
        this.events[event].push({ id: id, callback: callback, once: true })
    }

    /**
     * 
     * @param {string} event 
     * @param  {...any} rest 
     */
    emit(event, ...rest) {
        //if (!this.events[event]) throw `Event not found!`
        this?.events[event]?.forEach(e => {
            e?.callback(...rest)
            if (e?.once) this.removeListener(event, e?.id)
        })
    }
    /**
     * 
     * @param {string} event 
     * @param {number} id 
     */
    removeListener(event, id) {
        if (!this.events[event]) throw `Event not found!`
        if (!this.events[event].find(e => e.id === id)) throw `Listener not found`
        this.events[event].splice(this.events[event].findIndex(e => e.id === id), 1)
    }

    /**
    * 
    * @param {string} event 
    */
    removeListeners(event) {
        if (!this.events[event]) return
        this.events[event] = []
    }

    /**
     * 
     * @param {string} event 
     */
    removeAllListeners(event) {
        this.events = {}
    }

    off(event, id) {
        this.removeListener(event, id)
    }
}


export class ChestGUI extends EventEmitter {

    /**
     * @property {string} what
     */
    constructor() {
        super()
        /** @typedef {string} */
        this.title = `Chest`
        this.summoned = false
        /** @type {Object.<number, Slot>} */
        this.slots = {}
    }

    /** 
     * @template {keyof Types }T
     * @param {T} event
     * @param {(data: Interaction<T>) => void} callback
     */
    on(event, callback) {
        this.removeListeners(event)

        return super.on(event, callback)
    }

    emit(event, ...rest) {
        super.emit(event, ...rest)
        super.emit(`any`, ...rest)
    }

    /**
     * This summons the gui into the world and starts up all the gui's logic 
     * @param {Player} player 
     * @returns {void}
     */
    summon(player) {
        if (this.summoned || player.hasTag(`in-gui`)) throw new Error(`Player already in gui`)

        player.addTag(`in-gui`)
        let cb = world.events.entityCreate.subscribe(data => {

            world.events.entityCreate.unsubscribe(cb)

            if (data.entity.typeId !== `is:chest_gui`) return
            this.player = player

            /** @type {Entity} */
            this.entity = data.entity
            this.summoned = true
            this.selected = this.player.selectedSlot

            if (this.slots) this.initPage()
            else {
                player.removeTag(`in-gui`)
                throw `Gui is missing slots`;
            }


        })
        player.triggerEvent(`is:start_gui`)

    }
    /**
     * if this returns true the gui will close
     * @param {ChestGUI} gui
     */
    closeCondition(gui) {
        return false
    }
    /**
     * Resets a chest's slots and system logic
     */
    reset() {
        this.slots = {}
        system.clearRunSchedule(this.sys)
    }

    /**
     * how it validates everything
     */
    validate(promis) {


        this.fill ??= air

        /** @type {InventoryComponentContainer} */
        const inv = this.entity.getComponent(`inventory`).container
        /** @type {InventoryComponentContainer} */
        const invP = this.player.getComponent(`inventory`).container

        //const date = Date.now()

        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i)
            if (!this.slots[i]) {
                if (item && itemID(item) !== itemID(this.fill)) invP.addItem(item)
                inv.setItem(i, this.fill instanceof ItemStack ? this.fill : itemObjToItemStack(this.fill))
                continue
            }
            if (this.slots[i].type == `fill`) {
                inv.setItem(i, this.slots[i].item instanceof ItemStack ? this.slots[i].item : itemObjToItemStack(this.slots[i].item))
                continue
            }

            if (this.slots[i].type !== `input` && this.slots[i].type !== `output` && itemID(item) !== itemID(this.slots[i].item)) {
                const interaction = { type: `button`, player: this.player, gui: this, slot: i, item: item, cordinate: indexToXY(i) }

                if (item && itemID(item) !== itemID(this.slots[i].item)) invP.addItem(item)

                inv.setItem(i, this.slots[i].item instanceof ItemStack ? this.slots[i].item : itemObjToItemStack(this.slots[i].item))

                this.player.runCommandAsync(`clear @s ${this.slots[i].item.typeId}`)

                this.slots[i]?.exe && this.slots[i].exe(interaction) || this.emit(`button`, interaction);

                [...this.player.dimension.getEntities({ location: new Location(this.player.location.x, this.player.location.y, this.player.location.z), maxDistance: 2, type: "item" })].forEach(item => {
                    /**@type {EntityItemComponent} */
                    const stack = item.getComponent("minecraft:item")
                    if (stack.itemStack.typeId === this.slots[i].item.typeId) item.kill()
                })
                this.entity.runCommandAsync(`kill @e[type=item,r=1.5]`)
                continue
            }

            if (this.slots[i].type === `input` && itemID(item) !== itemID(this.slots[i].checked)) {
                this.slots[i].checked = item
                const interaction = { type: `input`, player: this.player, gui: this, slot: i, item: item, cordinate: indexToXY(i) }
                this.emit(`input`, interaction)

                continue
            }

            if (this.slots[i].type === `output` && (!this.slots[i].checked && itemID(item) !== itemID(this.slots[i].item))) {


                this.slots[i].checked = true
                if (item) invP.addItem(item)
                const interaction = { type: `output`, player: this.player, gui: this, slot: i, item: item, cordinate: indexToXY(i) }
                inv.setItem(i, air)

                this.emit(`output`, interaction)

                continue
            }

            if (this.slots[i].type === `output` && this.slots[i].checked && item) {
                invP.addItem(item)
                inv.setItem(i, air)
            }

        }

        //console.warn(Date.now()-date+`ms`)
    }
    /**
     * If you want a specific sized gui such as double chest just do "double_chest:putwhatever" or "single:putwhatever"
     * @param {GuiTypes} title 
     * @returns {ChestGUI}
     */
    setTitle(title) {
        this.title = title
        if (this.entity) this.entity.nameTag = title
        return this
    }

    /**
     * sets a slot
     * @param {number} slot - takes a slot number or array that represents a cordinate
     * @param {keyof Types} type 
     * @param {(ItemObject)} [item]
     * @returns {ChestGUI}
     * @example
     * gui.setSlot([0,0], `output`, {typeId: `minecraft:diamond_sword`}) 
     */
    setSlot(slot, type, item) {
        this.slots ??= {}
        if (typeof slot == "object") slot = indexFromXY(slot[0], slot[1])
        this.slots[slot] = { type: type, item: item }


        if (this.summoned) {
            const inv = this.entity.getComponent(`inventory`).container
            if (this.slots[slot]?.item) inv.setItem(slot, this.slots[slot].item instanceof ItemStack ? this.slots[slot].item : itemObjToItemStack(this.slots[slot].item))
            else inv.setItem(slot, air)
        }


        return this
    }

    /**
     * Creates a slots based off of a strings and a key with the first slot being the cordinate that it starts
     * @param {Array} from
     * @param {string} pattern
     * @param {{[x: string]: Slot;}} key
     * @returns {ChestGUI}
     * @example
     * gui.pattern([2, 1], [
            `xxoxx`,
            `x_a_x`,
            `o___o`
        ], {
            x: { type: `button`, item: { typeId: `minecraft:stained_glass`, data: 14 } },
            a: { type: `button`, item: { typeId: `minecraft:anvil` } },
            o: { type: `input` }
        })
     */
    pattern(from, pattern, key) {
        for (let y = 0; y < pattern.length; y++) {
            for (let x = 0; x < pattern[y].length; x++) {
                if (key[pattern[y][x]]) this.setSlot(indexFromXY(from[0] + x, from[1] + y), key[pattern[y][x]].type, key[pattern[y][x]].item)
            }
        }
        return this
    }
    /**
     * deletes all items in input slots
     * @returns {ChestGUI}
     */
    clearInputs() {
        const inv = this.entity.getComponent(`inventory`).container
        for (let i = 0; i < inv.size; i++) {
            if (!this.slots[i] || this.slots[i]?.type !== `input` || !inv.getItem(i)) continue
            inv.setItem(i, new ItemStack(Items.get(`minecraft:dirt`), 0))
        }
        return this
    }

    /**
     * Sets multiple slots 
     * @param {Object.<number, Slot>} slots
     * @param {boolean} clearPreviousSlots - If this is true all slots will be cleared in the gui and then the slots provided will be set
     * @example 
     *gui.setSlots({
        12: { type: `input` },
        13: { type: `button`, item: { typeId: `minecraft:diamond`, nameTag: `Click Me` } },
        14: { type: `output`, item: { typeId: `minecraft:diamond_sword`, nameTag: `Take me!!!!` } }
      }, true)
     */
    setSlots(slots, clearPreviousSlots) {
        this.slots ??= {}

        if (!clearPreviousSlots) {
            for (const key in slots) {
                this.slots[key] = slots[key];
            }
        } else {
            this.slots = slots
        }

        return this
    }

    /**
  * @param {number} slot
  * @param {string} type 
  * @param {(ItemObject)} item 
  */
    set Fill(item) {
        this.fill = item
        return this
    }

    /**
     * gets the SLOT object at a index or cordinate and will not accurately reflect whats actually in the slot if the slot is a input/output 
     * @param {number|Array} slot 
     * @returns {Slot}
     */
    getSlot(slot) {
        if (typeof slot === `object`) slot = indexFromXY(slot[0], slot[1])
        return this.slots[slot]
    }
    /**
     * gets the ItemStack object at a index or cordinate and will accurately reflect whats actually in the slot if the slot is a input/output 
     * @param {number|Array} slot 
     * @returns {ItemStack|undefined}
     */
    getItem(slot) {
        if (typeof slot === `object`) slot = indexFromXY(slot[0], slot[1])
        return this.entity.getComponent(`inventory`).container.getItem(slot)
    }

    /**
     * Sets the guis fill
    * @param {number} slot
    * @param {string} type 
    * @param {(ItemObject)} item 
    */
    setFill(item) {
        this.fill = item
        return this
    }

    /**
     * @param {boolean} clear - this is if you want the page's events to overide any current events on the gui
     * @param {Page} page 
     */
    page(clear, page) {
        if (!page.slots) throw new Error(`Page is missing slots`)
        this.title = page.title
        this.fill = page.fill
        this.slots = page.slots
        this.closeCondition = page.closeCondition

        if (this.summoned) this.initPage()

        if (page.events && clear) {
            this.events = page.events
        }
    }

    /**
     * Initalizes a page and all its items
     */
    initPage() {
        if (this.sys) system.clearRunSchedule(this.sys)

        this.entity.nameTag = this.title

        /** @type {InventoryComponentContainer} */
        const inv = this.entity.getComponent(`inventory`).container

        for (let i = 0; i < inv.size; i++) {
            if (this.slots[i]?.item) inv.setItem(i, this.slots[i].item instanceof ItemStack ? this.slots[i].item : itemObjToItemStack(this.slots[i].item))
            else if (!this.slots[i] && this.fill) inv.setItem(i, itemObjToItemStack(this.fill instanceof ItemStack ? this.fill : itemObjToItemStack(this.fill)))
            else inv.setItem(i, air)
        }

        this.sys = system.runSchedule(() => {
            if (!this.entity.getComponent(`health`) || !this.player.getComponent(`health`) || this.player.hasTag(`in-gui`) == false || this.closeCondition && this.closeCondition(this) || this.selected !== this.player.selectedSlot) {
                this.close()
            }

            this.validate()
            const { x, y, z } = this.player.location
            this.entity.teleport(new Vector(x, y + 1, z), this.player.dimension, 1, 1, true)

        }, 1)


    }

    /**
     * Closes the gui and gives and input slots with items back to the player
     */
    close() {
        if (this.sys) system.clearRunSchedule(this.sys)

        this.removeAllListeners()
        if (this.player.getComponent(`health`)) this.player.removeTag(`in-gui`);

        if (this.entity.getComponent(`minecraft:inventory`)) {
            const inv = this.entity.getComponent(`minecraft:inventory`).container

            for (let i = 0; i < inv.size; i++) {
                if (!this.slots[i] || this.slots[i]?.type !== `input` || !inv.getItem(i)) continue
                this.player.getComponent(`inventory`).container.addItem(inv.getItem(i))
            }
        }
        this.entity.triggerEvent(`is:despawn`)

    }

    /**
     * Allows you to set up a custom close condition that closes the gui when its TRUE
     * 
     * A common close condition is closing if the player moves or changes rotation
     * @param {(arg: ChestGUI) => boolean} condition 
     */
    setCloseCondition(condition) {
        this.closeCondition = condition
        return this
    }
    /**
     * sets a condition for the gui to open. 
     * 
     * Honestly i dont recommend using this
     * @param {(arg: Player) => boolean} condition 
     */
    setOpenCondition(condition) {
        system.runSchedule(() => {
            [...world.getPlayers()].forEach(player => {
                if (condition(player) && !player.hasTag(`in-gui`)) {
                    const gui = new ChestGUI()
                    gui.page(true, this)
                    gui.summon(player)
                }
            })
        })
    }

    /**
     * Generates a input grid from one cordinate to another
     * @param {number} fromX 
     * @param {number} fromY 
     * @param {number} toX 
     * @param {number} toY 
     * @returns {ChestGUI}
     */
    generateInputGrid(fromX, fromY, toX, toY) {
        try {
            for (let x = fromX; x <= toX; x++) {
                for (let y = fromY; y <= toY; y++) {

                    this.setSlot(indexFromXY(x, y), `input`);
                }
            }
        } catch (e) { console.warn(e) }
        return this
    }
    /**
     * Generates a input grid from one cordinate to another
     * @param {number} fromX 
     * @param {number} fromY 
     * @param {number} toX 
     * @param {number} toY 
     * @param {keyof Types} type
     * @param {(i: number) => Slot["item"]} callback - callback to generate the slots must return a item object or slot
     * @returns {ChestGUI}
     */
    grid(fromX, fromY, toX, toY, type, callback) {
        let i = 0
        for (let y = fromY; y <= toY; y++) {
            for (let x = fromX; x <= toX; x++) {
                this.setSlot(indexFromXY(x, y), type, callback && callback(i));
                i++
            }
        }
        return this
    }
}
/**
 * While the chest gui class represents the actual chest gui in game this class just represents the slots, title, events, ect.
 * and came be used to make easily reusable pages by just using ChestGUI.page()
 */
export class Page extends ChestGUI {
    constructor() {
        super()
        this.summon = null
        this.summoned = null
        this.initPage = null
        this.close = null
    }




}
