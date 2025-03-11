// src/socket.js
import { io } from "socket.io-client";

// Change the URL to match your backend URL
const socket = io("http://localhost:2000");

export default socket;
