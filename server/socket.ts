import { Server } from "socket.io";
import express from "express";
import { createServer } from "http";
import User from "./models/User";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        //! replace later
        origin: "*",
    },
});

// const usersOnline = new Set();
// io.on("connection", async (socket) => {
//     console.log("user connected:", socket.id);

//     const user = await getUserFromToken(socket.handshake.auth.token);
//     if (!user) {
//         console.log("user not authenticated");
//         return socket.disconnect();
//     }
//     console.log("user authenticated:", user.username);

//     socket.join(user._id);
//     usersOnline.add(user._id);

//     socket.on("chat-message", async (msg) => {
//         console.log("message: ", msg);
//     });

//     socket.on("disconnect", () => {
//         console.log("user disconnected", socket.id);
//     });
// });

export { app, server };
