import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getUserProfile, logout, updateUserProfile } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/profile", verifyToken, getUserProfile);

userRouter.put("/profile", verifyToken, updateUserProfile);

userRouter.post("/logout", verifyToken, logout);

export default userRouter;
