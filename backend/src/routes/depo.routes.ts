import { Router } from "express";
import { getDepolar, createDepo, updateDepoDurum } from "../controllers/depo.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// GET /api/depolar -> Tüm depoları listeler
router.get("/", requireAuth, getDepolar);

// POST /api/depolar -> Yeni depo ekler
router.post("/", requireAuth, requireRole("Yönetici"), createDepo);
router.patch("/:id/durum", requireAuth, requireRole("Yönetici"), updateDepoDurum);

export default router;