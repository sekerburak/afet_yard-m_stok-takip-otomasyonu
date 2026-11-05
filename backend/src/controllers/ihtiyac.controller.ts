import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Tüm ihtiyaçları bölge ve oluşturan kullanıcı bilgisiyle listele
export const getIhtiyaclar = async (req: Request, res: Response) => {
  try {
    const ihtiyaclar = await prisma.ihtiyaclar.findMany({
      include: {
        bolgeler: true,     // İhtiyacın ait olduğu afet bölgesi
        kullanicilar: true, // İhtiyacı oluşturan kullanıcı
        ihtiyac_kalemleri: {
          include: {
            malzemeler: true // İhtiyaç duyulan malzemelerin detayları
          }
        }
      },
    });
    res.json(ihtiyaclar);
  } catch (error) {
    console.error("İhtiyaçlar çekilirken hata:", error);
    res.status(500).json({ mesaj: "İhtiyaçlar getirilirken bir sunucu hatası oluştu." });
  }
};

// Yeni ihtiyaç kaydı oluştur
export const createIhtiyac = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bolge_id, aciliyet, aciklama, kalemler } = req.body;
    // kalemler: [{ malzeme_id: 1, talep_edilen_miktar: 500 }] şeklinde gelecek

    const yeniIhtiyac = await prisma.ihtiyaclar.create({
      data: {
        bolge_id: Number(bolge_id),
        olusturan_id: req.kullanici?.id ?? 0,
        aciliyet,
        aciklama,
        ihtiyac_kalemleri: {
          create: kalemler.map((kalem: any) => ({
            malzeme_id: Number(kalem.malzeme_id),
            talep_edilen_miktar: Number(kalem.talep_edilen_miktar),
          })),
        },
      },
      include: {
        ihtiyac_kalemleri: true,
      },
    });

    res.status(201).json({
      durum: "başarılı",
      mesaj: "Afet ihtiyaç kaydı başarıyla oluşturuldu.",
      veri: yeniIhtiyac,
    });
  } catch (error) {
    console.error("İhtiyaç eklenirken hata:", error);
    res.status(500).json({ mesaj: "İhtiyaç eklenirken bir sunucu hatası oluştu." });
  }
};

export const updateIhtiyacDurum = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const durum = String(req.body.durum ?? "").toUpperCase();
  const izinliDurumlar = ["BEKLEMEDE", "ONAYLANDI", "KARSILANIYOR", "TAMAMLANDI", "IPTAL"];

  if (!Number.isInteger(id) || !izinliDurumlar.includes(durum)) {
    return res.status(400).json({ mesaj: "Geçerli bir ihtiyaç numarası ve durum gönderilmelidir." });
  }

  try {
    const ihtiyac = await prisma.ihtiyaclar.update({
      where: { id },
      data: { durum, guncelleme_tarihi: new Date() },
    });
    return res.json({ durum: "başarılı", mesaj: "İhtiyaç durumu güncellendi.", veri: ihtiyac });
  } catch (error) {
    console.error("İhtiyaç durumu güncellenirken hata:", error);
    return res.status(404).json({ mesaj: "İhtiyaç bulunamadı veya durumu güncellenemedi." });
  }
};