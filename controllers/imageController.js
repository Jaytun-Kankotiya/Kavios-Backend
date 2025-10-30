import Image from "../models/imageModel.js";
import Album from "../models/albumModel.js";
import { v2 as cloudinary } from "cloudinary";
import { formatBytes, getOptimizedUrls } from "../utils/utils.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }

      return res.status(404).json({
        success: false,
        message: `Album with ID ${albumId} does not exist`,
      });
    }

    const optimizedUrls = getOptimizedUrls(req.file.path);

    const newImage = new Image({
      albumId,
      name: name || req.file.originalname,
      imageUrl: req.file.path,
      publicId: req.file.filename,
      thumbnailUrl: optimizedUrls.thumbnail,
      mediumUrl: optimizedUrls.medium,
      largeUrl: optimizedUrls.large,
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [],
      person: person ? person.trim() : "",
      isFavorite: isFavorite === "true",
      comments:
        comments && comments.trim()
          ? [{ text: comments, createdAt: new Date() }]
          : [],
      size: req.file.size,
      uploadedAt: new Date(),
    });

    const savedImage = await newImage.save();

    return res.status(201).json({
      success: true,
      message: "New image uploaded successfully",
      data: {
        ...savedImage.toObject(),
        formattedSize: formatBytes(savedImage.size),
      },
    });
  } catch (error) {
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }
    return res.status(500).json({
      success: false,
      message: String(error.message) || "Server error while uploading image",
    });
  }
};

export const fetchAllImages = async (req, res) => {
  try {
    const {
      albumId,
      tags,
      person,
      isFavorite,
      search,
      sortBy = "newest",
    } = req.query;

    let filter = { isDeleted: false };

    if (albumId) {
      filter.albumId = albumId;
    }

    if (tags) {
      filter.tags = { $in: tags.split(",").map((tag) => tag.trim()) };
    }

    if (person) {
      filter.person = { $regex: person, $options: "i" };
    }

    if (isFavorite !== undefined) {
      filter.isFavorite = isFavorite === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { person: { $regex: search, $options: "i" } },
      ];
    }

    let sort = {};
    switch (sortBy) {
      case "newest":
        sort.uploadedAt = -1;
        break;
      case "oldest":
        sort.uploadedAt = 1;
        break;
      case "name":
        sort.name = 1;
        break;
      case "size":
        sort.size = -1;
        break;
      default:
        sort.uploadedAt = -1;
    }

    const images = await Image.find(filter).sort(sort).lean();

    const formattedImages = images.map((img) => ({
      ...img,
      formattedSize: formatBytes(img.size),
      thumbnailUrl:
        img.thumbnailUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_300,h_300,c_fill,q_auto,f_auto/"
        ),
      mediumUrl:
        img.mediumUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_800,h_800,c_limit,q_auto,f_auto/"
        ),
    }));

    return res.status(200).json({
      success: true,
      count: formattedImages.length,
      data: formattedImages,
      filters: {
        albumId: albumId || null,
        tags: tags || null,
        person: person || null,
        isFavorite: isFavorite || null,
        search: search || null,
        sortBy,
      },
    });
  } catch (error) {
    console.error("Error fetching images:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching images",
    });
  }
};

export const fetchImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findOne({
      $or: [{ imageId: id }],
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: `Image with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...image.toObject(),
        formattedSize: formatBytes(image.size),
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching image",
    });
  }
};

export const fetchAllFavoriteImages = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.userId;

    const accessibleAlbums = await Album.find({
      $or: [{ ownerId: userId }, { "sharedUsers.email": userEmail }],
    }).select("albumId name");

    if (!accessibleAlbums.length) {
      return res
        .status(404)
        .json({ success: false, message: "No albums found for this user" });
    }

    const albumIds = accessibleAlbums.map((a) => a.albumId);

    const images = await Image.find({
      albumId: { $in: albumIds },
      isFavorite: true,
    })
      .sort({ uploadedAt: -1 })
      .lean();

    const formattedImages = images.map((img) => ({
      ...img,
      formattedSize: formatBytes(img.size),
      thumbnailUrl:
        img.thumbnailUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_300,h_300,c_fill,q_auto,f_auto/"
        ),
      mediumUrl:
        img.mediumUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_800,h_800,c_limit,q_auto,f_auto/"
        ),
    }));

    return res.status(200).json({
      success: false,
      message: "Fetched all favorite images",
      count: formattedImages.length,
      data: formattedImages,
    });
  } catch (error) {
    console.error("Error fetching all favorite images:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching favorite images",
    });
  }
};

export const updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, tags, person, isFavorite, comments, isDeleted } = req.body;

    const image = await Image.findOne({
      $or: [{ imageId: id }],
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: `Image not found`,
      });
    }

    if (name !== undefined) image.name = name;
    if (tags !== undefined)
      image.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim());
    if (person !== undefined) image.person = person;
    if (isFavorite !== undefined) image.isFavorite = isFavorite;

    if (typeof isDeleted === "boolean") {
      image.isDeleted = isDeleted;
      image.deletedAt = isDeleted ? new Date() : null;
    }

    if (comments !== undefined) image.comments = comments;

    const updatedImage = await image.save();

    return res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: {
        ...updatedImage.toObject(),
        formattedSize: formatBytes(updatedImage.size),
      },
    });
  } catch (error) {
    console.error("Error updating image:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating image",
    });
  }
};

export const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findOne({
      $or: [{ imageId: id }],
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: `Image with ID ${id} not found`,
      });
    }

    if (image.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Image is already in trash",
      });
    }

    image.isDeleted = true;
    image.deletedAt = new Date();
    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image moved to trash successfully",
      data: {
        imageId: image.imageId,
        name: image.name,
        deletedAt: image.deletedAt,
      },
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting image",
    });
  }
};

export const fetchRecentImages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    const images = await Image.find({ isDeleted: false })
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .lean();

    const formattedImages = images.map((img) => ({
      ...img,
      formattedSize: formatBytes(img.size),
      thumbnailUrl:
        img.thumbnailUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_300,h_300,c_fill,q_auto,f_auto/"
        ),
      mediumUrl:
        img.mediumUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_800,h_800,c_limit,q_auto,f_auto/"
        ),
    }));

    return res.status(200).json({
      success: true,
      count: formattedImages.length,
      data: formattedImages,
    });
  } catch (error) {
    console.error("Error fetching recent images:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching recent images",
    });
  }
};

export const fetchTrash = async (req, res) => {
  try {
    const images = await Image.find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .lean();

    const formattedImages = images.map((img) => ({
      ...img,
      formattedSize: formatBytes(img.size),
      thumbnailUrl:
        img.thumbnailUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_300,h_300,c_fill,q_auto,f_auto/"
        ),
      mediumUrl:
        img.mediumUrl ||
        img.imageUrl.replace(
          "/upload/",
          "/upload/w_800,h_800,c_limit,q_auto,f_auto/"
        ),
      daysUntilDeletion: Math.max(
        0,
        30 -
          Math.floor(
            (Date.now() - new Date(img.deletedAt)) / (1000 * 60 * 60 * 24)
          )
      ),
    }));

    return res.status(200).json({
      success: true,
      count: formattedImages.length,
      data: formattedImages,
    });
  } catch (error) {
    console.error("Error fetching trash:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching trash",
    });
  }
};

export const restoreImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findOne({
      $or: [{ imageId: id }],
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: `Image with ID ${id} not found`,
      });
    }

    if (!image.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Image is not in trash",
      });
    }

    image.isDeleted = false;
    image.deletedAt = null;
    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image restored successfully",
      data: {
        imageId: image.imageId,
        name: image.name,
      },
    });
  } catch (error) {
    console.error("Error restoring image:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while restoring image",
    });
  }
};

export const permanentlyDeleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findOne({
      $or: [{ imageId: id }, { _id: id }],
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: `Image with ID ${id} not found`,
      });
    }

    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
    }

    await Image.deleteOne({ _id: image._id });

    return res.status(200).json({
      success: true,
      message: "Image permanently deleted",
      data: {
        imageId: image.imageId,
        name: image.name,
      },
    });
  } catch (error) {
    console.error("Error permanently deleting image:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while permanently deleting image",
    });
  }
};

export const emptyTrash = async (req, res) => {
  try {
    const deletedImages = await Image.find({ isDeleted: true });

    for (const image of deletedImages) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (cloudinaryError) {
        console.error(
          `Error deleting ${image.publicId} from Cloudinary:`,
          cloudinaryError
        );
      }
    }

    const result = await Image.deleteMany({ isDeleted: true });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} images permanently deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error emptying trash:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while emptying trash",
    });
  }
};

export const cleanupOldTrash = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const oldDeletedImages = await Image.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo },
    });

    for (const image of oldDeletedImages) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (cloudinaryError) {
        console.error(
          `Error deleting ${image.publicId} from Cloudinary:`,
          cloudinaryError
        );
      }
    }

    const result = await Image.deleteMany({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo },
    });

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} images older than 30 days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up old trash:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while cleaning up trash",
    });
  }
};
