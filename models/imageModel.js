import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  imageId: {
    type: String,
    required: true,
    unique: true
  },
  albumId: {
    type: String,
    required: true,
    ref: "Album"
  },
  name: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  person: {
    type: String,
    default: ""
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  comments: {
    type: [
      {
        text: String,
        author: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    default: []
  },
  size: {
    type: Number,
    default: 0
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const Image = mongoose.model("Image", imageSchema);
export default Image