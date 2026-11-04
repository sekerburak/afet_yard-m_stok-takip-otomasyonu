import type {
  Arac,
  Bolge,
  Depo,
  Ihtiyac,
  Kategori,
  LoginResponse,
  Malzeme,
  Saglik,
  Sevkiyat,
  Stok,
} from "./types"

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("afet_token")
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = (await response.json().catch(() => null)) as { mesaj?: string } | T | null

  if (!response.ok) {
    if (response.status === 401) sessionStorage.removeItem("afet_token")
    const message = data && typeof data === "object" && "mesaj" in data ? data.mesaj : "İstek tamamlanamadı"
    throw new ApiError(message ?? "İstek tamamlanamadı", response.status)
  }

  return data as T
}

export const api = {
  login: (eposta: string, sifre: string) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ eposta, sifre }) }),
  saglik: () => request<Saglik>("/saglik"),
  bakiyeler: () => request<Stok[]>("/stok-hareketleri/bakiyeler"),
  kritikStoklar: () => request<Stok[]>("/stok-hareketleri/kritik"),
  stokHareketi: (payload: { depo_id: number; malzeme_id: number; miktar: number; hareket_tipi: "GIRIS" | "CIKIS"; aciklama?: string }) =>
    request("/stok-hareketleri", { method: "POST", body: JSON.stringify(payload) }),
  depolar: () => request<Depo[]>("/depolar"),
  depoOlustur: (payload: { ad: string; il: string; ilce?: string; adres?: string; enlem?: number; boylam?: number }) =>
    request("/depolar", { method: "POST", body: JSON.stringify(payload) }),
  bolgeler: () => request<Bolge[]>("/bolgeler"),
  malzemeler: () => request<Malzeme[]>("/malzemeler"),
  kategoriler: () => request<Kategori[]>("/malzeme-kategorileri"),
  malzemeOlustur: (payload: { ad: string; kategori_id: number; birim: string; kritik_stok_seviyesi: number }) =>
    request("/malzemeler", { method: "POST", body: JSON.stringify(payload) }),
  ihtiyacOlustur: (payload: { bolge_id: number; aciliyet: string; aciklama: string; kalemler: Array<{ malzeme_id: number; talep_edilen_miktar: number }> }) =>
    request("/ihtiyaclar", { method: "POST", body: JSON.stringify(payload) }),
  sevkiyatOlustur: (payload: { ihtiyac_id: number; kaynak_depo_id: number; arac_id?: number; aciklama: string; kalemler: Array<{ malzeme_id: number; miktar: number }> }) =>
    request("/sevkiyatlar", { method: "POST", body: JSON.stringify(payload) }),
  ihtiyaclar: () => request<Ihtiyac[]>("/ihtiyaclar"),
  sevkiyatlar: () => request<Sevkiyat[]>("/sevkiyatlar"),
  araclar: () => request<Arac[]>("/araclar"),
}
