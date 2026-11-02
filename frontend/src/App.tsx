import { useEffect, useState } from "react"
import "./App.css"

const API_URL = "http://localhost:3000/api"

type Saglik = { durum: string; mesaj: string }
type Stok = {
  id: number
  depo_id: number
  miktar: number
  depolar: { ad: string }
  malzemeler: { ad: string; birim: string; kritik_stok_seviyesi: number }
}

async function getir<T>(adres: string): Promise<T> {
  const yanit = await fetch(adres)
  if (!yanit.ok) throw new Error("Sunucudan veri alınamadı")
  return yanit.json() as Promise<T>
}

function App() {
  const [saglik, setSaglik] = useState<Saglik | null>(null)
  const [bakiyeler, setBakiyeler] = useState<Stok[]>([])
  const [kritikStoklar, setKritikStoklar] = useState<Stok[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [sonGuncelleme, setSonGuncelleme] = useState<Date | null>(null)

  const yenile = async () => {
    try {
      setHata(null)
      const [durum, stok, kritik] = await Promise.all([
        getir<Saglik>(`${API_URL}/saglik`),
        getir<Stok[]>(`${API_URL}/stok-hareketleri/bakiyeler`),
        getir<Stok[]>(`${API_URL}/stok-hareketleri/kritik`),
      ])
      setSaglik(durum)
      setBakiyeler(stok)
      setKritikStoklar(kritik)
      setSonGuncelleme(new Date())
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Backend'e ulaşılamadı")
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    void yenile()
    const zamanlayici = window.setInterval(() => void yenile(), 10000)
    return () => window.clearInterval(zamanlayici)
  }, [])

  const toplamMiktar = bakiyeler.reduce((toplam, stok) => toplam + stok.miktar, 0)

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div className="brand-mark"><span>AF</span><strong>AfetFlow</strong></div>
        <nav className="main-nav" aria-label="Ana navigasyon">
          <button className="nav-item active">Overview</button>
          <button className="nav-item">Depolar</button>
          <button className="nav-item">Stok hareketleri</button>
          <button className="nav-item">Sevkiyatlar</button>
        </nav>
        <div className="header-actions">
          <span className={`live-pill ${saglik ? "online" : ""}`}><i /> {saglik ? "Live" : "Offline"}</span>
          <button className="icon-button" onClick={() => void yenile()} title="Verileri yenile" aria-label="Verileri yenile">↻</button>
          <span className="avatar">B</span>
        </div>
      </header>

      {hata && <div className="alert">{hata}</div>}

      <section className="hero-row">
        <div>
          <p className="eyebrow">PAZARTESİ, 02 KASIM 2026</p>
          <h1>Hoş geldin, Burak<span>.</span></h1>
          <p className="hero-copy">Operasyonların bugün sakin görünüyor. Depo hareketlerini buradan takip et.</p>
        </div>
        <div className="hero-actions"><button className="primary-button">+ Yeni stok hareketi</button><button className="secondary-button">Raporu görüntüle</button></div>
      </section>

      <section className="metric-grid" aria-label="Stok özeti">
        <article className="glass-card metric-card"><span className="metric-label">Toplam stok miktarı</span><strong>{toplamMiktar.toLocaleString("tr-TR")}</strong><span className="metric-note positive">↑ Canlı bakiye <small>tüm depolar</small></span></article>
        <article className="glass-card metric-card"><span className="metric-label">İzlenen kalem</span><strong>{bakiyeler.length}</strong><span className="metric-note">Depo / malzeme eşleşmesi</span></article>
        <article className={`glass-card metric-card ${kritikStoklar.length ? "metric-warning" : ""}`}><span className="metric-label">Kritik stok</span><strong>{kritikStoklar.length}</strong><span className="metric-note">{kritikStoklar.length ? "Müdahale gerekiyor" : "Kritik kayıt yok"}</span></article>
        <article className="glass-card metric-card"><span className="metric-label">Sistem durumu</span><strong className="system-value">{saglik ? "Aktif" : "Bekliyor"}</strong><span className="metric-note">{sonGuncelleme ? sonGuncelleme.toLocaleTimeString("tr-TR") : "Veri bekleniyor"}</span></article>
      </section>

      <section className="dashboard-grid">
        <article className="glass-card chart-card">
          <div className="section-heading"><div><p className="eyebrow">CANLI BAKİYE</p><h2>Depo stok görünümü</h2></div><button className="filter-button">Tüm depolar⌄</button></div>
          {yukleniyor ? <p className="empty-state">Veriler yükleniyor...</p> : bakiyeler.length === 0 ? <p className="empty-state">Henüz stok bakiyesi bulunmuyor.</p> : <div className="stock-bars">{bakiyeler.map((stok) => { const yuzde = Math.min((stok.miktar / Math.max(stok.malzemeler.kritik_stok_seviyesi * 3, 1)) * 100, 100); return <div className="bar-row" key={stok.id}><div className="bar-label"><span>{stok.malzemeler.ad}</span><b>{stok.miktar} {stok.malzemeler.birim}</b></div><div className="bar-track"><span style={{ width: `${yuzde}%` }} /></div><small>{stok.depolar.ad}</small></div> })}</div>}
        </article>

        <article className="glass-card critical-card">
          <div className="section-heading"><div><p className="eyebrow">UYARI LİSTESİ</p><h2>Kritik stoklar</h2></div><span className="count-badge">{kritikStoklar.length}</span></div>
          {kritikStoklar.length === 0 ? <p className="empty-state">Tüm stoklar eşik üzerinde.</p> : <ul className="critical-list">{kritikStoklar.map((stok) => <li key={stok.id}><div><strong>{stok.malzemeler.ad}</strong><span>{stok.depolar.ad}</span></div><b>{stok.miktar} / {stok.malzemeler.kritik_stok_seviyesi}</b></li>)}</ul>}
        </article>
      </section>

      <section className="lower-grid">
        <article className="glass-card activity-card"><div className="section-heading"><div><p className="eyebrow">OPERASYON NOTU</p><h2>Bugünün odağı</h2></div><span className="orange-mark">●</span></div><p className="focus-copy">Stok bakiyelerini kritik eşiklerin üzerinde tut. Yeni giriş ve çıkışlar canlı olarak bu ekrana yansır.</p><div className="focus-line"><span>Otomatik yenileme</span><b>10 sn</b></div></article>
        <article className="glass-card activity-card"><div className="section-heading"><div><p className="eyebrow">SON GÜNCELLEME</p><h2>Veri akışı</h2></div><span className="orange-mark">↗</span></div><p className="focus-copy">Backend bağlantısı aktif. Dashboard, stok bakiyesi ve kritik kontrol endpoint’lerini izliyor.</p><div className="focus-line"><span>Durum</span><b className="online-text">Bağlı</b></div></article>
      </section>
    </main>
  )
}

export default App