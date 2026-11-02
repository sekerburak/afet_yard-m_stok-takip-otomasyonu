import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tüm sevkiyatları ilişkili detaylarıyla listele
export const getSevkiyatlar = async (req: Request, res: Response) => {
  try {
    const sevkiyatlar = await prisma.sevkiyatlar.findMany({
      include: {
        ihtiyaclar: true,     // Hangi ihtiyaca istinaden yapıldığı
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
export const createSevkiyat = async (req: Request, res: Response) => {
  try {
    const { ihtiyac_id, kaynak_depo_id, arac_id, olusturan_id, aciklama, kalemler } = req.body;
    // kalemler: [{ malzeme_id: 1, miktar: 200 }] şeklinde gelecek

    const yeniSevkiyat = await prisma.sevkiyatlar.create({
      data: {
        ihtiyac_id: Number(ihtiyac_id),
        kaynak_depo_id: Number(kaynak_depo_id),
        arac_id: arac_id ? Number(arac_id) : null,
        olusturan_id: Number(olusturan_id),
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
    res.status(500).json({ mesaj: "Sevkiyat eklenirken bir sunucu hatası oluştu.", hata: String(error) });
  }
};