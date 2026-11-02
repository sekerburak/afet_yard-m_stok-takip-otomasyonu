import { Router } from "express";
import { getAraclar, createArac } from "../controllers/arac.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getAraclar);
router.post("/", requireAuth, requireRole("Yönetici"), createArac);

export default router;