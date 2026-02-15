const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// FORCED WEBSOCKET CONFIGURATION
const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket'], // Forces the high-speed protocol
    pingInterval: 1000,        // Checks connection every 1s
    pingTimeout: 5000          // Times out quickly if connection drops
});

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
    socket.on('joinGame', (username) => {
        players[socket.id] = {
            id: socket.id,
            name: username || "PILOT",
            x: Math.random() * 600 + 100,
            y: Math.random() * 400 + 100,
            angle: 0,
            score: 0
        };
        io.emit('updateState', players);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].angle = data.angle;
            // Broadcast to everyone EXCEPT the sender to save bandwidth
            socket.broadcast.emit('updateState', players); 
        }
    });

    socket.on('bulletHit', (victimId) => {
        if (players[socket.id] && players[victimId]) {
            players[socket.id].score += 1;
            players[victimId].x = Math.random() * 600 + 100;
            players[victimId].y = Math.random() * 400 + 100;
            io.emit('updateState', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updateState', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Engine humming on port ${PORT}`));
