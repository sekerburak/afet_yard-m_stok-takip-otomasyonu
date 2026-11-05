import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

export const getKullanicilar = async (req: Request, res: Response) => {
  try {
    const kullanicilar = await prisma.kullanicilar.findMany({
      select: {
        id: true,
        ad_soyad: true,
        eposta: true,
        rol_id: true,
        aktif: true,
        olusturma_tarihi: true,
        roller: { select: { ad: true } },
      },
    });
    res.json(kullanicilar);
  } catch (error) {
    res.status(500).json({ mesaj: "Kullanıcılar getirilirken hata oluştu." });
  }
};

export const createKullanici = async (req: Request, res: Response) => {
  try {
    const { ad_soyad, eposta, sifre, rol_id } = req.body;
    if (typeof ad_soyad !== "string" || !ad_soyad.trim() || typeof eposta !== "string" || !eposta.trim() || typeof sifre !== "string" || sifre.length < 6) {
      return res.status(400).json({ mesaj: "Ad, eposta ve en az 6 karakterli şifre zorunludur." });
    }
    const rolId = Number(rol_id);
    if (!Number.isInteger(rolId)) return res.status(400).json({ mesaj: "Geçerli bir rol seçilmelidir." });
    const rol = await prisma.roller.findUnique({ where: { id: rolId } });
    if (!rol || !rol.aktif) return res.status(400).json({ mesaj: "Seçilen rol aktif değil veya bulunamadı." });
    const sifreHash = await bcrypt.hash(sifre, 12);
    const yeniKullanici = await prisma.kullanicilar.create({
      data: { ad_soyad: ad_soyad.trim(), eposta: eposta.trim().toLowerCase(), sifre_hash: sifreHash, rol_id: rolId },
    });
    res.status(201).json({
      durum: "başarılı",
      veri: { id: yeniKullanici.id, ad_soyad: yeniKullanici.ad_soyad, eposta: yeniKullanici.eposta },
    });
  } catch (error) {
    console.error("Kullanıcı eklenirken hata:", error);
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return res.status(409).json({ mesaj: "Bu eposta adresi zaten kayıtlı." });
    }
    return res.status(500).json({ mesaj: "Kullanıcı eklenirken hata oluştu." });
  }
};

export const getRoller = async (_req: Request, res: Response) => {
  try {
    const roller = await prisma.roller.findMany({ where: { aktif: true }, orderBy: { ad: "asc" }, select: { id: true, ad: true, aciklama: true } });
    return res.json(roller);
  } catch (error) {
    console.error("Roller getirilirken hata:", error);
    return res.status(500).json({ mesaj: "Roller getirilirken hata oluştu." });
  }
};

export const updateKullaniciDurum = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const aktif = req.body.aktif;
  if (!Number.isInteger(id) || typeof aktif !== "boolean") return res.status(400).json({ mesaj: "Geçerli kullanıcı ve aktif bilgisi gönderilmelidir." });
  if (id === req.kullanici?.id && !aktif) return res.status(400).json({ mesaj: "Kendi hesabınızı pasifleştiremezsiniz." });
  try {
    const kullanici = await prisma.kullanicilar.update({ where: { id }, data: { aktif } });
    return res.json({ durum: "başarılı", mesaj: `Kullanıcı ${aktif ? "aktif edildi" : "pasifleştirildi"}.`, veri: { id: kullanici.id, aktif: kullanici.aktif } });
  } catch (error) {
    console.error("Kullanıcı durumu güncellenirken hata:", error);
    return res.status(404).json({ mesaj: "Kullanıcı bulunamadı." });
  }
};