import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createNewAlbum,
  deleteAlbum,
  fetchAlbums,
  fetchAlbumById,
  unshareAlbum,
  shareAlbum,
  updateAlbum,
  getAlbumImages,
  getAlbumFavorites,
  fetchAlbumTrash,
  restoreAlbum,
  permanentlyDeleteAlbum,
  emptyAlbumTrash,
  cleanupOldAlbumTrash,
  fetchAllFavoriteAlbums,
} from "../controllers/albumController.js";

const albumRouter = express.Router();

albumRouter.post("/", verifyToken, createNewAlbum);
albumRouter.get("/", verifyToken, fetchAlbums);
albumRouter.get("/:id", verifyToken, fetchAlbumById);
albumRouter.patch("/:id", verifyToken, updateAlbum);
albumRouter.delete("/:id", verifyToken, deleteAlbum);

albumRouter.post("/:id/share", verifyToken, shareAlbum);
albumRouter.post("/:id/remove_access", verifyToken, unshareAlbum);

albumRouter.get("/:id/images", verifyToken, getAlbumImages);
albumRouter.get("/:id/images/favorites", verifyToken, getAlbumFavorites);
albumRouter.get('/favorites/all', verifyToken, fetchAllFavoriteAlbums)

albumRouter.get("/trash/all", verifyToken, fetchAlbumTrash);
albumRouter.post("/trash/:id/restore", verifyToken, restoreAlbum);
albumRouter.delete("/trash/:id/permanent", verifyToken, permanentlyDeleteAlbum);
albumRouter.delete("/trash/empty", verifyToken, emptyAlbumTrash);

albumRouter.post("/trash/cleanup", verifyToken, cleanupOldAlbumTrash);

export default albumRouter;
