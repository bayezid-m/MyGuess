import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from './Screens/Home';
import Lobby from './Screens/Lobby';
import Game from './Screens/Game';
import Result from './Screens/Result';
import PlayerLobby from "./Screens/PlayerLobby";

function App() {
  //const [toast, setToast] = useState(null);

  // const showToast = (message) => {
  //   setToast(message);
  //   setTimeout(() => setToast(null), 3000); // hide after 3 seconds
  // };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:roomCode" element={<Lobby />} />
        <Route path="/game/:roomCode" element={<Game />} />
        <Route path="/result/:roomCode" element={<Result />} />
        <Route path="/playerLobby/:roomCode" element={<PlayerLobby/>}/>
      </Routes>
    </Router>
  );
}

export default App;
