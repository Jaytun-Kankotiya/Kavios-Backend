import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";
import initializeDatabase from "./db/db.connection.js";
import authRoutes from "./routes/authRoutes.js";
import imageRouter from "./routes/imageRoutes.js";
import albumRouter from "./routes/albumRoutes.js";
import userRouter from './routes/userRoutes.js';

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}))

initializeDatabase()

app.use('/api/auth', authRoutes)

app.use('/api/user', userRouter)

app.use('/api/images', imageRouter);

app.use('/api/albums', albumRouter)


app.get('/api/profile', (req, res) => {
    const token = req.cookies.session
    if(!token){
        return res.status(401).json({error: "Unautorized"})
    }
    req.json({message: "User is logged in", token})
})

app.get("/", (req, res) => {
  res.send("Server is running");
});

const PORT = 4000
app.listen(PORT, () => {
    console.log(`Server connected on ${PORT}`)
})