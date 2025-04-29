import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import multer from 'multer'

const upload = multer()
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({
    limit: '16kb'
}))
app.use(express.urlencoded({
    extended: true,
    limit: '16kb'
}))
app.use(express.static('public'))
app.use(cookieParser())

// routes import
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'

// routes decleration 
app.use('/api/v1/user', userRouter)
app.use('/api/v1/tweet', tweetRouter)

// http://localhost:8000/api/v1/user/register

export { app };