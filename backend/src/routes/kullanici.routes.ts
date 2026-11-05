import { Router } from "express";
import { getKullanicilar, createKullanici, getRoller, updateKullaniciDurum } from "../controllers/kullanici.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
const router = Router();
router.get("/", requireAuth, requireRole("Yönetici"), getKullanicilar);
router.get("/roller", requireAuth, requireRole("Yönetici"), getRoller);
router.post("/", requireAuth, requireRole("Yönetici"), createKullanici);
router.patch("/:id/durum", requireAuth, requireRole("Yönetici"), updateKullaniciDurum);
export default router;