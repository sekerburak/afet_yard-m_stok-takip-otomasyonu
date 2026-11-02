import { Router } from "express";
import { getKullanicilar, createKullanici } from "../controllers/kullanici.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
const router = Router();
router.get("/", getKullanicilar);
router.post("/", requireAuth, requireRole("Yönetici"), createKullanici);
export default router;