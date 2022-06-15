var net = require('net');
var p = require('./player.js')

let player = new p.Player();

function handler(socket) {
    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function(chunk) {
    	cmd = chunk.toString().split(" ")[0]
    	args = chunk.toString().split(" ").slice(1)

        console.log(`Data received from client: ${cmd} ${args}`);

        switch (cmd) {
	        case "open":
	        	player.open(args[0], args[1], args[2]).then(resp => socket.write(resp))
	        	break;
	        case "close":
	        	player.close().then(resp => socket.write(resp))
				break;
	        case "lclick":
	        	player.lclick(args[0]).then(resp => socket.write(resp))
				break;
			case "rclick":
	        	player.rclick(args[0]).then(resp => socket.write(resp))
				break;
	        case "log":
	        	player.log().then(resp => socket.write(resp))
				break;
	        case "move":
	        	player.move(args[0], args[1]).then(resp => socket.write(resp))
				break;
		}

    });
    socket.on('end', socket.end);
}

var server = net.createServer(handler);
server.listen(1337, '127.0.0.1');
console.log("Server listening")