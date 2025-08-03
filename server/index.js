const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config()

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

const PlayerSchema = new mongoose.Schema({
    username: String,
    score: { type: Number, default: 0 },
    guess: { type: Number, default: null },
});

const RoomSchema = new mongoose.Schema({
    roomCode: String,
    players: [PlayerSchema],
    currentRound: { type: Number, default: 1 },
    gameStarted: { type: Boolean, default: false },
    roundWinner: { type: String, default: null },
    roundAverage: { type: Number, default: null },
    host: String,
});

const Room = mongoose.model("Room", RoomSchema);

app.get('/', async (req, res) => {
    return res.json({
        "message": "Hi, I am from server"
    })
})

// Function to generate a random 6-digit room code
const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a room
app.post("/api/room/create", async (req, res) => {
    const { host } = req.body;
    const roomCode = generateRoomCode();
    const newRoom = new Room({ roomCode, players: [{ username: host, score: 0 }], host });
    await newRoom.save();
    res.json({ roomCode });
});

// Join a room
app.post("/api/room/join", async (req, res) => {
    const { roomCode, username } = req.body;
    let room = await Room.findOne({ roomCode });
    if (!room || room.players.length >= 10) {
        return res.status(400).json({ message: "Room not found or full" });
    }
    room.players.push({ username, score: 0 });
    await room.save();
    //io.to(host).emit(username, "Joined");
    res.json({ message: "Joined successfully" });
});

//get room data

app.get("/api/room/info/:roomCode", async (req, res) => {
    const roomCode = req.params.roomCode
    let room = await Room.findOne({ roomCode: roomCode });
    if (!room) {
        return res.status(400).json({ message: "Room not found or full" });
    }
    res.json({ roomInfo: room });
})

// Start the game
app.post("/api/room/start", async (req, res) => {
    const { roomCode } = req.body;
    let room = await Room.findOne({ roomCode });
    if (!room) return res.status(400).json({ message: "Room not found" });
    room.gameStarted = true;
    await room.save();
    //io.to(roomCode).emit("game-started", {});
    res.json({ message: "Game started" });
});

//when player submit their guess
app.post("/api/room/submit", async (req, res) => {
    const { roomCode, username, guess } = req.body;
    let room = await Room.findOne({ roomCode });
    if (!room) {
        return res.status(400).json({ message: "Room not found or full" });
    }
    let player = room.players.find((p) => p.username === username);
    if (player) {
        player.guess = guess;
        await room.save();
    }


    // if (room.players.every((p) => p.guess !== null)) {
    //     // Set multiplier based on current round (1 to 5)
    //     const multipliers = [0.9, 0.8, 0.7, 0.6, 0.5];
    //     const currentRoundIndex = room.currentRound < 5 ? room.currentRound : 4; // prevent overflow
    //     const multiplier = multipliers[currentRoundIndex];

    //     // Calculate average
    //     let avg = room.players.reduce((sum, p) => sum + p.guess, 0) / room.players.length;

    //     // Apply round-specific multiplier
    //     let target = avg * multiplier;

    //     // Determine closest guess
    //     let winner = room.players.reduce((prev, curr) =>
    //         Math.abs(curr.guess - target) < Math.abs(prev.guess - target) ? curr : prev
    //     );

    //     // Update scores and state
    //     winner.score += 1;
    //     room.players.forEach((p) => {
    //         if (p.username !== winner.username) p.score -= 1;
    //         p.guess = null; // reset guess for next round
    //     });

    //     room.roundWinner = winner.username;
    //     room.roundAverage = target.toFixed(2);
    //     room.currentRound++;

    //     await room.save();

    //     // Emit result to all players in room
    //     io.to(roomCode).emit("round_result", {
    //         winner: winner.username,
    //         average: roundAverage
    //     });
    // }

    // return res.status(200).json({ message: "Guess submitted successfully" });
    if (room.players.every((p) => p.guess !== null)) {
        const multipliers = [0.9, 0.8, 0.7, 0.6, 0.5];
        const currentRoundIndex = room.currentRound < 5 ? room.currentRound : 4;
        const multiplier = multipliers[currentRoundIndex];

        const avg = room.players.reduce((sum, p) => sum + p.guess, 0) / room.players.length;
        const target = Math.round((avg * multiplier) * 100) / 100;

        // Find the closest guess (tie-breaker: first occurrence wins)
        let winner = room.players[0];
        let smallestDiff = Math.abs(winner.guess - target);

        for (let i = 1; i < room.players.length; i++) {
            const diff = Math.abs(room.players[i].guess - target);
            if (diff < smallestDiff) {
                winner = room.players[i];
                smallestDiff = diff;
            }
        }

        // Update scores
        winner.score += 1;
        room.players.forEach(p => {
            if (p.username !== winner.username) {
                p.score -= 1;
            }
            p.guess = null;
        });

        room.roundWinner = winner.username;
        room.roundAverage = target.toFixed(2);
        room.currentRound++;

        await room.save();

        io.to(roomCode).emit("round_result", {
            winner: winner.username,
            average: target.toFixed(2)
        });
    }

    return res.status(200).json({ message: "Guess submitted successfully" });


})

//next level with null round winner and round average
app.post("/api/room/nullmaker", async (req, res) => {
    const { roomCode } = req.body;
    let room = await Room.findOne({ roomCode });
    if (!room) return res.status(400).json({ message: "Room not found" });
    room.roundAverage = null;
    room.roundWinner = null;
    await room.save();
    res.json({ message: "Redy for next round" });

})

// End the game early
// app.post("/api/room/end", async (req, res) => {
//     const { roomCode } = req.body;
//     let room = await Room.findOne({ roomCode });
//     if (!room) return res.status(400).json({ message: "Room not found" });
//     io.to(roomCode).emit("game-over", { winner: "Host ended the game" });
//     await Room.deleteOne({ roomCode });
//     res.json({ message: "Game ended" });
// });
//
// WebSocket logic
io.on("connection", (socket) => {
    //console.log('A user connected');
    socket.on("join_room", (roomCode) => {
        socket.join(roomCode);
        console.log('A user connected');
    });

    socket.on('player_joined', (data) => {
        io.emit('receiverd_player', data)
    })

    socket.on('start_game', (roomCode) => {
        //io.emit('received_start_game', data)
        io.to(roomCode).emit('received_start_game', roomCode);
    })


    socket.on('next-round', (roomCode) => {
        io.to(roomCode).emit('next-round-started', roomCode);
    });
});


//new line
const connectDB = async () => {
    const mongoURL = process.env.DB_URL;
    try {
        await mongoose.connect(mongoURL);
        console.log('Database is connected');
    } catch (error) {
        console.log(error);
    }
};

server.listen(2000, () => {
    console.log('Server is running on port 2000.');
    connectDB()
})