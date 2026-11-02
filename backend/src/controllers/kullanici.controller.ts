import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const getKullanicilar = async (req: Request, res: Response) => {
  try {
    const kullanicilar = await prisma.kullanicilar.findMany();
    res.json(kullanicilar);
  } catch (error) {
    res.status(500).json({ mesaj: "Kullanıcılar getirilirken hata oluştu." });
  }
};

export const createKullanici = async (req: Request, res: Response) => {
  try {
    const { ad_soyad, eposta, sifre_hash, rol_id } = req.body;
    const sifreHash = await bcrypt.hash(String(sifre_hash), 12);
    const yeniKullanici = await prisma.kullanicilar.create({
      data: { ad_soyad, eposta, sifre_hash: sifreHash, rol_id: Number(rol_id) },
    });
    res.status(201).json({
      durum: "başarılı",
      veri: { id: yeniKullanici.id, ad_soyad: yeniKullanici.ad_soyad, eposta: yeniKullanici.eposta },
    });
  } catch (error) {
    res.status(500).json({ mesaj: "Kullanıcı eklenirken hata oluştu.", hata: String(error) });
  }
};