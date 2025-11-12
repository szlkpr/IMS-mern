
import dotenv from "dotenv";
dotenv.config({ path: './.env' });

import { createServer } from 'http';
import connectDB from "./db/index.js";
import app from './app.js';
import WebSocketService from './services/websocket.service.js';



// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
WebSocketService.initialize(server);

connectDB()
.then(() => {
        const PORT = process.env.PORT || 4200;
        server.listen(PORT, () => {
            // console.log(`Server is running on port ${PORT}`);
            // console.log(`WebSocket service initialized`);
            // console.log(`Analytics API available at http://localhost:${PORT}/api/analytics`);
        })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use. Please:`);
                console.error(`   1. Kill the process using port ${PORT}, or`);
                console.error(`   2. Set a different PORT in your .env file`);
                console.error(`\n   On Windows, you can kill the process with:`);
                console.error(`   netstat -ano | findstr :${PORT}`);
                console.error(`   taskkill /PID <PID> /F`);
                process.exit(1);
            } else {
                console.error('❌ Server error:', err);
                process.exit(1);
            }
        });
    })

.catch((err) => {
    // console.log("MONGO DB connection has FAILED !!! ", err)
    process.exit(1);
})