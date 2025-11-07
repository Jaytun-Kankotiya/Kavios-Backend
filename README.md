# 🖼️ KaviosPix Backend API

> KaviosPix Backend is a RESTful API built with Node.js, Express, and MongoDB that enables secure photo management. It supports authentication, album and image organization, Cloudinary-based storage, and user profile management — optimized for performance, scalability, and seamless integration with frontend apps.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg) 
![Express](https://img.shields.io/badge/Express-4.x-blue.svg) 
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg) 
![Cloudinary](https://img.shields.io/badge/Cloudinary-Storage-blue.svg)

---
## Demo Link
[Live Demo](https://kavios-pix.vercel.app)

---

## ✨ Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Albums**: Create, share, and manage photo albums with statistics
- **Images**: Upload, optimize, tag, favorite, and comment
- **Trash System**: 30-day soft delete with restore capability
- **User Profiles**: Avatar, bio, activity tracking, and storage stats
- **Cloud Storage**: Cloudinary integration with automatic optimization

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/kavios-pix-backend.git
cd Kavios_Backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run
npm run dev  # Development
npm start    # Production
```

## 🔧 Environment Variables

```env
PORT=4000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

## 📚 API Endpoints

### Authentication

```http
POST   /auth/register      # Register new user
POST   /auth/login         # Login user
POST   /auth/logout        # Logout user
```

### Albums

```http
GET    /albums             # Get all albums
POST   /albums             # Create album
PUT    /albums/:id         # Update album
DELETE /albums/:id         # Delete album
POST   /albums/:id/share   # Share with users
GET    /albums/:id/images  # Get album images
```

### Images

```http
POST   /images/upload              # Upload single image
POST   /images/upload/multiple     # Upload multiple images
GET    /images                     # Get all images
GET    /images/recent              # Get recent images
GET    /images/:id                 # Get image by ID
PUT    /images/:id                 # Update image
DELETE /images/:id                 # Move to trash
DELETE /images/bulk-delete         # Bulk delete
GET    /images/trash/all           # Get trash items
POST   /images/trash/:id/restore   # Restore from trash
DELETE /images/trash/:id/permanent # Permanently delete
DELETE /images/trash/empty         # Empty trash
```

### User Profile

```http
GET    /profile              # Get profile & stats
PUT    /profile              # Update profile
PUT    /profile/picture      # Upload profile picture
DELETE /profile/picture      # Delete profile picture
PUT    /profile/password     # Change password
GET    /profile/activity     # Get activity log
DELETE /profile              # Delete account
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Storage**: Cloudinary
- **Auth**: JWT, Bcrypt
- **Upload**: Multer

## 📂 Project Structure

```
├── controllers/          # Request handlers
├── middleware/          # Auth & upload middleware
├── models/              # Mongoose schemas
├── routes/              # API routes
├── utils/               # Helper functions
└── index.js             # Entry point
```

## 🔒 Security

- JWT authentication with HTTP-only cookies
- Bcrypt password hashing (10 rounds)
- Input validation and sanitization
- CORS protection
- Secure file upload validation

## 📈 Performance

- Image optimization (thumbnail, medium, large)
- MongoDB indexing
- Cloudinary CDN delivery
- Lean queries for efficiency
- Batch operations support

## 📝 Response Format

**Success:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 📬 Contact

For any questions, suggestions, or feature requests, feel free to reach out:</br>
📧 jaytunkankotiya81@gmail.com</br>
💼 [GitHub Profile](https://github.com/Jaytun-Kankotiya)

---
