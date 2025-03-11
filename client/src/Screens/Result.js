// src/Result.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import socket from '../socket.js'
import axios from "axios";

const Result = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [winner, setWinner] = useState("");
  const [average, setAverage] = useState();
  const user = JSON.parse(localStorage.getItem("user"));
  const [roomInfo, setRoomInfo] = useState();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (roomCode) {
      socket.emit("join_room", roomCode);
      console.log(`Joining room: ${roomCode}`);
    }
  }, [roomCode]);



  const fetchRoomInfo = async () => {
    const roomInfo = await axios.get(`http://localhost:2000/api/room/info/${roomCode}`)
    console.log(roomInfo.data)
    setRoomInfo(roomInfo.data.roomInfo)
    setPlayers(roomInfo.data.roomInfo.players)
    setWinner(roomInfo.data.roomInfo.roundWinner);
    setAverage(roomInfo.data.roomInfo.roundAverage);
  }

  useEffect(() => {
    fetchRoomInfo();
    // if (location.state) {
    //   setWinner(location.state.winner);
    //   setAverage(location.state.average);
    // }
  }, []);

  // console.log(roomInfo?.roundAverage)
  useEffect(() => {
    const timeout = setTimeout(() => {
      socket.on("round_result", (result) => {
        console.log("Round result received:", result);
        console.log("I am called");
        //setWinner(result.winner);
        //setAverage(result.average);
        fetchRoomInfo();
      });
    }, 1000);
    return () => {
      clearTimeout(timeout);
      socket.off("round_result");
    };
  }, []);

  useEffect(() => {
    socket.on('received_start_game', (data) => {
      console.log(data, "room started game")
      navigate(`/game/${roomCode}`);
    })
  }, [])

  const startNextLevel = async () => {
    try {
      await axios.post("http://localhost:2000/api/room/nullmaker", { roomCode });
      socket.emit("start_game", roomCode);
      navigate(`/game/${roomCode}`);
      //setWinner("");
      //setAverage(null);
    } catch (error) {
      console.error("Error joining room", error);
    }

  };

  return (
    <div>
      <h1>Round {roomInfo?.currentRound - 1} result.</h1>
      {!winner && !average ? <div>
        <h2>Wait for other players</h2>
      </div> : <div>
        <h2>Winner: {winner}</h2>
        <h2>Round Average: {average}</h2>
        <h3>Players:</h3>
        <ul>
          {players.map((player, index) => (
            <li key={index}>{player.username}: {player?.score}</li>
          ))}
        </ul>
      </div>}

      {(user?.username === roomInfo?.host) && (players.length > 2) && (
        <button onClick={startNextLevel}>Play Next Round</button>
      )}

    </div>
  );
};

export default Result;
