import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ message: "Authorization code is required" });
    }

    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const idToken = data.id_token;
    if (!idToken) {
      return res
        .status(400)
        .json({ message: "Failed to retrieve ID token from Google" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Google user payload:", payload);

    let user = await User.findOne({
      $or: [
        { email: payload.email },
        { googleId: payload.sub },
        { userId: payload.sub },
      ],
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

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    res.status(400).json({
      message: "Google OAuth failed",
      error: error.message,
    });
  }
};
