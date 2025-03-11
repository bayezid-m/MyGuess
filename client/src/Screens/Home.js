// src/Home.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from '../socket.js'

const Home = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");

  // Create room function
  const handleCreateRoom = async () => {
    if (username) {
      try {
        const response = await axios.post("http://localhost:2000/api/room/create", {
          host: username,
        });
        const roomCode = response.data.roomCode;
        const user = { username: username, roomCode: roomCode };
        localStorage.setItem("user", JSON.stringify(user));
        //socket.emit("create-room", { roomCode, hostUsername: username }); // Emit event to server
        navigate(`/lobby/${roomCode}`);
      } catch (error) {
        console.error("Error creating room", error);
      }
    }
  };

  // Join room function
  const handleJoinRoom = async () => {
    if (username && roomCode) {
      try {
        await axios.post("http://localhost:2000/api/room/join", { roomCode, username });
        const user = { username: username, roomCode: roomCode };
        localStorage.setItem("user", JSON.stringify(user));
        socket.emit('player_joined', {username}); // Emit event to server
        navigate(`/lobby/${roomCode}`);
      } catch (error) {
        console.error("Error joining room", error);
      }
    }
  };

  return (
    <div>
      <h1>Welcome to the Game</h1>
      <button onClick={() => setShowCreateModal(true)}>Create Room</button>
      <button onClick={() => setShowJoinModal(true)}>Join Room</button>

      {/* Modal for creating room */}
      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Enter Your Username</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <button onClick={handleCreateRoom}>Create Room</button>
            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Modal for joining room */}
      {showJoinModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Enter Your Username and Room Code</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Room Code"
            />
            <button onClick={handleJoinRoom}>Join Room</button>
            <button onClick={() => setShowJoinModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
