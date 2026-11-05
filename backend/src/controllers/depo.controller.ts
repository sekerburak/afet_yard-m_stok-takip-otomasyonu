import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Tüm depoları getir
export const getDepolar = async (req: Request, res: Response) => {
  try {
    const depolar = await prisma.depolar.findMany();
    res.json(depolar);
  } catch (error) {
    console.error("Depolar çekilirken hata:", error);
    res.status(500).json({ mesaj: "Depolar getirilirken bir sunucu hatası oluştu." });
  }
};

// Yeni depo ekle
export const createDepo = async (req: Request, res: Response) => {
  try {
    const { ad, il, ilce, adres, enlem, boylam, sorumlu_id } = req.body;

    // Prisma kullanarak veritabanına yeni kayıt atıyoruz (şemadaki gerçek alan adlarıyla)
    const yeniDepo = await prisma.depolar.create({
      data: {
        ad,
        il,
        ilce,
        adres,
        enlem: enlem ? Number(enlem) : null,
        boylam: boylam ? Number(boylam) : null,
        sorumlu_id: sorumlu_id ? Number(sorumlu_id) : null,
      },
    });

    res.status(201).json({
      durum: "başarılı",
      mesaj: "Depo başarıyla eklendi.",
      veri: yeniDepo,
    });
  } catch (error) {
    console.error("Depo eklenirken hata:", error);
    res.status(500).json({ mesaj: "Depo eklenirken bir sunucu hatası oluştu." });
  }
};

export const updateDepoDurum = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  const aktif = req.body.aktif;
  if (!Number.isInteger(id) || typeof aktif !== "boolean") return res.status(400).json({ mesaj: "Geçerli depo ve aktif bilgisi gönderilmelidir." });
  try {
    const depo = await prisma.depolar.update({ where: { id }, data: { aktif } });
    return res.json({ durum: "başarılı", mesaj: `Depo ${aktif ? "aktif edildi" : "pasifleştirildi"}.`, veri: depo });
  } catch (error) {
    console.error("Depo durumu güncellenirken hata:", error);
    return res.status(404).json({ mesaj: "Depo bulunamadı." });
  }
};