# Chest-GUI
![logo](icon.png)  
This is my attempt to create a good way to make chest guis on bedrock edition and it may be horribly buggy

## Features
* Disregards mobile ui players completley (good thing)
* There are tons of different ways to make the layouts of the guis as seen below
* Lots of QOL features for no reason other than to make it easier on the user of the addon
* Comes with a simple event emitter that you can use if you want (Example on how to below)

```js

const client = new EventEmitter()

client.on(`chat`, (data) => {
    world.say(data.message)
})

world.events.beforeChat.subscribe((data) => {
    client.emit(`chat`, data)
})


```



## Layout Creation Examples

Here is a example of how one the many ways to define a simple GUI 

```js
import { ChestGUI } from "./chestGUI.js";

//PLEASE NOTE that when setting slots anywhere put "minecraft:" or the items namespace or everything will die
const gui = new ChestGUI()
    .setTitle(`My Gui`)
    .setFill({typeId: `minecraft:stained_glass`, data: 15})
    .setSlot(12, `input`)
    .setSlot(13, `button`, { typeId: `minecraft:diamond`, nameTag: `Click Me` })
    .setSlot(14, `output`, { typeId: `minecraft:diamond_sword`, nameTag: `Take Me!!!` })
    
```


Some more examples are using the ChestGUI.pattern method which uses a pattern and key to make slots or using the page methods which takes a page class or literal object

```js
import { ChestGUI } from "./chestGUI.js";

const gui = new ChestGUI()
gui.setTitle(`My GUI`)
gui.setFill({typeId: `minecraft:stained_glass`, data: 15})
gui.pattern([0,0], [
    `_________`,
    `___IBO___`,
    `_________`,
], {
    "I": {type: `input`},
    "B": {type: `button`, item: {typeId: `minecraft:diamond`, nameTag: `Click Me`}},
    "O": {type: `output`, item: {typeId: `minecraft:diamond_sword`, nameTag: `Take me!!!!`}}
})
```

```js
import { ChestGUI } from "./chestGUI.js";

 const gui = new ChestGUI()

gui.page(true, {
    title: `My gui`,
    fill: new ItemStack(Items.get(`minecraft:stained_glass`), 1,15),
    slots: {
        12: {type: `input`}, 
        13: {type: `button`, item: {typeId: `minecraft:diamond`, nameTag: `Click Me`}}, 
        14: {type: `output`, item: {typeId: `minecraft:diamond_sword`, nameTag: `Take me!!!!`}} 
    }
})

```
 Note there are 3 gui size types that are all set by prefixing your title with them
* spaced:
* double_chest:
* single_row:


## Events and Functionality

The examples above are just examples of creating layouts now here are some examples on adding real functionality
below is a example that creates a gui with a crafting table pattern that warns to the console when a slot with the type of  input is interacted with

```js
const gui = new ChestGUI()
.setTitle(`double_chest:Crafting Table`)
.pattern([1, 1], [
    `000___`,
    `000__o`,
    `000___`
], {
    0: { type: `input` },
    o: { type: `output` }
})
.setFill(new ItemStack(Items.get(`minecraft:stained_glass`), 1, 15))

gui.on(`input`, (data) => {

    console.warn(`${data.type} ${data.slot} ${data.item?.typeId}`)
})

```

The gui below is a double chest with a bunch of random slots of varied types. When any of them are interacted with, no matter the type, a message warns consoles to be careful. If you look at slot 35, it has an exe property which will run when that specific slot is interacted with; this function will kill the player and close the gui.

```js
const gui = new ChestGUI()
.setTitle(`double_chest:Crafting Table`)
.setSlots({
    0: {type: `button`, item: {typeId: `minecraft:barrier`}},
    12: {type: `button`, item: {typeId: `minecraft:diamond`}},
    16: {type: `input`},
    35: {type: `button`, item: {typeId: `minecraft:coal`}, exe: (int) => { int.gui.close(); int.player.kill()}}
})

gui.on(`any`, (data) => {
    console.warn(`Be careful!`)
})
```
