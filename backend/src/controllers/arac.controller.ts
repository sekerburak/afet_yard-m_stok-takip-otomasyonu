import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

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
    const plakaValue = typeof plaka === "string" ? plaka.trim().toUpperCase() : "";
    const tipValue = typeof arac_tipi === "string" ? arac_tipi.trim().toUpperCase() : "";
    const kapasite = kapasite_kg === undefined || kapasite_kg === "" ? null : Number(kapasite_kg);

    if (!plakaValue || !tipValue) {
      return res.status(400).json({ mesaj: "Plaka ve araç tipi zorunludur." });
    }

    if (kapasite !== null && (!Number.isInteger(kapasite) || kapasite <= 0)) {
      return res.status(400).json({ mesaj: "Kapasite pozitif bir tam sayı olmalıdır." });
    }

    const yeniArac = await prisma.araclar.create({
      data: {
        plaka: plakaValue,
        arac_tipi: tipValue,
        kapasite_kg: kapasite,
        surucu_adi: typeof surucu_adi === "string" && surucu_adi.trim() ? surucu_adi.trim() : null,
        surucu_telefon: typeof surucu_telefon === "string" && surucu_telefon.trim() ? surucu_telefon.trim() : null,
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
    res.status(500).json({ mesaj: "Araç eklenirken bir sunucu hatası oluştu." });
  }
};

export const updateAracDurum = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const durum = String(req.body.durum ?? "").toUpperCase();
  const izinliDurumlar = ["MUSAIT", "GOREVDE", "BAKIMDA"];

  if (!Number.isInteger(id) || !izinliDurumlar.includes(durum)) {
    return res.status(400).json({ mesaj: "Geçerli bir araç numarası ve durum gönderilmelidir." });
  }

  try {
    const arac = await prisma.araclar.update({ where: { id }, data: { durum } });
    return res.json({ durum: "başarılı", mesaj: "Araç durumu güncellendi.", veri: arac });
  } catch (error) {
    console.error("Araç durumu güncellenirken hata:", error);
    return res.status(404).json({ mesaj: "Araç bulunamadı veya durumu güncellenemedi." });
  }
};