
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange authorization code for tokens
    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI, 
      grant_type: "authorization_code",
    });

    const idToken = data.id_token;

    // Verify and decode the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Google user payload:", payload);

    // Save or find user in DB
    let user = await User.findOne({
      $or: [
        { email: payload.email },
        { userId: payload.sub },
        { googleId: payload.sub }
      ]
    });
    if (!user) {
      user = await User.create({
        userId: payload.sub,       
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        authProvider: "google",
      });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    res.status(400).json({ message: "Google OAuth failed", error: error.message });
  }
};