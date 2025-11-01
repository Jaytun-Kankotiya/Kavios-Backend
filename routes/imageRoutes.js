import express from "express"
import { 
  addNewImage, 
  deleteById, 
  fetchAllImages, 
  fetchImageById, 
  updateById,
  fetchRecentImages,
  fetchTrash,
  restoreImage,
  permanentlyDeleteImage,
  emptyTrash,
  cleanupOldTrash,
  fetchAllFavoriteImages,
  deleteMultipleImages
} from "../controllers/imageController.js"
import { verifyToken } from "../middleware/verifyToken.js"
import upload from "../middleware/uploadMidleware.js"

const imageRouter = express.Router()

imageRouter.post('/upload', verifyToken, upload.single('image'), addNewImage)
imageRouter.get('/', verifyToken, fetchAllImages)
imageRouter.get('/recent', verifyToken, fetchRecentImages)
imageRouter.get('/favorites/all', verifyToken, fetchAllFavoriteImages)
imageRouter.get('/:id', verifyToken, fetchImageById)
imageRouter.patch('/:id', verifyToken, updateById)
imageRouter.delete('/bulk-delete', verifyToken, deleteMultipleImages)
imageRouter.delete('/:id', verifyToken, deleteById)


imageRouter.get('/trash/all', verifyToken, fetchTrash)
imageRouter.post('/trash/:id/restore', verifyToken, restoreImage)
imageRouter.delete('/trash/:id/permanent', verifyToken, permanentlyDeleteImage)
imageRouter.delete('/trash/empty', verifyToken, emptyTrash)

imageRouter.delete('/trash/cleanup', cleanupOldTrash)

export default imageRouter