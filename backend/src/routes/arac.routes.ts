import { Router } from "express";
import { getAraclar, createArac, updateAracDurum } from "../controllers/arac.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getAraclar);
router.post("/", requireAuth, requireRole("Yönetici"), createArac);
router.patch("/:id/durum", requireAuth, requireRole("Yönetici"), updateAracDurum);

export default router;