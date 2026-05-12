import express from "express"
import { authSystem } from "../middlewares/auth.middleware.js"

const router = express.Router()


router.post("/create",authSystem,messageCreateController)
router.get("/read/:chatId",authSystem,messageReadController)
router.patch("/update/:id",authSystem,messageUpdateController)
router.delete("/delete/:id",authSystem,messageDeleteController)

export default router