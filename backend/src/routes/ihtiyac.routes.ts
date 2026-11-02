import { Router } from "express";
import { getIhtiyaclar, createIhtiyac } from "../controllers/ihtiyac.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/ihtiyaclar -> Tüm ihtiyaçları listele
router.get("/", getIhtiyaclar);

// POST /api/ihtiyaclar -> Yeni ihtiyaç ve kalemleri ekle
router.post("/", requireAuth, requireRole("Yönetici"), createIhtiyac);

export default router;