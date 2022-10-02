
<div align="center">

![Logo](https://raw.githubusercontent.com/lazydancer/idk/0979dcfd4745d6a4848bcd430e977de8bd648d6f/img/logo.svg)

idk is a minecraft inventory bot. 

It deposits and withdraws items from a storage area of chests. All the items are shown on a website and you can control the bot from there. No redstone required!

[About](#about) •
[Installation](#installation) 

</div>

## About

idk is divided into 3 parts:

### Website

![Website](https://raw.githubusercontent.com/lazydancer/idk/main/img/screenshot-rocks%20(1).png)

This displays items availbe in your inventory and have the ability to place items into a cart to withdraw them. In addition, also allows the start the depositing process 

Built with svelte and tailwind.css,

### Inventory / Database
A simple api to take requests from frontend:
- list
- withdraw
- deposit

Model of the inventory system and a majority of the logic. Takes the inputs above and converts them into actions to be run by the player. After recieiving confirmation of task, upates database

Built with: typescript and postgres 

### Minecraft Player / Storage

![Storage](https://github.com/lazydancer/idk/blob/main/img/Screenshot%20from%202022-10-02%2009-06-44.png?raw=true)

Base action performer, listens for requests from inventory takes the following actions:
- move (moves the players position by a breath first pathing)
- open 
- close
- left click
- right click

Built with: javascript and mineflayer

I've written more about it on my website [pucula.com/idk](https://pucula.com/idk)

# Installing

Since this is a personal project, sorry I haven't spend much time to help with installation process but you'll need:
- A minecraft account, user/pass are stored as envirnoment variable
- Running a minecraft server with the chests set up.
- Postgres with an items database and tables. 

