import { Router } from "express";
import { verifyDevice } from "../middlewares/deviceAuth.middleware.js";
import { handleScan } from "../controllers/rfid.controller.js";

const router = Router();

router.post("/scan", verifyDevice, handleScan);

export default router;


