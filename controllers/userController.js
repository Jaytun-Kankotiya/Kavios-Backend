import User from "../models/userModel.js";
import Album from "../models/albumModel.js";
import Image from "../models/imageModel.js";
import { formatBytes } from "../utils/utils.js";

export const getUserProfile = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user.userId;

    const user = await User.findOne({ userId }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const allAlbums = await Album.find({
      $or: [{ ownerId: userId }, { "sharedUsers.email": userEmail }],
      isDeleted: false,
    }).lean();

    const ownedAlbums = allAlbums.filter((album) => album.ownerId === userId);
    const sharedAlbums = allAlbums.filter((album) => album.ownerId !== userId);

    const ownedAlbumIds = ownedAlbums.map((a) => a.albumId);
    const sharedAlbumIds = sharedAlbums.map((a) => a.albumId);
    const allAlbumIds = [...ownedAlbumIds, ...sharedAlbumIds];

    const allImages = await Image.find({
      albumId: { $in: allAlbumIds },
      isDeleted: false,
    }).lean();

    const ownedImages = allImages.filter((img) =>
      ownedAlbumIds.includes(img.albumId)
    );
    const sharedImages = allImages.filter((img) =>
      sharedAlbumIds.includes(img.albumId)
    );

    const ownedTotalSize = ownedImages.reduce(
      (acc, img) => acc + (img.size || 0),
      0
    );
    const ownedFavoriteCount = ownedImages.filter(
      (img) => img.isFavorite
    ).length;

    const sharedTotalSize = sharedImages.reduce(
      (acc, img) => acc + (img.size || 0),
      0
    );
    const sharedFavoriteCount = sharedImages.filter(
      (img) => img.isFavorite
    ).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentImages = allImages.filter(
      (img) => new Date(img.uploadedAt) >= sevenDaysAgo
    );
    const recentAlbums = allAlbums.filter(
      (album) => new Date(album.createdAt) >= sevenDaysAgo
    );

    const trashedAlbums = await Album.countDocuments({
      ownerId: userId,
      isDeleted: true,
    });

    const trashedImages = await Image.countDocuments({
      albumId: { $in: ownedAlbumIds },
      isDeleted: true,
    });

    const albumsWithStats = await Promise.all(
      ownedAlbums.map(async (album) => {
        const imageCount = allImages.filter(
          (img) => img.albumId === album.albumId
        ).length;
        const albumSize = allImages
          .filter((img) => img.albumId === album.albumId)
          .reduce((acc, img) => acc + (img.size || 0), 0);

        return {
          albumId: album.albumId,
          name: album.name,
          imageCount,
          totalSize: albumSize,
          formattedSize: formatBytes(albumSize),
          isFavorite: album.isFavorite,
          createdAt: album.createdAt,
        };
      })
    );

    const sharedAlbumsWithStats = await Promise.all(
      sharedAlbums.map(async (album) => {
        const imageCount = allImages.filter(
          (img) => img.albumId === album.albumId
        ).length;
        const albumSize = allImages
          .filter((img) => img.albumId === album.albumId)
          .reduce((acc, img) => acc + (img.size || 0), 0);

        return {
          albumId: album.albumId,
          name: album.name,
          imageCount,
          totalSize: albumSize,
          formattedSize: formatBytes(albumSize),
          isFavorite: album.isFavorite,
          createdAt: album.createdAt,
          sharedBy: album.ownerId,
        };
      })
    );


    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: {
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        storage: {
          owned: {
            totalImages: ownedImages.length,
            totalSize: ownedTotalSize,
            formattedSize: formatBytes(ownedTotalSize),
            favoriteImages: ownedFavoriteCount,
            totalAlbums: ownedAlbums.length,
            favoriteAlbums: ownedAlbums.filter((a) => a.isFavorite).length,
          },
          shared: {
            totalImages: sharedImages.length,
            totalSize: sharedTotalSize,
            formattedSize: formatBytes(sharedTotalSize),
            favoriteImages: sharedFavoriteCount,
            totalAlbums: sharedAlbums.length,
          },
          combined: {
            totalImages: allImages.length,
            totalSize: ownedTotalSize + sharedTotalSize,
            formattedSize: formatBytes(ownedTotalSize + sharedTotalSize),
            favoriteImages: ownedFavoriteCount + sharedFavoriteCount,
            totalAlbums: allAlbums.length,
          },
        },
        albums: {
          owned: albumsWithStats,
          shared: sharedAlbumsWithStats,
        },
        recentActivity: {
          recentImages: recentImages.length,
          recentAlbums: recentAlbums.length,
          lastUpload: ownedImages.length
            ? ownedImages.sort(
                (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
              )[0].uploadedAt
            : null,
        },
        trash: {
          trashedAlbums,
          trashedImages,
        }
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching user profile",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error during logout",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "Cannot change email for Google authenticated accounts",
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = email;
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        isGoogleAuth: !user.password,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating profile",
    });
  }
};