import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors';

const app = express();

// Middlewares
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://videotube-frontend-1.onrender.com'
    ],
    credentials: true
}));

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

app.get('/api/v2/temp', async (req, res) => {
    dummyData = [
        {
            titleClockLabel: "1st · 4:30",
            titleLogo: "pkg:/images/LA_logo.png",
            titleDetailsLabel: "2nd 10, AKP 35",
            LeftBackgroundLogo: "pkg:/images/LA_logo.png",
            RightBackgroundLogo: "pkg:/images/CIA_logo.png",
            LeftTeamLogo: "pkg:/images/LA_logo.png",
            LeftTeamNameLabel: "LAR",
            LeftTeamScoreLabel: "888",
            RightTeamLogo: "pkg:/images/CIA_logo.png",
            RightTeamNameLabel: "CIN",
            RightTeamScoreLabel: "888",
            spreadStatsA: {
                primaryOddsRate: "-2.5",
                secondaryOddsRate: "-118",
            },
            spreadStatsB: {
                primaryOddsRate: "-2.5",
                secondaryOddsRate: "-118",
            },
            moneyStatsA: {
                primaryOddsRate: "-120",
            },
            moneyStatsB: {
                primaryOddsRate: "-118"
            },
            TotalStatsA: {
                primaryOddsRate: "A 843.8",
                secondaryOddsRate: "-118",
            },
            TotalStatsB: {
                primaryOddsRate: "U 888.8",
                secondaryOddsRate: "-118",
            }
        },
        {
            titleClockLabel: "2nd · 4:30",
            titleLogo: "pkg:/images/LA_logo.png",
            titleDetailsLabel: "2nd 10, AKP 35",
            LeftBackgroundLogo: "pkg:/images/LA_logo.png",
            RightBackgroundLogo: "pkg:/images/CIA_logo.png",
            LeftTeamLogo: "pkg:/images/LA_logo.png",
            LeftTeamNameLabel: "LAR",
            LeftTeamScoreLabel: "888",
            RightTeamLogo: "pkg:/images/CIA_logo.png",
            RightTeamNameLabel: "CIN",
            RightTeamScoreLabel: "888",
            spreadStatsA: {
                primaryOddsRate: "-2.5",
                secondaryOddsRate: "-118",
            },
            spreadStatsB: {
                primaryOddsRate: "-2.5",
                secondaryOddsRate: "-118",
            },
            moneyStatsA: {
                primaryOddsRate: "-120",
            },
            moneyStatsB: {
                primaryOddsRate: "-118"
            },
            TotalStatsA: {
                primaryOddsRate: "A 843.8",
                secondaryOddsRate: "-118",
            },
            TotalStatsB: {
                primaryOddsRate: "U 888.8",
                secondaryOddsRate: "-118",
            }
        },   
        {
            titleClockLabel: "3rd · 4:30",
            titleLogo: "pkg:/images/LA_logo.png",
            titleDetailsLabel: "2nd 10, AKP 35",
            LeftBackgroundLogo: "pkg:/images/LA_logo.png",
            RightBackgroundLogo: "pkg:/images/CIA_logo.png",
            LeftTeamLogo: "pkg:/images/LA_logo.png",
            LeftTeamNameLabel: "LAR",
            LeftTeamScoreLabel: "888",
            RightTeamLogo: "pkg:/images/CIA_logo.png",
            RightTeamNameLabel: "CIN",
            RightTeamScoreLabel: "888",
            spreadStatsA: {
                primaryOddsRate: "-2.5",
                secondaryOddsRate: "-118",
            },
            spreadStatsB: {
                primaryOddsRate: "-2.5",
                secondaryOddsRate: "-118",
            },
            moneyStatsA: {
                primaryOddsRate: "-120",
            },
            moneyStatsB: {
                primaryOddsRate: "-118"
            },
            TotalStatsA: {
                primaryOddsRate: "A 843.8",
                secondaryOddsRate: "-118",
            },
            TotalStatsB: {
                primaryOddsRate: "U 888.8",
                secondaryOddsRate: "-118",
            }
        },
    ]
    return res.status(200)
        .json(new ApiResponse(
            200,
            dummyData
        ))
})

export { app }