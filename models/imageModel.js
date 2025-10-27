import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const imageSchema = new mongoose.Schema(
  {
    imageId: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    albumId: {
      type: String,
      required: true,
      ref: "Album",
    },
    imageUrl: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    person: {
      type: String,
      default: "",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        text: String,
        author: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    size: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);
export default Image;
