import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit : '16kb'}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))
app.use(cookieParser())


// Routes imports 
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
// Routes declarations 
app.use('/api/v1/users', userRouter)
app.use('/api/v1/videos', videoRouter)

export { app }