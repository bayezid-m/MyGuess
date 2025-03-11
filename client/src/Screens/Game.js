// src/Game.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from '../socket.js'
import axios from "axios";

const Game = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [guess, setGuess] = useState("");
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const user = JSON.parse(localStorage.getItem("user"));
  const [roomInfo, setRoomInfo] = useState();
  const [winner, setWinner] = useState("");
  const [average, setAverage] = useState("");

  const fetchRoomInfo = async () => {
    const roomInfo = await axios.get(`http://localhost:2000/api/room/info/${roomCode}`)

    setRoomInfo(roomInfo.data.roomInfo)
    //setPlayers(roomInfo.data.roomInfo.players)
  }

  useEffect(() => {
    fetchRoomInfo();

  }, []);


  // const fetchGameResult = () => {
  //   socket.on("round_result", (result) => {
  //     console.log("Round result received:", result);
  //     console.log("i am called")
  //     setWinner(result.winner);
  //     setAverage(result.average);
  //     fetchRoomInfo();
  //   });

  // }

  // Submit guess function
  const submitGuess = async () => {
    const username = user?.username
    //console.log(guess)
    if (username && roomCode && guess) {
      try {
        const response = await axios.post("http://localhost:2000/api/room/submit", { roomCode, username, guess });
        if (response.status === 200) {
          console.log("Hello world ")
          //fetchGameResult()
        }
        socket.on("round_result", (result) => { 
          console.log("i am last player")    
            setWinner(result.winner)
            setAverage(result.average)
        });
        const gameResult = {
          winner: winner,
          average: average,
        };
        console.log(gameResult)
        navigate(`/result/${roomCode}`, { state: gameResult });
      } catch (error) {
        console.error("Error joining room", error);
      }
    }
  };

  // useEffect(() => {
  //   socket.on("round-end", () => {
  //     navigate(`/result/${roomCode}`);
  //   });

  //   socket.on("player-guess", (newPlayer) => {
  //     setPlayers((prevPlayers) => {
  //       const updatedPlayers = prevPlayers.map((player) =>
  //         player.username === newPlayer.username ? newPlayer : player
  //       );
  //       return updatedPlayers;
  //     });
  //   });

  //   return () => {
  //     socket.off("round-end");
  //     socket.off("player-guess");
  //   };
  // }, [roomCode, navigate]);

  return (
    <div>
      <h1>Game - Room {roomCode}</h1>
      <h2>Round {roomInfo?.currentRound}</h2>
      <input
        type="number"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Guess a number (0-100)"
      />
      <button onClick={submitGuess}>Submit Guess</button>

      {/* <h3>Players:</h3>
      <ul>
        {players.map((player, index) => (
          <li key={index}>
            {player.username} - {player.guess || "Not submitted yet"}
          </li>
        ))}
      </ul> */}
    </div>
  );
};

export default Game;
