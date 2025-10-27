import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      default: () => uuidv4(),  
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    authProvider: {
      type: String,
      default: "google",
    },
    name: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    storageUsed: Number,
    storageLimit: Number,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
export default User;
