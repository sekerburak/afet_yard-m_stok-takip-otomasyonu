import { Router } from "express";
import { getSevkiyatlar, createSevkiyat } from "../controllers/sevkiyat.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/sevkiyatlar -> Tüm sevkiyatları listele
router.get("/", getSevkiyatlar);

// POST /api/sevkiyatlar -> Yeni sevkiyat ve kalemlerini oluştur
router.post("/", requireAuth, requireRole("Yönetici"), createSevkiyat);

export default router;