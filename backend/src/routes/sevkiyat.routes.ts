import { Router } from "express";
import { getSevkiyatlar, createSevkiyat, updateSevkiyatDurum } from "../controllers/sevkiyat.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/sevkiyatlar -> Tüm sevkiyatları listele
router.get("/", requireAuth, getSevkiyatlar);

// POST /api/sevkiyatlar -> Yeni sevkiyat ve kalemlerini oluştur
router.post("/", requireAuth, requireRole("Yönetici"), createSevkiyat);
router.patch("/:id/durum", requireAuth, requireRole("Yönetici"), updateSevkiyatDurum);

export default router;