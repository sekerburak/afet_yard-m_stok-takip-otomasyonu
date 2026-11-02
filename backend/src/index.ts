import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import depoRoutes from "./routes/depo.routes";
import malzemeRoutes from "./routes/malzeme.routes";
import ihtiyacRoutes from "./routes/ihtiyac.routes";
import bolgeRoutes from "./routes/bolge.routes";
import kullaniciRoutes from "./routes/kullanici.routes";
import sevkiyatRoutes from "./routes/sevkiyat.routes";
import aracRoutes from "./routes/arac.routes";
import stokHareketRoutes from "./routes/stokHareket.routes";
import authRoutes from "./routes/auth.routes";

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/saglik", (_req, res) => {
  res.json({ durum: "çalışıyor", mesaj: "Afet depo sistemi backend'i ayakta" });
});

// Rotaları bağlıyoruz
app.use("/api/depolar", depoRoutes);
app.use("/api/malzemeler", malzemeRoutes);
app.use("/api/ihtiyaclar", ihtiyacRoutes);
app.use("/api/bolgeler", bolgeRoutes);
app.use("/api/kullanicilar", kullaniciRoutes);
app.use("/api/sevkiyatlar", sevkiyatRoutes);
app.use("/api/araclar", aracRoutes);
app.use("/api/stok-hareketleri", stokHareketRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});