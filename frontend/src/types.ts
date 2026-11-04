export type Saglik = { durum: string; mesaj: string }

export type Stok = {
  id: number
  depo_id: number
  malzeme_id: number
  miktar: number
  guncelleme_tarihi: string
  depolar: { id: number; ad: string; il: string; ilce?: string | null }
  malzemeler: {
    id: number
    ad: string
    birim: string
    kritik_stok_seviyesi: number
    malzeme_kategorileri?: { ad: string }
  }
}

export type Depo = {
  id: number
  ad: string
  il: string
  ilce?: string | null
  adres?: string | null
  enlem?: string | number | null
  boylam?: string | number | null
  aktif: boolean
}

export type Bolge = {
  id: number
  ad: string
  il: string
  ilce?: string | null
  afet_turu: string
  enlem?: string | number | null
  boylam?: string | number | null
  aktif: boolean
}

export type Malzeme = {
  id: number
  ad: string
  birim: string
  kategori_id: number
  kritik_stok_seviyesi: number
  aktif: boolean
  malzeme_kategorileri?: { ad: string }
}

export type Kategori = { id: number; ad: string; aciklama?: string | null }

export type Ihtiyac = {
  id: number
  aciliyet: string
  durum: string
  aciklama?: string | null
  olusturma_tarihi: string
  bolgeler: { ad: string; il: string; ilce?: string | null }
  kullanicilar: { ad_soyad: string }
  ihtiyac_kalemleri: Array<{ talep_edilen_miktar: number; malzemeler: { ad: string; birim: string } }>
}

export type Sevkiyat = {
  id: number
  durum: string
  aciklama?: string | null
  olusturma_tarihi: string
  depolar: { ad: string }
  ihtiyaclar: { id: number; bolgeler: { ad: string } }
  araclar?: { plaka: string; arac_tipi: string } | null
  sevkiyat_kalemleri: Array<{ miktar: number; malzemeler: { ad: string; birim: string } }>
}

export type Arac = {
  id: number
  plaka: string
  arac_tipi: string
  kapasite_kg?: number | null
  surucu_adi?: string | null
  surucu_telefon?: string | null
  durum: string
  aktif: boolean
}

export type Kullanici = {
  id: number
  ad_soyad: string
  eposta: string
  rol: string
}

export type LoginResponse = {
  durum: string
  token: string
  kullanici: Kullanici
}
