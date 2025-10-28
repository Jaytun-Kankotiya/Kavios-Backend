import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const albumSchema = new mongoose.Schema(
  {
    albumId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    ownerId: {
      type: String,
      ref: "User",
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    sharedUsers: [
      {
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Album = mongoose.model("Album", albumSchema);
export default Album;
