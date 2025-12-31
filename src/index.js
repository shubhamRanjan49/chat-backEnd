import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.route.js";

import { Server } from "socket.io";
import http from "http";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// SOCKET.IO CONNECTION
io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
    });
});

// Use the HTTP server to listen for requests
server.listen(PORT, () => {
    console.log(`✅ Server is running on PORT: ${PORT}`);
    connectDB(); // Call the function to connect to MongoDB
});