# idk

### front
Website

### inventory
Hosts api to take requests from front. Delivers data
Model of the inventory system, receives requests from back. Sends actions to player

### player
Base action performer, listens for requests from inventory


2021-05-05: Started
2021-05-06: 
- Simple pathfinding added. Uses sparce reprentation for the map and bfs until destination is fund returing the path. Another function converts that to turns. In the bot, it can just walk straight lines from there.
- Taking inventory on the storage
- Adding new items into the database from deposit