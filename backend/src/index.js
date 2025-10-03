import dotenv from "dotenv"
import { createServer } from 'http'
import connectDB from "./db/index.js"
import app from './app.js'
import WebSocketService from './services/websocket.service.js'

dotenv.config({
    path: './.env'
})

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
WebSocketService.initialize(server);

connectDB()
.then(() => {
        const PORT = process.env.PORT || 4200;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`WebSocket service initialized`);
            console.log(`Analytics API available at http://localhost:${PORT}/api/analytics`);
            console.log(`✅ Duplicate product names are now allowed`);
        })
    })

.catch((err) => {
    console.log("MONGO DB connection has FAILED !!! ", err)
})