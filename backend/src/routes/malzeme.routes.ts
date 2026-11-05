import { Router } from "express";
import { getMalzemeler, createMalzeme, updateMalzemeDurum } from "../controllers/malzeme.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/malzemeler -> Tüm malzemeleri listele
router.get("/", requireAuth, getMalzemeler);

// POST /api/malzemeler -> Yeni malzeme ekle
router.post("/", requireAuth, requireRole("Yönetici"), createMalzeme);
router.patch("/:id/durum", requireAuth, requireRole("Yönetici"), updateMalzemeDurum);

export default router;