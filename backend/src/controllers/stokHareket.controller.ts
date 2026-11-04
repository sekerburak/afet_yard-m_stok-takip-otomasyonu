import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Tüm stok hareketlerini listele
export const getStokHareketleri = async (req: Request, res: Response) => {
  try {
    const hareketler = await prisma.stok_hareketleri.findMany();
    res.json(hareketler);
  } catch (error) {
    console.error("Stok hareketleri getirilirken hata:", error);
    res.status(500).json({ mesaj: "Stok hareketleri getirilirken bir sunucu hatası oluştu." });
  }
};

  export const getStokBakiyeleri = async (req: Request, res: Response) => {
    try {
      const depoId = req.query.depo_id ? Number(req.query.depo_id) : undefined;
      const bakiyeler = await prisma.depo_stoklari.findMany({
        where: depoId ? { depo_id: depoId } : undefined,
        include: { depolar: true, malzemeler: true },
        orderBy: [{ depo_id: "asc" }, { malzeme_id: "asc" }],
      });

      res.json(bakiyeler);
    } catch (error) {
      console.error("Stok bakiyeleri getirilirken hata:", error);
      res.status(500).json({ mesaj: "Stok bakiyeleri getirilirken bir sunucu hatası oluştu." });
    }
  };

  export const getKritikStoklar = async (req: Request, res: Response) => {
    try {
      const depoId = req.query.depo_id ? Number(req.query.depo_id) : undefined;
      const bakiyeler = await prisma.depo_stoklari.findMany({
        where: depoId ? { depo_id: depoId } : undefined,
        include: { depolar: true, malzemeler: true },
        orderBy: [{ depo_id: "asc" }, { miktar: "asc" }],
      });

      res.json(
        bakiyeler
          .filter(({ miktar, malzemeler }) => miktar <= malzemeler.kritik_stok_seviyesi)
          .map((stok) => ({
            ...stok,
            kritik: true,
            eksik_miktar: Math.max(stok.malzemeler.kritik_stok_seviyesi - stok.miktar, 0),
          })),
      );
    } catch (error) {
      console.error("Kritik stoklar getirilirken hata:", error);
      res.status(500).json({ mesaj: "Kritik stoklar getirilirken bir sunucu hatası oluştu." });
    }
  };

// Yeni stok hareketi ekle (Giriş veya Çıkış)
export const createStokHareketi = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { depo_id, malzeme_id, miktar, hareket_tipi, aciklama } = req.body;

    const depoId = Number(depo_id);
    const malzemeId = Number(malzeme_id);
    const miktarNumber = Number(miktar);
    const hareketTipi = String(hareket_tipi).toUpperCase();

    if (!Number.isInteger(depoId) || !Number.isInteger(malzemeId) || !Number.isInteger(miktarNumber) || miktarNumber <= 0) {
      return res.status(400).json({ mesaj: "depo_id, malzeme_id ve miktar pozitif tam sayı olmalıdır." });
    }

    if (hareketTipi !== "GIRIS" && hareketTipi !== "CIKIS") {
      return res.status(400).json({ mesaj: "hareket_tipi GIRIS veya CIKIS olmalıdır." });
    }

    const sonuc = await prisma.$transaction(async (tx) => {
        const mevcutStok = await tx.depo_stoklari.findUnique({
          where: {
            depo_id_malzeme_id: { depo_id: depoId, malzeme_id: malzemeId },
          },
        });

        const mevcutMiktar = mevcutStok?.miktar ?? 0;
        const yeniMiktar = hareketTipi === "GIRIS"
          ? mevcutMiktar + miktarNumber
          : mevcutMiktar - miktarNumber;

        if (yeniMiktar < 0) {
          throw new Error("Yetersiz stok");
        }

        const stok = mevcutStok
          ? await tx.depo_stoklari.update({
              where: { id: mevcutStok.id },
              data: { miktar: yeniMiktar },
            })
          : await tx.depo_stoklari.create({
              data: { depo_id: depoId, malzeme_id: malzemeId, miktar: yeniMiktar },
            });

        const hareket = await tx.stok_hareketleri.create({
          data: {
            depo_id: depoId,
            malzeme_id: malzemeId,
            miktar: miktarNumber,
            hareket_tipi: hareketTipi,
            kullanici_id: req.kullanici?.id ?? 0,
            aciklama,
          },
        });

        return { hareket, stok };
    });

    res.status(201).json({
      durum: "başarılı",
      mesaj: "Stok hareketi başarıyla sisteme kaydedildi.",
      veri: sonuc.hareket,
      bakiye: sonuc.stok,
    });
  } catch (error) {
    console.error("Stok hareketi eklenirken hata:", error);
    if (error instanceof Error && error.message === "Yetersiz stok") {
      return res.status(409).json({ mesaj: "Yetersiz stok. Çıkış miktarı mevcut bakiyeden fazla olamaz." });
    }
    res.status(500).json({ mesaj: "Stok hareketi eklenirken bir sunucu hatası oluştu.", hata: String(error) });
  }
};