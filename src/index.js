// require('dotenv').config({
//     path: '/.env'
// })

import dotenv from 'dotenv'
import connectDB from './db/db.js';
import { app } from './app.js';

// Load environment variables
dotenv.config()

// Set default port
const port = process.env.PORT || 8000;

// when an async function completes, it returns a Promise
connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is listening at http://localhost:${port}`);
        })
    })
    .catch((error) => {
        console.log('MongoDB connection Failed.', error);
    })