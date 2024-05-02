import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
// app.options('*', cors(cors({
//     origin : true,
//     credentials : true
// })))
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))
app.use(cookieParser())

app.get('/check-health', (req, res) => {
    return res.send('Hyy the site is healthy');
})


// Routes imports 
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import likeRouter from './routes/like.routes.js'
import commentRouter from './routes/comment.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
import tweetRouter from './routes/tweet.routes.js'


// Routes declarations 
app.use('/api/v1/users', userRouter)
app.use('/api/v1/videos', videoRouter)
app.use('/api/v1/subscriptions', subscriptionRouter)
app.use('/api/v1/playlists', playlistRouter)
app.use('/api/v1/likes', likeRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/dashboard', dashboardRouter)
app.use('/api/v1/tweet', tweetRouter)

export { app }