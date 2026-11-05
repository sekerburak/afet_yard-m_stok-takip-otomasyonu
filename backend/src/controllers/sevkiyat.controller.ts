import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Tüm sevkiyatları ilişkili detaylarıyla listele
export const getSevkiyatlar = async (req: Request, res: Response) => {
  try {
    const sevkiyatlar = await prisma.sevkiyatlar.findMany({
      include: {
        ihtiyaclar: {
          include: {
            bolgeler: true,
          },
        },                  // Hangi ihtiyaca istinaden yapıldığı
        depolar: true,        // Hangi depodan çıkış yaptığı
        araclar: true,        // Hangi araçla taşındığı
        kullanicilar: true,   // Kimin oluşturduğu
        sevkiyat_kalemleri: {
          include: {
            malzemeler: true  // Sevkiyat içindeki malzeme detayları
          }
        }
      },
    });
    res.json(sevkiyatlar);
  } catch (error) {
    console.error("Sevkiyatlar çekilirken hata:", error);
    res.status(500).json({ mesaj: "Sevkiyatlar getirilirken bir sunucu hatası oluştu." });
  }
};

// Yeni sevkiyat oluştur
export const createSevkiyat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ihtiyac_id, kaynak_depo_id, arac_id, aciklama, kalemler } = req.body;
    // kalemler: [{ malzeme_id: 1, miktar: 200 }] şeklinde gelecek

    const yeniSevkiyat = await prisma.sevkiyatlar.create({
      data: {
        ihtiyac_id: Number(ihtiyac_id),
        kaynak_depo_id: Number(kaynak_depo_id),
        arac_id: arac_id ? Number(arac_id) : null,
        olusturan_id: req.kullanici?.id ?? 0,
        aciklama,
        durum: "HAZIRLANIYOR",
        sevkiyat_kalemleri: {
          create: kalemler.map((kalem: any) => ({
            malzeme_id: Number(kalem.malzeme_id),
            miktar: Number(kalem.miktar),
          })),
        },
      },
      include: {
        sevkiyat_kalemleri: true,
      },
    });

    res.status(201).json({
      durum: "başarılı",
      mesaj: "Sevkiyat başarıyla oluşturuldu ve hazırlık aşamasına alındı.",
      veri: yeniSevkiyat,
    });
  } catch (error) {
    console.error("Sevkiyat eklenirken hata:", error);
    res.status(500).json({ mesaj: "Sevkiyat eklenirken bir sunucu hatası oluştu." });
  }
};

export const updateSevkiyatDurum = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const durum = String(req.body.durum ?? "").toUpperCase();
  const izinliDurumlar = ["HAZIRLANIYOR", "YOLDA", "TESLIM_EDILDI", "IPTAL"];

  if (!Number.isInteger(id) || !izinliDurumlar.includes(durum)) {
    return res.status(400).json({ mesaj: "Geçerli bir sevkiyat numarası ve durum gönderilmelidir." });
  }

  try {
    const sevkiyat = await prisma.sevkiyatlar.update({
      where: { id },
      data: {
        durum,
        cikis_tarihi: durum === "YOLDA" ? new Date() : undefined,
        teslim_tarihi: durum === "TESLIM_EDILDI" ? new Date() : undefined,
      },
    });
    return res.json({ durum: "başarılı", mesaj: "Sevkiyat durumu güncellendi.", veri: sevkiyat });
  } catch (error) {
    console.error("Sevkiyat durumu güncellenirken hata:", error);
    return res.status(404).json({ mesaj: "Sevkiyat bulunamadı veya durumu güncellenemedi." });
  }
};