import { Router } from "express";
import {
	getStokHareketleri,
	getStokBakiyeleri,
	getKritikStoklar,
	createStokHareketi,
} from "../controllers/stokHareket.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getStokHareketleri);
router.get("/bakiyeler", requireAuth, getStokBakiyeleri);
router.get("/kritik", requireAuth, getKritikStoklar);
router.post("/", requireAuth, requireRole("Yönetici"), createStokHareketi);

export default router;
