import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createToken } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
  try {
    const eposta = typeof req.body.eposta === "string" ? req.body.eposta.trim().toLowerCase() : "";
    const sifre = typeof req.body.sifre === "string" ? req.body.sifre : "";
    if (!eposta || !sifre) {
      return res.status(400).json({ mesaj: "eposta ve sifre zorunludur." });
    }

    const kullanici = await prisma.kullanicilar.findUnique({
      where: { eposta },
      include: { roller: true },
    });

    if (!kullanici || !kullanici.aktif) {
      return res.status(401).json({ mesaj: "Eposta veya sifre hatalı." });
    }

    let dogruSifre = await bcrypt.compare(sifre, kullanici.sifre_hash);
    if (!dogruSifre && !kullanici.sifre_hash.startsWith("$2")) {
      dogruSifre = sifre === kullanici.sifre_hash;
      if (dogruSifre) {
        const hash = await bcrypt.hash(sifre, 12);
        await prisma.kullanicilar.update({
          where: { id: kullanici.id },
          data: { sifre_hash: hash },
        });
      }
    }

    if (!dogruSifre) {
      return res.status(401).json({ mesaj: "Eposta veya sifre hatalı." });
    }

    return res.json({
      durum: "başarılı",
      token: createToken(kullanici.id, kullanici.rol_id, kullanici.roller.ad),
      kullanici: {
        id: kullanici.id,
        ad_soyad: kullanici.ad_soyad,
        eposta: kullanici.eposta,
        rol: kullanici.roller.ad,
      },
    });
  } catch (error) {
    console.error("Giriş yapılırken hata:", error);
    return res.status(500).json({ mesaj: "Giriş yapılırken sunucu hatası oluştu." });
  }
};
