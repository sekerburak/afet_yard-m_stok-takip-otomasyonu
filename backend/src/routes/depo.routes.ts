import { Router } from "express";
import { getDepolar, createDepo } from "../controllers/depo.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/depolar -> Tüm depoları listeler
router.get("/", getDepolar);

// POST /api/depolar -> Yeni depo ekler
router.post("/", requireAuth, requireRole("Yönetici"), createDepo);

export default router;