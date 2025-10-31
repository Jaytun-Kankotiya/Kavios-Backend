import Album from "../models/albumModel.js";
import Image from "../models/imageModel.js";
import { formatBytes} from "../utils/utils.js";
import { v2 as cloudinary } from "cloudinary";

export const createNewAlbum = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Album name is required",
      });
    }

    const existingAlbum = await Album.findOne({
      ownerId: req.user.userId,
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingAlbum) {
      return res.status(409).json({
        success: false,
        message: `Album '${name}' already exists`,
      });
    }

    const newAlbum = await Album.create({
      name: name.trim(),
      description: description?.trim() || "",
      ownerId: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Album created successfully",
      data: newAlbum,
    });
  } catch (error) {
    console.error("Error creating album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating album",
    });
  }
};

export const fetchAlbums = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.userId;

    const albums = await Album.find({
      $or: [{ ownerId: userId }, { "sharedUsers.email": userEmail }],
      isDeleted: false,
    }).sort({ createdAt: -1 });

    const albumsWithStats = await Promise.all(
      albums.map(async (album) => {
        const imageStats = await Image.aggregate([
          { $match: { albumId: album.albumId, isDeleted: false } },
          {
            $group: {
              _id: null,
              totalImages: { $sum: 1 },
              totalSize: { $sum: "$size" },
              favoriteCount: {
                $sum: { $cond: ["$isFavorite", 1, 0] },
              },
            },
          },
        ]);

        const stats = imageStats[0] || {
          totalImages: 0,
          totalSize: 0,
          favoriteCount: 0,
        };

        return {
          ...album.toObject(),
          imageCount: stats.totalImages,
          totalSize: stats.totalSize,
          formattedSize: formatBytes(stats.totalSize),
          favoriteCount: stats.favoriteCount,
          isOwner: album.ownerId === userId,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: albumsWithStats.length,
      data: albumsWithStats,
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching albums",
    });
  }
};

export const fetchAlbumById = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const userId = req.user.userId;

    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const hasAccess =
      album.ownerId === userId ||
      album.sharedUsers.some((u) => u.email === userEmail);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const imageStats = await Image.aggregate([
      { $match: { albumId: album.albumId } },
      {
        $group: {
          _id: null,
          totalImages: { $sum: 1 },
          totalSize: { $sum: "$size" },
          favoriteCount: {
            $sum: { $cond: ["$isFavorite", 1, 0] },
          },
        },
      },
    ]);

    const stats = imageStats[0] || {
      totalImages: 0,
      totalSize: 0,
      favoriteCount: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        ...album.toObject(),
        imageCount: stats.totalImages,
        totalSize: stats.totalSize,
        formattedSize: formatBytes(stats.totalSize),
        favoriteCount: stats.favoriteCount,
        isOwner: album.ownerId === userId,
      },
    });
  } catch (error) {
    console.error("Error fetching album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching album",
    });
  }
};

export const getAlbumImages = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const userId = req.user.userId;

    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const hasAccess =
      album.ownerId === userId ||
      album.sharedUsers.some((u) => u.email === userEmail);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const images = await Image.find({ albumId: id, isDeleted: false })
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
      success: true,
      albumName: album.name,
      count: formattedImages.length,
      data: formattedImages,
    });
  } catch (error) {
    console.error("Error fetching album images:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching images",
    });
  }
};

export const getAlbumFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const userId = req.user.userId;

    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const hasAccess =
      album.ownerId === userId ||
      album.sharedUsers.some((u) => u.email === userEmail);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const images = await Image.find({
      albumId: id,
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
      success: true,
      albumName: album.name,
      count: formattedImages.length,
      data: formattedImages,
    });
  } catch (error) {
    console.error("Error fetching favorite images:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching favorites",
    });
  }
};

export const fetchAllFavoriteAlbums = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.userId;

    const favoriteAlbums = await Album.find({
      isFavorite: true,
      $or: [
        { ownerId: userId },
        { "sharedUsers.email": userEmail }
      ],
      isDeleted: false
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!favoriteAlbums.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No favorite albums found"
      });
    }

    const albumsWithDetails = await Promise.all(
      favoriteAlbums.map(async (album) => {
        const imageCount = await Image.countDocuments({
          albumId: album.albumId,
          isDeleted: false
        });

        const favoriteImageCount = await Image.countDocuments({
          albumId: album.albumId,
          isFavorite: true,
          isDeleted: false
        });

        return {
          ...album,
          totalImages: imageCount,
          favoriteImages: favoriteImageCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: albumsWithDetails.length,
      data: albumsWithDetails
    });

  } catch (error) {
    console.error("Error fetching favorite albums:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching favorite albums"
    });
  }
};

export const updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isFavorite, isDeleted } = req.body;

    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only album owner can update",
      });
    }

    if (name && name !== album.name) {
      const existingAlbum = await Album.findOne({
        ownerId: req.user.userId,
        name: { $regex: new RegExp(`^${name}$`, "i") },
        albumId: { $ne: id },
      });

      if (existingAlbum) {
        return res.status(409).json({
          success: false,
          message: `Album '${name}' already exists`,
        });
      }
    }

    if (name) album.name = name.trim();
    if (description !== undefined) album.description = description.trim();
    if (typeof isFavorite === "boolean") album.isFavorite = isFavorite;
    if (typeof isDeleted === "boolean") {
      album.isDeleted = isDeleted;
      album.deletedAt = isDeleted ? new Date() : null;
    }

    await album.save();

    return res.status(200).json({
      success: true,
      message: "Album updated successfully",
      data: album,
    });
  } catch (error) {
    console.error("Error updating album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating album",
    });
  }
};


export const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only album owner can delete",
      });
    }

    if (album.isDeleted) {
      return res
        .status(400)
        .json({ success: false, message: "Album already in trash" });
    }

    album.isDeleted = true;
    album.deletedAt = new Date();
    await album.save();

    await Image.updateMany(
      { albumId: album.albumId },
      { isDeleted: true, deletedAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: "Album deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting album",
    });
  }
};

export const fetchAlbumTrash = async (req, res) => {
  try {
    const albums = await Album.find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .lean();

    const formattedAlbums = albums.map((album) => ({
      ...album,
      daysUntilDeletion: Math.max(
        0,
        30 -
          Math.floor(
            (Date.now() - new Date(album.deletedAt)) / (1000 * 60 * 60 * 24)
          )
      ),
    }));

    return res.status(200).json({
      success: true,
      count: formattedAlbums.length,
      data: formattedAlbums,
    });
  } catch (error) {
    console.error("Error fetching album trash:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching album trash",
    });
  }
};

export const permanentlyDeleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const album = await Album.findOne({ $or: [{ albumId: id }, { _id: id }] });

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    const images = await Image.find({ albumId: album.albumId });
    for (const image of images) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (err) {
        console.error("Error deleting image from Cloudinary:", err);
      }
    }

    await Image.deleteMany({ albumId: album.albumId });
    await Album.deleteOne({ _id: album._id });

    return res.status(200).json({ success: true, message: "Album permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting album:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while permanently deleting album" });
  }
};

export const emptyAlbumTrash = async (req, res) => {
  try {
    const trashedAlbums = await Album.find({ isDeleted: true });

    let totalDeletedImages = 0;
    for (const album of trashedAlbums) {
      const images = await Image.find({ albumId: album.albumId });
      for (const image of images) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (err) {
          console.error("Error deleting image from Cloudinary:", err);
        }
      }
      const result = await Image.deleteMany({ albumId: album.albumId });
      totalDeletedImages += result.deletedCount;
    }

    const result = await Album.deleteMany({ isDeleted: true });

    return res.status(200).json({
      success: true,
      message: `Emptied album trash — deleted ${result.deletedCount} albums and ${totalDeletedImages} images.`,
    });
  } catch (error) {
    console.error("Error emptying album trash:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while emptying album trash" });
  }
};

export const restoreAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findOne({ $or: [{ albumId: id }] });

    if (!album) {
      return res
        .status(404)
        .json({ success: false, message: "Album not found" });
    }

    if (!album.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Album is not in trash" });
    }

    album.isDeleted = false;
    album.deletedAt = null;
    await album.save();

    await Image.updateMany(
      { albumId: album.albumId },
      { isDeleted: false, deletedAt: null }
    );

    return res.status(200).json({
      success: true,
      message: "Album restored successfully",
      data: { albumId: album.albumId, name: album.name },
    });
  } catch (error) {
    console.error("Error restoring album:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while restoring album",
    });
  }
};

export const cleanupOldAlbumTrash = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldAlbums = await Album.find({ isDeleted: true, deletedAt: { $lt: thirtyDaysAgo } });

    let deletedCount = 0;
    for (const album of oldAlbums) {
      const images = await Image.find({ albumId: album.albumId });
      for (const image of images) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (err) {
          console.error("Error deleting image from Cloudinary:", err);
        }
      }
      await Image.deleteMany({ albumId: album.albumId });
      await Album.deleteOne({ _id: album._id });
      deletedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${deletedCount} old trashed albums (older than 30 days).`,
    });
  } catch (error) {
    console.error("Error cleaning up old album trash:", error);
    res.status(500).json({ success: false, message: error.message || "Server error while cleaning up old album trash" });
  }
};

export const shareAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid email array is required",
      });
    }

    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only album owner can share",
      });
    }

    const ownerEmail = req.user.email.toLowerCase();
    const validEmails = emails
      .map((email) => email.toLowerCase().trim())
      .filter((email) => email !== ownerEmail);

    if (validEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot share album with yourself",
      });
    }

    const existingEmails = album.sharedUsers.map((u) => u.email.toLowerCase());
    const newEmails = validEmails.filter(
      (email) => !existingEmails.includes(email)
    );

    if (newEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All provided emails are already shared",
      });
    }

    newEmails.forEach((email) => album.sharedUsers.push({ email }));
    await album.save();

    return res.status(200).json({
      success: true,
      message: `Album shared with ${newEmails.length} user(s)`,
      sharedWith: newEmails,
      data: album,
    });
  } catch (error) {
    console.error("Error sharing album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while sharing album",
    });
  }
};

export const unshareAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only album owner can unshare",
      });
    }

    const emailLower = email.toLowerCase().trim();
    const userIndex = album.sharedUsers.findIndex(
      (u) => u.email.toLowerCase() === emailLower
    );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found in shared list",
      });
    }

    album.sharedUsers.splice(userIndex, 1);
    await album.save();

    return res.status(200).json({
      success: true,
      message: "User removed from album successfully",
      data: album,
    });
  } catch (error) {
    console.error("Error unsharing album:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while unsharing album",
    });
  }
};
