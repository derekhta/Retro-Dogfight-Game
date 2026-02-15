const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
    console.log('Pilot joined:', socket.id);

    socket.on('joinGame', (username) => {
        // Cap at 10 players for performance
        if (Object.keys(players).length >= 10) {
            socket.emit('error', 'Server is full! Max 10 pilots.');
            return;
        }

        players[socket.id] = {
            id: socket.id,
            name: username || "PILOT",
            x: Math.random() * 700 + 50,
            y: Math.random() * 500 + 50,
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
            // io.emit ensures the local player sees themselves move too
            io.emit('updateState', players);
        }
    });

    socket.on('bulletHit', (victimId) => {
        if (players[socket.id] && players[victimId]) {
            players[socket.id].score += 1;
            // Respawn logic
            players[victimId].x = Math.random() * 700 + 50;
            players[victimId].y = Math.random() * 500 + 50;
            io.emit('updateState', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updateState', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server live on port ${PORT}`));
