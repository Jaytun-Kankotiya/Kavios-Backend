import Album from "../models/albumModel.js";

export const createNewAlbum = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res
      .status(400)
      .json({ success: false, message: "Name and description are required" });
  }

  try {

    const existingAlbum = await Album.findOne({
      ownerId: req.user.userId,
      name: name
    });

    if (existingAlbum) {
      return res.status(409).json({
        success: false,
        message: `Album '${name}' already exists`,
      });
    }

    const newAlbum = await Album.create({
      name: name.toLowerCase(), 
      description,
      ownerId: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Album created successfully",
      album: newAlbum,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const fetchAlbums = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const albums = await Album.find({
      $or: [{ ownerId: req.user.userId }, { "sharedUsers.email": userEmail }],
    });

    return res.status(200).json({ success: true, data: albums });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAlbum = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    album.name = name || album.name;
    album.description = description || album.description;

    await album.save();

    return res
      .status(200)
      .json({ success: true, message: "Album updated successfully", data: album });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete album
export const deleteAlbum = async (req, res) => {
  const { id } = req.params;

  try {
    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await album.deleteOne();

    return res.status(200).json({ success: true, message: "Album deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Share album
export const shareAlbum = async (req, res) => {
  const { id } = req.params;
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ success: false, message: "Emails are required" });
  }

  try {
    const album = await Album.findOne({ albumId: id });

    if (!album) {
      return res.status(404).json({ success: false, message: "Album not found" });
    }

    if (album.ownerId !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const existingEmails = album.sharedUsers.map((u) => u.email.toLowerCase());
    const newEmails = emails
      .map((email) => email.toLowerCase())
      .filter((email) => !existingEmails.includes(email));

    newEmails.forEach((email) => album.sharedUsers.push({ email }));

    await album.save();

    return res
      .status(200)
      .json({ success: true, message: "Album shared successfully", data: album });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
