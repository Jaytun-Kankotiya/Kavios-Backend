import express from "express"
import { addNewImage, deleteById, fetchAllImages, fetchImageById, updateById } from "../controllers/imageController.js"
import { verifyToken } from "../middleware/verifyToken.js"
import upload from "../middleware/uploadMidleware.js"

const imageRouter = express.Router()

imageRouter.post('/upload', verifyToken, upload.single('image'), addNewImage)
imageRouter.get('/', verifyToken, fetchAllImages)
imageRouter.get('/:id', verifyToken, fetchImageById)
imageRouter.put('/:id', verifyToken, updateById)
imageRouter.delete('/:id', verifyToken, deleteById)

export default imageRouter