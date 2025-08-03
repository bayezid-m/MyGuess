// src/Lobby.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import socket from '../socket.js'
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';

const Lobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  //const { state } = useLocation();
  const [players, setPlayers] = useState([]);
  const [roomInfo, setRoomInfo] = useState();

  const user = JSON.parse(localStorage.getItem("user"));
  console.log(user)

  useEffect(() => {
    if (roomCode) {
      socket.emit("join_room", roomCode);
      console.log(`Joining room: ${roomCode}`);
    }
  }, [roomCode]);
  
  const fetchRoomInfo = async () => {
    const roomInfo = await axios.get(`http://localhost:2000/api/room/info/${roomCode}`)

    setRoomInfo(roomInfo.data.roomInfo)
    setPlayers(roomInfo.data.roomInfo.players)
  }

  useEffect(() => {
    //console.log("I am here")
    fetchRoomInfo();
    // if(roomCode){
    //   toast.success("Room created successfully", {
    //     position: "top-right",
    //   });
    // }
    // socket.emit("join-lobby", { roomCode }); // Emit event when player joins lobby

    // socket.on("player-joined", (newPlayer) => {
    //   setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);

    // });

    // return () => {
    //   socket.off("player-joined");
    // };
    // 
  }, []);
  console.log(user?.username)
  console.log(roomInfo)
  console.log(roomInfo?.host)
  // Start the game by emitting the 'st  art-game' event


  useEffect(() => {
    //console.log("I am here second")

    socket.on('receiverd_player', (data) => {
      console.log(data, "joined the room")
      //setPlayers(prev => [...prev, data])
      fetchRoomInfo()
    })
  }, [])

  useEffect(() => {
    socket.on('received_start_game', (data) => {
      console.log(data, "room started game")
      navigate(`/game/${roomCode}`);
    })
  }, [])

  const startGame = async () => {
    try {
      await axios.post("http://localhost:2000/api/room/start", { roomCode });
      socket.emit("start_game", roomCode); // Emit event to start the game
      navigate(`/game/${roomCode}`);
    } catch (error) {
      console.error("Error joining room", error);
    }
  };


  return (
    <div>
      <h1>Lobby - Room Code: {roomCode}</h1>
      <h2>Welcome, {user?.username}</h2>
      {(user?.username === roomInfo?.host) && (players.length > 1) && (
        <button onClick={startGame}>Start Game</button>
      )}

      <h3>Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player.username}</li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
