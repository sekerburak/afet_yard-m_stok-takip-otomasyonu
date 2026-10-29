import { Router } from "express";
import { getDepolar } from "../controllers/depo.controller";

const router = Router();

// GET isteği geldiğinde controller'daki getDepolar fonksiyonunu çalıştır
router.get("/", getDepolar);

export default router;