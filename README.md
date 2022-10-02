
<div align="center">

![Logo](/img/logo.png)

idk is a minecraft inventory bot. 

It deposits and withdraws items from a storage area of chests. All the items are shown on a website and you can control the bot from there. No redstone required!

[About](#about) •
[Installation](#installation) 

</div>

## About

idk is divided into 3 parts:

### Website

![Website](/img/screenshot-rocks (1).png)

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

![Storage](/img/Screenshot from 2022-10-02 09-06-44.png)

Base action performer, listens for requests from inventory takes the following actions:
- move (moves the players position by a breath first pathing)
- open 
- close
- left click
- right click

Built with: javascript and mineflayer

I've written more about it on my website [pucula.com/idk](pucula.com/idk)

# Installing

Since this is a personal project, sorry I haven't spend much time to help with installation process but you'll need:
- A minecraft account, user/pass are stored as envirnoment variable
- Running a minecraft server with the chests set up.
- Postgres with an items database and tables. 


# Log

2022-06-05: 
- Started

2022-06-06: 
- Simple pathfinding added. Uses sparce representation for the map and bfs until destination is fund returing the path. Another function converts that to turns. In the bot, it can just walk straight lines from there.
- Taking inventory on the storage
- Adding new items into the database from deposit

2022-06-10:
- Take multiple items at a time; 27 slots in the player inventory

2022-06-15:
- Withdraw items in a full stack

2022-06-16:
- Deposit and withdraw less than full stacks 

2022-08-12:
- Website built
- Front end sends widthdraw message to backend
- Integrated inventory with backend, connected through queue
- Store redesigned

2022-08-21:
- Moved from rust, too much complexity with async webserver, database and messaging
- Now using typescipt
- Player attached to back, no need for communication layer

2022-09-10
- ChestType added
- Ability to withdraw and deposit from shulkers 

2022-09-18
- Item and Location types added
- Moved from private repo to public repo, hello!
