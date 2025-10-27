import mongoose from "mongoose";
import Image from "../models/imageModel.js";
import Album from "../models/albumModel.js";


export const addNewImage = async (req, res) => {
  try {
    const { albumId, name, tags, person, isFavorite, comments } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    if (!albumId) {
      return res.status(400).json({
        success: false,
        message: "Invalid Input: Valid albumId is required",
      });
    }

    const album = await Album.findOne({ albumId });
    if (!album) {
      return res.status(404).json({
        success: false,
        message: `Album with ID ${albumId} does not exist`,
      });
    }

    const newImage = new Image({
      albumId,
      name: name || req.file.originalname,
      imageUrl: req.file.path,    
      publicId: req.file.filename,   
      tags: tags ? tags.split(",") : [],
      person: person || "",
      isFavorite: isFavorite === "true" || false,
      comments: comments ? JSON.parse(comments) : [],
      size: req.file.size || 0,
      uploadedAt: new Date(),
    });

    const savedImage = await newImage.save();

    return res.status(201).json({
      success: true,
      message: "New image uploaded successfully",
      data: savedImage,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while uploading image",
    });
  }
};


export const fetchAllImages = async (req, res) => {
  try {
    const images = await Image.find().populate(
      "albumId",
      "name description ownerId"
    );
    if (!images || images.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No images found",
      });
    }

    return res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching images",
    });
  }
};

export const fetchImageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const image = await Image.findById(id).populate(
      "albumId",
      "name description ownerId"
    );
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: image,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching image details",
    });
  }
};

export const updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tags, person, isFavorite, comments, size } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const updatedImage = await Image.findByIdAndUpdate(
      id,
      {
        name,
        tags,
        person,
        isFavorite,
        comments,
        size,
      },
      { new: true, runValidators: true }
    );

    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating image",
    });
  }
};

export const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image ID",
      });
    }

    const deletedImage = await Image.findByIdAndDelete(id);
    if (!deletedImage) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: deletedImage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting image",
    });
  }
};
