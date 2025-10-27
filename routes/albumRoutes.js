import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createNewAlbum, deleteAlbum, fetchAlbums, shareAlbum, updateAlbum } from "../controllers/albumController.js";

const albumRoutes = express.Router()

albumRoutes.post('/', verifyToken, createNewAlbum)
albumRoutes.get('/', verifyToken, fetchAlbums)
albumRoutes.put('/:id', verifyToken, updateAlbum)
albumRoutes.delete('/:id', verifyToken, deleteAlbum)
albumRoutes.post('/:id', verifyToken, shareAlbum)

export default albumRoutes