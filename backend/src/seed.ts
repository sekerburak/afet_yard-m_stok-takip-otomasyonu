import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateUser() {
  const role = await prisma.roller.upsert({
    where: { ad: "Yönetici" },
    update: {},
    create: { ad: "Yönetici", aciklama: "Tüm operasyonları yönetir." },
  });

  const existing = await prisma.kullanicilar.findUnique({ where: { eposta: "burak@afet.com" } });
  if (existing) {
    return prisma.kullanicilar.update({
      where: { id: existing.id },
      data: { ad_soyad: "Burak Yılmaz" },
    });
  }

  return prisma.kullanicilar.create({
    data: {
      ad_soyad: "Burak Yılmaz",
      eposta: "burak@afet.com",
      sifre_hash: await bcrypt.hash("636363", 12),
      rol_id: role.id,
    },
  });
}

async function main() {
  const user = await getOrCreateUser();
  const categories = await Promise.all(
    ["Gıda", "Barınma", "Tıbbi", "Hijyen"].map((ad) =>
      prisma.malzeme_kategorileri.upsert({ where: { ad }, update: {}, create: { ad } }),
    ),
  );
  const categoryByName = Object.fromEntries(categories.map((category) => [category.ad, category.id]));

  const depotSeeds = [
    { ad: "Kuzey Lojistik Deposu", il: "Malatya", ilce: "Battalgazi", adres: "Organize Sanayi 4. Cadde", enlem: 38.380, boylam: 38.320 },
    { ad: "Güney Yardım Deposu", il: "Hatay", ilce: "Antakya", adres: "Yeni Sanayi Bölgesi", enlem: 36.205, boylam: 36.160 },
  ];
  const depots = [];
  for (const depot of depotSeeds) {
    depots.push(await prisma.depolar.upsert({ where: { ad: depot.ad }, update: {}, create: depot }));
  }
  const allDepots = await prisma.depolar.findMany({ orderBy: { id: "asc" } });

  const regionSeeds = [
    { ad: "Hatay Antakya Acil Bölgesi", il: "Hatay", ilce: "Antakya", afet_turu: "DEPREM", enlem: 36.205, boylam: 36.160 },
    { ad: "Kahramanmaraş Merkez Bölgesi", il: "Kahramanmaraş", ilce: "Onikişubat", afet_turu: "DEPREM", enlem: 37.575, boylam: 36.935 },
  ];
  const regions = [];
  for (const region of regionSeeds) {
    regions.push(await prisma.bolgeler.upsert({ where: { ad: region.ad }, update: {}, create: region }));
  }
  const allRegions = await prisma.bolgeler.findMany({ orderBy: { id: "asc" } });

  const materialSeeds = [
    { ad: "Kışlık Battaniye", kategori_id: categoryByName["Barınma"], birim: "Adet", kritik_stok_seviyesi: 50 },
    { ad: "İlk Yardım Seti", kategori_id: categoryByName["Tıbbi"], birim: "Set", kritik_stok_seviyesi: 25 },
    { ad: "Hijyen Paketi", kategori_id: categoryByName["Hijyen"], birim: "Paket", kritik_stok_seviyesi: 40 },
  ];
  const materials = [];
  for (const material of materialSeeds) {
    materials.push(await prisma.malzemeler.upsert({ where: { ad: material.ad }, update: {}, create: material }));
  }
  const water = await prisma.malzemeler.findUniqueOrThrow({ where: { ad: "İçme Suyu (5 Litre)" } });

  const vehicleSeeds = [
    { plaka: "44 DEM 046", arac_tipi: "TIR", kapasite_kg: 18000, surucu_adi: "Mehmet Kaya", surucu_telefon: "05551234568", durum: "MUSAIT" },
    { plaka: "31 YRD 112", arac_tipi: "KAMYON", kapasite_kg: 8000, surucu_adi: "Selin Aras", surucu_telefon: "05551234569", durum: "MUSAIT" },
    { plaka: "06 AF 025", arac_tipi: "KAMYON", kapasite_kg: 1500, surucu_adi: "Ali Demir", surucu_telefon: "05551234567", durum: "MUSAIT" },
  ];
  const vehicles = [];
  for (const vehicle of vehicleSeeds) {
    vehicles.push(await prisma.araclar.upsert({ where: { plaka: vehicle.plaka }, update: {}, create: vehicle }));
  }

  const stockSeeds = [
    { depo_id: allDepots[0]?.id, malzeme_id: water.id, miktar: 200 },
    { depo_id: allDepots[0]?.id, malzeme_id: materials[0].id, miktar: 120 },
    { depo_id: allDepots[0]?.id, malzeme_id: materials[1].id, miktar: 18 },
    { depo_id: allDepots[1]?.id, malzeme_id: materials[2].id, miktar: 65 },
  ];
  for (const stock of stockSeeds) {
    if (!stock.depo_id) continue;
    await prisma.depo_stoklari.upsert({
      where: { depo_id_malzeme_id: { depo_id: stock.depo_id, malzeme_id: stock.malzeme_id } },
      update: {},
      create: stock,
    });
  }

  const needSeeds = [
    { region: allRegions[0], description: "Antakya sahra alanı için acil hijyen ve su ihtiyacı.", priority: "KRITIK", materialId: materials[2].id, quantity: 150 },
    { region: allRegions[1], description: "Kahramanmaraş bölgesinde kışlık battaniye talebi.", priority: "YUKSEK", materialId: materials[0].id, quantity: 80 },
  ];
  const needs = [];
  for (const item of needSeeds) {
    if (!item.region) continue;
    let need = await prisma.ihtiyaclar.findFirst({ where: { aciklama: item.description } });
    if (!need) {
      need = await prisma.ihtiyaclar.create({
        data: {
          bolge_id: item.region.id,
          olusturan_id: user.id,
          aciliyet: item.priority,
          aciklama: item.description,
          ihtiyac_kalemleri: { create: [{ malzeme_id: item.materialId, talep_edilen_miktar: item.quantity }] },
        },
      });
    }
    needs.push(need);
  }

  if (needs[0] && allDepots[0] && vehicles[1]) {
    const description = "Hatay sahra alanına acil sevkiyat.";
    const existing = await prisma.sevkiyatlar.findFirst({ where: { aciklama: description } });
    if (!existing) {
      await prisma.sevkiyatlar.create({
        data: {
          ihtiyac_id: needs[0].id,
          kaynak_depo_id: allDepots[0].id,
          arac_id: vehicles[1].id,
          olusturan_id: user.id,
          durum: "YOLDA",
          aciklama: description,
          sevkiyat_kalemleri: { create: [{ malzeme_id: materials[2].id, miktar: 80 }] },
        },
      });
    }
  }

  if (needs[1] && allDepots[1] && vehicles[0]) {
    const description = "Kahramanmaraş bölgesine battaniye sevkiyatı.";
    const existing = await prisma.sevkiyatlar.findFirst({ where: { aciklama: description } });
    if (!existing) {
      await prisma.sevkiyatlar.create({
        data: {
          ihtiyac_id: needs[1].id,
          kaynak_depo_id: allDepots[1].id,
          arac_id: vehicles[0].id,
          olusturan_id: user.id,
          durum: "HAZIRLANIYOR",
          aciklama: description,
          sevkiyat_kalemleri: { create: [{ malzeme_id: materials[0].id, miktar: 50 }] },
        },
      });
    }
  }

  console.log("Demo veri hazır:", { depolar: allDepots.length, bolgeler: allRegions.length, araclar: vehicles.length, ihtiyaclar: needs.length });
}

main().catch((error) => {
  console.error("Demo seed başarısız:", error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
