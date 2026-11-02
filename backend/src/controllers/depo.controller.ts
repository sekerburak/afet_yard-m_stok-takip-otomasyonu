import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
    res.status(500).json({ mesaj: "Depo eklenirken bir sunucu hatası oluştu.", hata: String(error) });
  }
};