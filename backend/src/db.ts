import dotenv from "dotenv";
import { Pool } from "pg";

// .env dosyasındaki değerleri okuyup process.env içine yükler
dotenv.config();

// Havuz (Pool): veritabanına açılan bağlantıları yöneten yapı.
// Her sorguda yeni bağlantı açmak yerine hazır bağlantıları tekrar kullanır.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});