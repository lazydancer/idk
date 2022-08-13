# idk

### front
Website

### inventory
Hosts api to take requests from front. Delivers data
Model of the inventory system, receives requests from back. Sends actions to player

### player
Base action performer, listens for requests from inventory


2021-06-05: 
- Started
2021-06-06: 
- Simple pathfinding added. Uses sparce reprentation for the map and bfs until destination is fund returing the path. Another function converts that to turns. In the bot, it can just walk straight lines from there.
- Taking inventory on the storage
- Adding new items into the database from deposit
2021-06-10:
- Take multiple items at a time; 27 slots in the player inventory
2021-06-15:
- Withdraw
2021-06-16:
- Deposit and withdraw less than full stacks 
2021-08-12:
- Website built
- Front end sends widthdraw message to backend
- Integrated inventory with backend, connected through queue
- Store redesigned