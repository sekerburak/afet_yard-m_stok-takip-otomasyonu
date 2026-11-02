import { Router } from "express";
import {
	getStokHareketleri,
	getStokBakiyeleri,
	getKritikStoklar,
	createStokHareketi,
} from "../controllers/stokHareket.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getStokHareketleri);
router.get("/bakiyeler", getStokBakiyeleri);
router.get("/kritik", getKritikStoklar);
router.post("/", requireAuth, requireRole("Yönetici"), createStokHareketi);

export default router;
