import express from "express"
import { authSystem } from "../middlewares/auth.middleware.js"

const router = express.Router()


router.post("/create",authSystem,chatCreateController)
router.get("/read",authSystem,chatReadController)
router.patch("/update/:id",authSystem,chatUpdateController)
router.delete("/delete/:id",authSystem,chatDeleteController)

export default router