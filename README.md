# Social Media API (Express + MongoDB)

A Node.js/Express REST API for a simple social media platform. It supports user registration and login with JWT (HttpOnly cookies), profile management, friend requests, posts with images, likes, and comments. MongoDB (Mongoose) is used for persistence. Image uploads are handled via Multer in memory and stored on Cloudinary.

## Features

- User authentication with access/refresh tokens stored as HttpOnly cookies
- Register, login, logout, and refresh access tokens
- User profile retrieval and editing (including profile picture upload to Cloudinary)
- Friend request workflow (send/cancel request, accept/decline)
- CRUD for posts (create, edit with optional image upload, view, delete)
- Likes (toggle like/unlike on a post)
- Comments (add, edit, delete)
- Centralized error handling with consistent JSON responses

## Tech Stack

- Runtime: Node.js (ES modules)
- Framework: Express
- Database: MongoDB with Mongoose
- Auth: JSON Web Tokens (JWT) via HttpOnly cookies
- Validation: express-validator
- File Upload: Multer (memoryStorage) + Cloudinary
- Other: dotenv, cors, cookie-parser, bcrypt

## Project Structure

```
src/
  models/
    Comment.js
    Post.js
    User.js
  routes/
    addFriends/
      acceptRequest.js
      main.js
      sendRequest.js
    comments/
      addComment.js
      deletecComment.js
      editComment.js
      main.js
    form/
      login.js
      logout.js
      main.js
      register.js
    likes/
      main.js
      toggleLike.js
    posts/
      addPost.js
      deletePost.js
      editPost.js
      main.js
      showPost.js
      showUserPost.js
    user/
      deleteUser.js
      editProfile.js
      main.js
      profile.js
  utilities/
    errorHandling/
      classObject.js
      errorHandlerMiddleware.js
      tryCatch.js
    hashing/
      hashing.js
    multer/
      cloudinaryUpload.js
      multer.js
    tokens/
      accessTokenMiddleware.js
      refreshTokenRoute.js
    validation/
      loginValidation.js
      postValidation.js
      signupValidation.js
app.js
package.json
```

## Prerequisites

- Node.js 18+ recommended
- MongoDB running locally on mongodb://127.0.0.1:27017
- A Cloudinary account (for image uploads)

## Environment Variables

Create a .env file in the project root with the following variables:

- PORT (optional; defaults to 5000)
- NODE_ENV=development (recommended for local usage)
- SECRET_WEB_TOKEN=your_access_jwt_secret
- REFRESH_SECRET_WEB_TOKEN=your_refresh_jwt_secret
- CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
- CLOUDINARY_API_KEY=your_cloudinary_api_key
- CLOUDINARY_API_SECRET=your_cloudinary_api_secret

Notes:
- CORS is configured to allow origin http://localhost:5173 with credentials. If your frontend runs elsewhere, update the cors configuration in app.js.
- MongoDB URI is currently hardcoded to mongodb://127.0.0.1:27017/social-media in app.js. Adjust as needed.

## Installation

1) Install dependencies

- npm install

2) Configure environment

- Create and populate .env as shown above
- Ensure MongoDB is running locally (or update app.js to use your connection string)
- Ensure your Cloudinary credentials are valid

## Running the Server

- Development: npm run dev
- Production: npm start

Server starts on http://localhost:5000 by default.

## Authentication Overview

- On login, the server sets two HttpOnly cookies:
  - accessToken (expires in 1 hour)
  - refreshToken (expires in 7 days)
- To refresh your access token, call POST /api/refreshtoken. A valid refreshToken cookie is required; a new accessToken cookie is issued.
- Many routes require authentication via the accessToken cookie. Use a client that preserves cookies (e.g., browser with fetch credentials: 'include', or Postman with cookie support).
- Cookie flags:
  - In development: sameSite=lax, secure=false
  - In production: sameSite=none, secure=true

## API Endpoints (Summary)

Auth and Session
- POST /api/register
  - Body (JSON): { username, email, password }
  - Registers a new user
- POST /api/login
  - Body (JSON): { email, password }
  - Sets accessToken and refreshToken HttpOnly cookies
- POST /api/logout
  - Clears access/refresh cookies
- POST /api/refreshtoken
  - Requires refreshToken cookie; returns new accessToken cookie

User
- GET /api/profile (auth)
  - Returns authenticated user info and aggregated posts with likesCount and comments
- PATCH /api/editprofile (auth)
  - multipart/form-data: optional fields username, email, password, bio; profilePicture as file
  - Updates user profile; if a profile picture is uploaded, it is stored on Cloudinary
- DELETE /api/deleteuser (auth)
  - Deletes the authenticated user

Friend Requests
- POST /api/sendrequest (auth)
  - Body (JSON): { friendId }
  - Sends a new friend request; if already sent, cancels it
- POST /api/acceptrequest (auth)
  - Body (JSON): { friendId, status: 'accepted' | 'declined' }
  - Accepts or declines a pending friend request

Posts
- POST /api/addpost (auth)
  - Body (JSON): { title, description, image? }
  - Creates a post; image is an optional URL string here
- PATCH /api/editpost (auth)
  - multipart/form-data: requires postId; optional title, description; optional image file
  - If an image file is provided, it is uploaded to Cloudinary
- GET /api/getuser/:id (auth)
  - Returns a specific user with aggregated posts and comments
- GET /api/posts/:id (public)
  - Returns a single post with author, likesCount, and comments
- DELETE /api/deletepost/:id (auth)
  - Deletes a post you own

Likes
- POST /api/togglelike (auth)
  - Body (JSON): { postId }
  - Toggles like/unlike for the given post

Comments
- POST /api/addcomment (auth)
  - Body (JSON): { postId, value }
  - Adds a new comment
- PATCH /api/editcomment (auth)
  - Body (JSON): { commentId, value }
  - Edits your own comment
- DELETE /api/deletecomment (auth)
  - Body (JSON): { commentId }
  - Deletes your own comment

## Models (Key Fields)

User
- username (unique), email (unique), password (hashed)
- friends, friendRequests, requestsSent (arrays of User IDs)
- profilePicture (URL), bio
- posts (array of Post IDs)

Post
- userId (User ref), title, description, image (URL)
- likes (array of User IDs)
- comments (array of Comment IDs)

Comment
- value (string)
- userId (User ref)
- postId (Post ref)

## File Uploads

- Multer is configured with memoryStorage and a 5 MB size limit
- Only image/* mimetypes are accepted
- Uploaded images are stored under the Cloudinary folder "social_media_uploads"

## Error Handling

Errors are returned in a consistent JSON format similar to:

```
{
  "status": "fail" | "error",
  "message": "...",
  "statusCode": 400,
  "isOperational": true,
  "validation": { ... },
  "stack": "..." // only in development
}
```

## CORS and Client Usage

- CORS allows origin http://localhost:5173 with credentials
- If building a frontend, ensure fetch/axios calls include credentials
  - fetch example: fetch(url, { method: 'GET', credentials: 'include' })
- To change the allowed origin, update the cors configuration in app.js

## Notes

- The MongoDB connection string is hardcoded in app.js. You can switch it to use a .env variable if preferred.
- Ensure your client or API client preserves cookies between requests when calling authenticated routes.
- package.json "name" is set to "e-commerce"; this is a placeholder and does not affect functionality.

## Scripts

- npm run dev (nodemon app.js)
- npm start (node app.js)

## License

ISC (as indicated in package.json)
