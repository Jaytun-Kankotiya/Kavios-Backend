import express from "express"
import { googleAuth } from "../middleware/authMiddleware.js"


const authRoutes = express.Router()

authRoutes.post('/google', googleAuth)
authRoutes.get("/google/callback", (req, res) => {
  res.send("Google callback successful");
});

export default authRoutes