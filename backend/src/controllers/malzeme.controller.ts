import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getMalzemeKategorileri = async (req: Request, res: Response) => {
  try {
    const kategoriler = await prisma.malzeme_kategorileri.findMany({ orderBy: { ad: "asc" } });
    res.json(kategoriler);
  } catch (error) {
    console.error("Malzeme kategorileri getirilirken hata:", error);
    res.status(500).json({ mesaj: "Malzeme kategorileri getirilirken hata oluştu." });
  }
};

// Tüm malzemeleri listele (Kategori bilgisiyle birlikte)
export const getMalzemeler = async (req: Request, res: Response) => {
  try {
    const malzemeler = await prisma.malzemeler.findMany({
      include: {
        malzeme_kategorileri: true, // Hangi kategoriye ait olduğunu da görelim
      },
    });
    res.json(malzemeler);
  } catch (error) {
    console.error("Malzemeler çekilirken hata:", error);
    res.status(500).json({ mesaj: "Malzemeler getirilirken bir sunucu hatası oluştu." });
  }
};

// Yeni malzeme ekle
export const createMalzeme = async (req: Request, res: Response) => {
  try {
    const { ad, kategori_id, birim, kritik_stok_seviyesi } = req.body;

    const yeniMalzeme = await prisma.malzemeler.create({
      data: {
        ad,
        kategori_id: Number(kategori_id),
        birim,
        kritik_stok_seviyesi: kritik_stok_seviyesi ? Number(kritik_stok_seviyesi) : 5,
      },
    });

    res.status(201).json({
      durum: "başarılı",
      mesaj: "Malzeme başarıyla eklendi.",
      veri: yeniMalzeme,
    });
  } catch (error) {
    console.error("Malzeme eklenirken hata:", error);
    res.status(500).json({ mesaj: "Malzeme eklenirken bir sunucu hatası oluştu.", hata: String(error) });
  }
};