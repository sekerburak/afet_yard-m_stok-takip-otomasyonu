import { Router } from "express";
import { getMalzemeKategorileri } from "../controllers/malzeme.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, getMalzemeKategorileri);

export default router;
