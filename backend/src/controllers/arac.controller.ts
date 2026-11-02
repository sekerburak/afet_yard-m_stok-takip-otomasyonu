import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tüm araçları listele
export const getAraclar = async (req: Request, res: Response) => {
  try {
    const araclar = await prisma.araclar.findMany();
    res.json(araclar);
  } catch (error) {
    console.error("Araçlar getirilirken hata:", error);
    res.status(500).json({ mesaj: "Araçlar getirilirken bir sunucu hatası oluştu." });
  }
};

// Yeni araç ekle
export const createArac = async (req: Request, res: Response) => {
  try {
    const { plaka, arac_tipi, kapasite_kg, surucu_adi, surucu_telefon, durum } = req.body;

    const yeniArac = await prisma.araclar.create({
      data: {
        plaka,
        arac_tipi,
        kapasite_kg: kapasite_kg ? Number(kapasite_kg) : null,
        surucu_adi,
        surucu_telefon,
        durum: durum || "MUSAIT",
      },
    });

    res.status(201).json({
      durum: "başarılı",
      mesaj: "Araç başarıyla sisteme kaydedildi.",
      veri: yeniArac,
    });
  } catch (error) {
    console.error("Araç eklenirken hata:", error);
    res.status(500).json({ mesaj: "Araç eklenirken bir sunucu hatası oluştu.", hata: String(error) });
  }
};