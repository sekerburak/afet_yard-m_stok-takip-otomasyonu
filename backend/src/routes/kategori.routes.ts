import { Router } from "express";
import { getMalzemeKategorileri } from "../controllers/malzeme.controller";

const router = Router();

router.get("/", getMalzemeKategorileri);

export default router;
