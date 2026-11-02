import { Router } from "express";
import { getMalzemeler, createMalzeme } from "../controllers/malzeme.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/malzemeler -> Tüm malzemeleri listele
router.get("/", getMalzemeler);

// POST /api/malzemeler -> Yeni malzeme ekle
router.post("/", requireAuth, requireRole("Yönetici"), createMalzeme);

export default router;