<br/>
<div align="center">

<img src="https://raw.githubusercontent.com/lazydancer/idk/c35cb2b8268f87668374073a1b580b413939eeca/img/fourth.gif" width="91"/><p></p>

idk is a minecraft inventory bot. 

Deposit and withdraw items from storage. All the items are shown on a website and you can control the bot from there. No redstone required!

[About](#about) •
[Installation](#installation) 

</div>

## About

Divided into 3 parts:
 - Website
 - Inventory
 - Player

### Website

![Website](https://raw.githubusercontent.com/lazydancer/idk/main/img/screenshot-rocks%20(1).png)

This displays and controls the items available in your inventory. Withdraw and deposit items from here 

Built with svelte and tailwind.css,

### Inventory
A simple api to take requests from frontend:
- list
- withdraw
- deposit

Model of the inventory system and a majority of the logic. Takes the inputs above and converts them into actions to be run by the player. Task completion updates database

Built with: typescript and postgres 

### Player

![Storage](https://github.com/lazydancer/idk/blob/main/img/Screenshot%20from%202022-10-02%2009-06-44.png?raw=true)

Base action performer, listens for requests from inventory takes the following actions:
- move (moves the players position by a breadth-first pathing)
- open 
- close
- left click
- right click

Built with: javascript and mineflayer

I've written more about it on my website [pucula.com/idk](https://pucula.com/idk)

# Installing

Since this is a personal project, sorry I haven't spend much time to help with installation process. You'll need:

- Local minecraft server running 1.19.3
- A minecraft account, user/pass are stored as environment variable
- A minecraft server with the chests set up. (config in player.ts)
- Postgres database (config in db.ts)

To run,
- Start Website: cd front, npm install, npm run dev
- cd ..
= Start Bot: cd back, npm install, npm start
