import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  kullanici?: { id: number; rol_id: number; rol_adi: string };
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tanımlı değil.");
  return secret;
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ mesaj: "Bu işlem için giriş yapmalısınız." });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({ mesaj: "Geçersiz oturum tokenı." });
    }

    req.kullanici = {
      id: Number(payload.sub),
      rol_id: Number(payload.rol_id),
      rol_adi: String(payload.rol_adi),
    };
    return next();
  } catch {
    return res.status(401).json({ mesaj: "Oturum süresi dolmuş veya token geçersiz." });
  }
};

export const requireRole = (...izinliRoller: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.kullanici || !izinliRoller.includes(req.kullanici.rol_adi)) {
      return res.status(403).json({ mesaj: "Bu işlem için yeterli yetkiniz yok." });
    }
    return next();
  };

export const createToken = (kullaniciId: number, rolId: number, rolAdi: string) =>
  jwt.sign({ rol_id: rolId, rol_adi: rolAdi }, getJwtSecret(), {
    subject: String(kullaniciId),
    expiresIn: "8h",
  });
