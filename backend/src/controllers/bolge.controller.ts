import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getBolgeler = async (req: Request, res: Response) => {
  try {
    const bolgeler = await prisma.bolgeler.findMany();
    res.json(bolgeler);
  } catch (error) {
    res.status(500).json({ mesaj: "Bölgeler getirilirken hata oluştu." });
  }
};

export const createBolge = async (req: Request, res: Response) => {
  try {
    const { ad, il, ilce, afet_turu, enlem, boylam } = req.body;
    const yeniBolge = await prisma.bolgeler.create({
      data: { ad, il, ilce, afet_turu, enlem: enlem ? Number(enlem) : null, boylam: boylam ? Number(boylam) : null },
    });
    res.status(201).json({ durum: "başarılı", veri: yeniBolge });
  } catch (error) {
    res.status(500).json({ mesaj: "Bölge eklenirken hata oluştu." });
  }
};