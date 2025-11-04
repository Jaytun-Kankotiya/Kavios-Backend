import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    const { data } = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const idToken = data.id_token;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ $or: [{ email: payload.email }, { googleId: payload.sub }] });
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

    const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.redirect(`${process.env.FRONTEND_URL}/google-callback?token=${token}`);
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    res.redirect(
      `${process.env.FRONTEND_URL}/google-callback?error=${encodeURIComponent(error.message)}`
    );
  }
};
