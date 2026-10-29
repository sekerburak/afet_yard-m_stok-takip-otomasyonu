import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import depoRoutes from "./routes/depo.routes";

// Prisma Client'ı başlatıyoruz
const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Sağlık kontrolü
app.get("/api/saglik", (_req, res) => {
  res.json({ durum: "çalışıyor", mesaj: "Afet depo sistemi backend'i ayakta" });
});

// Veritabanı bağlantı testi
app.get("/api/db-test", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ durum: "bağlantı başarılı", mesaj: "Prisma ile PostgreSQL bağlantısı kuruldu!" });
  } catch (hata) {
    console.error("Veritabanı hatası:", hata);
    res.status(500).json({ durum: "bağlantı başarısız", hata: String(hata) });
  }
});

// Depo Rotalarını bağlıyoruz
app.use("/api/depolar", depoRoutes);

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});