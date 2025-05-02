# 🎮 PlayHive

Welcome to **PlayHive** – a complete backend solution for a video hosting platform like YouTube. Built using **Node.js**, **Express**, **MongoDB**, and **Mongoose**, it features user authentication (JWT, bcrypt, tokens), video uploads, likes, comments, subscriptions, playlists, and more. The project follows clean, scalable practices, making it a great foundation for learning and growth.

This project was originally started by a YouTuber, who completed around 30% of the user authentication part. From there, I took ownership of the remaining development — implementing key features such as video management, comments, likes, tweets, dashboard, health check, playlists, and subscription systems. Finishing this project helped me gain deep, hands-on experience with backend architecture, API design, and best practices in modern web development.

## 🔗 Useful Links - 🧑‍💻
-  [Hamdan Raza's Portfolio](https://hamdanraza-portfolio.vercel.app/)
-  [PlayHive's Model (Eraser Diagram)](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)
-  [LinkedIn](https://www.linkedin.com/in/hamdanraza/)
  
## 🚀 Features

- User authentication with JWT & bcrypt
- Video upload and streaming
- Like/Dislike system
- Commenting on videos
- Subscriptions and playlists
- Tweet-style video sharing
- Dashboard & analytics
- Health check endpoint

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **Others:** Multer (file uploads), Cloudinary (optional), dotenv, etc.

## 📁 Project Structure

├── controllers ├── models ├── routes ├── middlewares ├── utils └── app.js


## 🧪 How to Run Locally

1. Clone the repo  
   `git clone https://github.com/your-username/playhive.git`

2. Install dependencies  
   `npm install`

3. Create `.env` file with the following variables:  
PORT, MONGO_URI, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET


4. Start the server  
`npm run dev`

---

## 📡 API Endpoints

### 🎥 Video

- **GET** `/api/video/:userId`  
Fetch all videos for a given user.
- **POST** `/api/video/publish`  
Upload and publish a new video (requires `videoFile` and `thumbnail`).
- **GET** `/api/video/:videoId`  
Get video details by ID.
- **DELETE** `/api/video/delete/:videoId`  
Delete a video by ID.
- **PATCH** `/api/video/update/:videoId`  
Update video details, including thumbnail.
- **PATCH** `/api/video/toggle/publish/:videoId`  
Toggle the publish status of a video.

### 💬 Comment

- **GET** `/api/comment/:videoId`  
Fetch all comments for a specific video.
- **POST** `/api/comment/add/:videoId`  
Add a comment to a video.
- **PATCH** `/api/comment/update/:commentId`  
Update a comment.
- **DELETE** `/api/comment/delete/:commentId`  
Delete a comment.

### 📊 Dashboard

- **GET** `/api/dashboard/stats`  
Get channel statistics (views, subscribers, etc.).
- **GET** `/api/dashboard/videos`  
Fetch all videos for the channel.

### 🧡 Like

- **POST** `/api/like/toggle/v/:videoId`  
Toggle like/dislike on a video.
- **POST** `/api/like/toggle/c/:commentId`  
Toggle like/dislike on a comment.
- **POST** `/api/like/toggle/t/:tweetId`  
Toggle like/dislike on a tweet.
- **GET** `/api/like/videos`  
Get all liked videos.

### 🎶 Playlist

- **POST** `/api/playlist`  
Create a new playlist.
- **GET** `/api/playlist/user/:userId`  
Get all playlists for a user.
- **GET** `/api/playlist/:playlistId`  
Get details of a specific playlist.
- **PATCH** `/api/playlist/update/:playlistId`  
Update a playlist.
- **DELETE** `/api/playlist/delete/:playlistId`  
Delete a playlist.
- **PATCH** `/api/playlist/add/:videoId/:playlistId`  
Add a video to a playlist.
- **PATCH** `/api/playlist/remove/:videoId/:playlistId`  
Remove a video from a playlist.

### 🔔 Subscription

- **POST** `/api/subscription/c/:channelId`  
Subscribe or unsubscribe from a channel.
- **GET** `/api/subscription/u/:channelId`  
Get all subscribers of a specific channel.
- **GET** `/api/subscription/c/:subscriberId`  
Get all channels a user is subscribed to.

### 🐦 Tweet

- **POST** `/api/tweet`  
Create a new tweet.
- **GET** `/api/tweet/user-tweets`  
Get all tweets from the current user.
- **PATCH** `/api/tweet/update/:tweetId`  
Update a tweet.
- **DELETE** `/api/tweet/delete/:tweetId`  
Delete a tweet.

### 👤 User

- **POST** `/api/user/register`  
Register a new user (with avatar and cover image).
- **POST** `/api/user/login`  
Login a user.
- **POST** `/api/user/logout`  
Logout a user (secured route).
- **POST** `/api/user/refresh-token`  
Refresh JWT token.
- **POST** `/api/user/change-password`  
Change the current password (secured route).
- **GET** `/api/user/current-user`  
Get current logged-in user details (secured route).
- **PATCH** `/api/user/update-account`  
Update user account details (secured route).
- **PATCH** `/api/user/avatar`  
Update user avatar (secured route).
- **PATCH** `/api/user/coverImage`  
Update user cover image (secured route).
- **GET** `/api/user/c/:username`  
Get a user's channel profile.
- **GET** `/api/user/history`  
Get a user's watch history (secured route).

---
