import dotenv from "dotenv"
import connectDB from "./db/index.js"
import app from './app.js'

dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
        app.listen(process.env.PORT || 4200, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    })

.catch((err) => {
    console.log("MONGO DB connection has FAILED !!! ", err)
})