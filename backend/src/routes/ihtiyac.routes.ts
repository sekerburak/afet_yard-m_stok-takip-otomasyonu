import { Router } from "express";
import { getIhtiyaclar, createIhtiyac, updateIhtiyacDurum } from "../controllers/ihtiyac.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/ihtiyaclar -> Tüm ihtiyaçları listele
router.get("/", requireAuth, getIhtiyaclar);

// POST /api/ihtiyaclar -> Yeni ihtiyaç ve kalemleri ekle
router.post("/", requireAuth, requireRole("Yönetici"), createIhtiyac);
router.patch("/:id/durum", requireAuth, requireRole("Yönetici"), updateIhtiyacDurum);

export default router;