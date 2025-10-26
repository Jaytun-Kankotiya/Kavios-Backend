import express from "express"
import { addNewImage, deleteById, fetchAllImages, fetchImageById, updateById } from "../controllers/imageController.js"
import { verifyToken } from "../middleware/verifyToken.js"


const imageRouter = express.Router()

imageRouter.post('/upload', verifyToken, addNewImage)
imageRouter.get('/', verifyToken, fetchAllImages)
imageRouter.get('/:id', verifyToken, fetchImageById)
imageRouter.put('/:id', verifyToken, updateById)
imageRouter.delete('/:id', verifyToken, deleteById)

export default imageRouter