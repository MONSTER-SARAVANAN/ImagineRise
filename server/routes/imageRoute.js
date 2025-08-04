import expres from 'express'
import { generateImage } from '../controllers/imageController.js'
import userAuth from '../middlewares/auth.js'

const imageRouter = expres.Router()

imageRouter.post('/generate-image', userAuth, generateImage)

export default imageRouter;