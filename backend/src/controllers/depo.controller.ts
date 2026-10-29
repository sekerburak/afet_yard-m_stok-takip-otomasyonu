import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tüm depoları veritabanından çeken fonksiyon
export const getDepolar = async (req: Request, res: Response) => {
  try {
    const depolar = await prisma.depolar.findMany();
    res.json(depolar);
  } catch (error) {
    console.error("Depolar çekilirken hata:", error);
    res.status(500).json({ mesaj: "Depolar getirilirken bir sunucu hatası oluştu." });
  }
};