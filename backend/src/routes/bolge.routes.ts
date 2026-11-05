import { Router } from "express";
import { getBolgeler, createBolge } from "../controllers/bolge.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
const router = Router();
router.get("/", requireAuth, getBolgeler);
router.post("/", requireAuth, requireRole("Yönetici"), createBolge);
export default router;