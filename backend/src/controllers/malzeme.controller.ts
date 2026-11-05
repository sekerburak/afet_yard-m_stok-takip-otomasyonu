import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

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
    res.status(500).json({ mesaj: "Malzeme eklenirken bir sunucu hatası oluştu." });
  }
};

export const updateMalzemeDurum = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const aktif = req.body.aktif;
  if (!Number.isInteger(id) || typeof aktif !== "boolean") return res.status(400).json({ mesaj: "Geçerli malzeme ve aktif bilgisi gönderilmelidir." });
  try {
    const malzeme = await prisma.malzemeler.update({ where: { id }, data: { aktif } });
    return res.json({ durum: "başarılı", mesaj: `Malzeme ${aktif ? "aktif edildi" : "pasifleştirildi"}.`, veri: malzeme });
  } catch (error) {
    console.error("Malzeme durumu güncellenirken hata:", error);
    return res.status(404).json({ mesaj: "Malzeme bulunamadı." });
  }
};