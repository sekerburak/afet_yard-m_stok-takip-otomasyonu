import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  UserRound,
  Activity,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleAlert,
  Clock3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  Truck,
  Warehouse,
  X,
} from "lucide-react"
import "./App.css"
import { api, ApiError } from "./api"
import type { Arac, Bolge, Depo, Ihtiyac, Kategori, Kullanici, Malzeme, Saglik, Sevkiyat, Stok, StokHareketi, YonetimKullanicisi, Rol } from "./types"

type View = "dashboard" | "stok" | "depolar" | "malzemeler" | "ihtiyaclar" | "sevkiyatlar" | "araclar" | "kullanicilar"

type AppData = {
  saglik: Saglik | null
  bakiyeler: Stok[]
  kritik: Stok[]
  stokHareketleri: StokHareketi[]
  kullanicilar: YonetimKullanicisi[]
  roller: Rol[]
  depolar: Depo[]
  malzemeler: Malzeme[]
  ihtiyaclar: Ihtiyac[]
  sevkiyatlar: Sevkiyat[]
  araclar: Arac[]
  bolgeler: Bolge[]
  kategoriler: Kategori[]
}

const emptyData: AppData = {
  saglik: null,
  bakiyeler: [],
  kritik: [],
  stokHareketleri: [],
  kullanicilar: [],
  roller: [],
  depolar: [],
  malzemeler: [],
  ihtiyaclar: [],
  sevkiyatlar: [],
  araclar: [],
  bolgeler: [],
  kategoriler: [],
}

const menuItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "stok", label: "Stok yönetimi", icon: Boxes },
  { id: "depolar", label: "Depolar", icon: Warehouse },
  { id: "malzemeler", label: "Yardım malzemeleri", icon: PackageCheck },
  { id: "ihtiyaclar", label: "Yardım talepleri", icon: ClipboardList },
  { id: "sevkiyatlar", label: "Sevkiyatlar", icon: Truck },
  { id: "araclar", label: "Araç yönetimi", icon: Truck },
  { id: "kullanicilar", label: "Kullanıcılar", icon: UserRound },
]

function LoginScreen({ onLogin }: { onLogin: (eposta: string, sifre: string) => Promise<void> }) {
  const [eposta, setEposta] = useState("")
  const [sifre, setSifre] = useState("")
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await onLogin(eposta, sifre)
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Giriş yapılamadı")
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel glass-card">
        <div className="brand-mark large"><span>AF</span><strong>AfetFlow</strong></div>
        <p className="eyebrow">AFET LOJİSTİK OPERASYONLARI</p>
        <h1>Operasyon merkezine giriş yap.</h1>
        <p className="login-copy">Depo, stok ve sevkiyat akışını tek ekrandan yönet.</p>
        <form onSubmit={submit} className="login-form">
          <label>Eposta<input value={eposta} onChange={(event) => setEposta(event.target.value)} type="email" placeholder="ornek@afet.com" required /></label>
          <label>Şifre<input value={sifre} onChange={(event) => setSifre(event.target.value)} type="password" placeholder="••••••" required /></label>
          {hata && <div className="form-error">{hata}</div>}
          <button className="primary-button" disabled={yukleniyor}>{yukleniyor ? "Giriş yapılıyor..." : "Giriş yap"}</button>
        </form>
      </section>
    </main>
  )
}

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("afet_token"))
  const [kullanici, setKullanici] = useState<Kullanici | null>(() => {
    const saved = sessionStorage.getItem("afet_user")
    return saved ? JSON.parse(saved) as Kullanici : null
  })
  const [view, setView] = useState<View>("dashboard")
  const [data, setData] = useState<AppData>(emptyData)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [sidebarAcik, setSidebarAcik] = useState(true)
  const [mobilMenu, setMobilMenu] = useState(false)
  const [stokModalAcik, setStokModalAcik] = useState(false)
  const [depoModalAcik, setDepoModalAcik] = useState(false)
  const [malzemeModalAcik, setMalzemeModalAcik] = useState(false)
  const [ihtiyacModalAcik, setIhtiyacModalAcik] = useState(false)
  const [sevkiyatModalAcik, setSevkiyatModalAcik] = useState(false)
  const [aracModalAcik, setAracModalAcik] = useState(false)
  const [kullaniciModalAcik, setKullaniciModalAcik] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("afet_theme") as "dark" | "light") || "dark")

  const login = async (eposta: string, sifre: string) => {
    const result = await api.login(eposta, sifre)
    sessionStorage.setItem("afet_token", result.token)
    sessionStorage.setItem("afet_user", JSON.stringify(result.kullanici))
    setToken(result.token)
    setKullanici(result.kullanici)
  }

  const logout = useCallback(() => {
    sessionStorage.removeItem("afet_token")
    sessionStorage.removeItem("afet_user")
    setToken(null)
    setKullanici(null)
  }, [])

  const yenile = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const [saglik, bakiyeler, kritik, stokHareketleri, depolar, malzemeler, kategoriler, ihtiyaclar, sevkiyatlar, araclar, bolgeler] = await Promise.all([
        api.saglik(), api.bakiyeler(), api.kritikStoklar(), api.stokHareketleri(), api.depolar(), api.malzemeler(), api.kategoriler(), api.ihtiyaclar(), api.sevkiyatlar(), api.araclar(), api.bolgeler(),
      ])
      const [kullanicilar, roller] = kullanici?.rol === "Yönetici"
        ? await Promise.all([api.kullanicilar(), api.roller()])
        : [emptyData.kullanicilar, emptyData.roller]
      setData({ saglik, bakiyeler, kritik, stokHareketleri, depolar, malzemeler, kategoriler, ihtiyaclar, sevkiyatlar, araclar, bolgeler, kullanicilar, roller })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout()
      setHata(error instanceof Error ? error.message : "Veriler alınamadı")
    } finally {
      setYukleniyor(false)
    }
  }, [kullanici, logout])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("afet_theme", theme)
  }, [theme])

  useEffect(() => {
    if (!token) return
    void yenile()
    const interval = window.setInterval(() => void yenile(), 10000)
    return () => window.clearInterval(interval)
  }, [token, yenile])

  if (!token) return <LoginScreen onLogin={login} />

  const activeLabel = menuItems.find((item) => item.id === view)?.label ?? "Dashboard"
  const durumGuncelle = async (action: () => Promise<unknown>) => {
    try {
      setHata(null)
      await action()
      await yenile()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Durum güncellenemedi")
    }
  }

  return (
    <div className={`app-layout ${sidebarAcik ? "sidebar-open" : "sidebar-collapsed"}`}>
      {mobilMenu && <button className="mobile-scrim" onClick={() => setMobilMenu(false)} aria-label="Menüyü kapat" />}
      <aside className={`sidebar ${mobilMenu ? "mobile-visible" : ""}`}>
        <div className="sidebar-brand"><div className="brand-mark"><span>AF</span>{sidebarAcik && <strong>AfetFlow</strong>}</div><button className="sidebar-close" onClick={() => setMobilMenu(false)} aria-label="Menüyü kapat"><X size={18} /></button></div>
        <div className="sidebar-section-label">OPERASYON</div>
        <nav className="sidebar-nav">
          {menuItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setView(id); setMobilMenu(false) }} className={`sidebar-link ${view === id ? "active" : ""}`} title={!sidebarAcik ? label : undefined}><Icon size={18} /><span>{sidebarAcik && label}</span></button>)}
        </nav>
        {sidebarAcik && <><div className="sidebar-section-label lower">SİSTEM</div><button className="sidebar-link disabled"><Settings size={18} /><span>Ayarlar yakında</span></button><button className="sidebar-link logout-link" onClick={logout}><LogOut size={18} /><span>Çıkış yap</span></button></>}
        <button className="collapse-button" onClick={() => setSidebarAcik((open) => !open)} title={sidebarAcik ? "Menüyü daralt" : "Menüyü genişlet"}>{sidebarAcik ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}</button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button" onClick={() => setMobilMenu(true)} aria-label="Menüyü aç"><Menu size={20} /></button>
          <div><p className="topbar-kicker">AFET YARDIM STOK TAKİP SİSTEMİ</p><h2>{activeLabel}</h2></div>
          <div className="topbar-actions"><button className="secondary-button compact-button" onClick={() => setStokModalAcik(true)}><Boxes size={14} /> Yeni hareket</button><span className={`live-pill ${data.saglik ? "online" : ""}`}><i /> {data.saglik ? "Sistem aktif" : "Bağlantı bekleniyor"}</span><button className="icon-button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"} aria-label="Temayı değiştir">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button><button className="icon-button" onClick={() => void yenile()} title="Verileri yenile" aria-label="Verileri yenile"><RefreshCw size={17} className={yukleniyor ? "spin" : ""} /></button><div className="user-chip"><span className="avatar">{kullanici?.ad_soyad.slice(0, 1) ?? "?"}</span><span>{kullanici?.ad_soyad ?? "Kullanıcı"}</span></div></div>
        </header>
        {hata && <div className="alert"><AlertTriangle size={17} />{hata}</div>}
        {stokModalAcik && <StockMovementModal depolar={data.depolar} malzemeler={data.malzemeler} onClose={() => setStokModalAcik(false)} onDone={async () => { setStokModalAcik(false); await yenile() }} />}
        <div className="page-content">
            {view === "dashboard" && <Dashboard data={data} kullanici={kullanici} />}
          {view === "stok" && <StockPage stocks={data.bakiyeler} critical={data.kritik} movements={data.stokHareketleri} />}
          {view === "depolar" && <DepoPage depolar={data.depolar} stocks={data.bakiyeler} onAdd={() => setDepoModalAcik(true)} onUpdate={(id, aktif) => void durumGuncelle(() => api.depoDurumuGuncelle(id, aktif))} />}
          {view === "malzemeler" && <MalzemePage malzemeler={data.malzemeler} onAdd={() => setMalzemeModalAcik(true)} onUpdate={(id, aktif) => void durumGuncelle(() => api.malzemeDurumuGuncelle(id, aktif))} />}
          {view === "ihtiyaclar" && <IhtiyacPage ihtiyaclar={data.ihtiyaclar} onAdd={() => setIhtiyacModalAcik(true)} onUpdate={(id, durum) => void durumGuncelle(() => api.ihtiyacDurumuGuncelle(id, durum))} />}
          {view === "sevkiyatlar" && <SevkiyatPage sevkiyatlar={data.sevkiyatlar} onAdd={() => setSevkiyatModalAcik(true)} onUpdate={(id, durum) => void durumGuncelle(() => api.sevkiyatDurumuGuncelle(id, durum))} />}
          {view === "araclar" && <AracPage araclar={data.araclar} onAdd={() => setAracModalAcik(true)} onUpdate={(id, durum) => void durumGuncelle(() => api.aracDurumuGuncelle(id, durum))} />}
          {view === "kullanicilar" && <KullaniciPage kullanicilar={data.kullanicilar} onAdd={() => setKullaniciModalAcik(true)} onUpdate={(id, aktif) => void durumGuncelle(() => api.kullaniciDurumuGuncelle(id, aktif))} />}
        </div>
      </main>
      {depoModalAcik && <DepoModal onClose={() => setDepoModalAcik(false)} onDone={async () => { setDepoModalAcik(false); await yenile() }} />}
      {malzemeModalAcik && <MalzemeModal kategoriler={data.kategoriler} onClose={() => setMalzemeModalAcik(false)} onDone={async () => { setMalzemeModalAcik(false); await yenile() }} />}
      {ihtiyacModalAcik && <IhtiyacModal bolgeler={data.bolgeler} malzemeler={data.malzemeler} onClose={() => setIhtiyacModalAcik(false)} onDone={async () => { setIhtiyacModalAcik(false); await yenile() }} />}
      {sevkiyatModalAcik && <SevkiyatModal ihtiyaclar={data.ihtiyaclar} depolar={data.depolar} araclar={data.araclar} malzemeler={data.malzemeler} onClose={() => setSevkiyatModalAcik(false)} onDone={async () => { setSevkiyatModalAcik(false); await yenile() }} />}
      {aracModalAcik && <AracModal onClose={() => setAracModalAcik(false)} onDone={async () => { setAracModalAcik(false); await yenile() }} />}
      {kullaniciModalAcik && <KullaniciModal roller={data.roller} onClose={() => setKullaniciModalAcik(false)} onDone={async () => { setKullaniciModalAcik(false); await yenile() }} />}
    </div>
  )
}

function Dashboard({ data, kullanici }: { data: AppData; kullanici: Kullanici | null }) {
  const firstName = kullanici?.ad_soyad.split(" ")[0] ?? "Kullanıcı"
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])
  const today = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(now)

  return <>
    <section className="welcome-row"><div><p className="eyebrow">{today.toLocaleUpperCase("tr-TR")}</p><h1>Hoş geldin, {firstName}<span>.</span></h1><p className="hero-copy">Afet operasyonlarını tek merkezden izle.</p></div><div className="dashboard-date">CANLI BAĞLANTI<br /><strong>{now.toLocaleTimeString("tr-TR")}</strong></div></section>
    <section className="tactical-grid">
      <TacticalMap depolar={data.depolar} bolgeler={data.bolgeler} sevkiyatSayisi={data.sevkiyatlar.length} ihtiyacSayisi={data.ihtiyaclar.length} />
      <InventoryPanel stocks={data.bakiyeler} critical={data.kritik} />
      <ShipmentPanel sevkiyatlar={data.sevkiyatlar} />
      <NeedsPanel ihtiyaclar={data.ihtiyaclar} />
      <FleetPanel araclar={data.araclar} />
    </section>
  </>
}

function StockMovementModal({ depolar, malzemeler, onClose, onDone }: { depolar: Depo[]; malzemeler: Malzeme[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [depoId, setDepoId] = useState(depolar[0]?.id ?? 0)
  const [malzemeId, setMalzemeId] = useState(malzemeler[0]?.id ?? 0)
  const [miktar, setMiktar] = useState(1)
  const [hareketTipi, setHareketTipi] = useState<"GIRIS" | "CIKIS">("GIRIS")
  const [aciklama, setAciklama] = useState("")
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await api.stokHareketi({ depo_id: depoId, malzeme_id: malzemeId, miktar: Number(miktar), hareket_tipi: hareketTipi, aciklama })
      await onDone()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Stok hareketi kaydedilemedi")
    } finally {
      setYukleniyor(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="movement-modal glass-card"><div className="modal-heading"><div><p className="eyebrow">ENVANTER İŞLEMİ</p><h2>Yeni stok hareketi</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={17} /></button></div><form className="movement-form" onSubmit={submit}><div className="segmented-control"><button type="button" className={hareketTipi === "GIRIS" ? "selected" : ""} onClick={() => setHareketTipi("GIRIS")}>Stok girişi</button><button type="button" className={hareketTipi === "CIKIS" ? "selected danger-select" : ""} onClick={() => setHareketTipi("CIKIS")}>Stok çıkışı</button></div><label>Depo<select value={depoId} onChange={(event) => setDepoId(Number(event.target.value))}>{depolar.map((depo) => <option value={depo.id} key={depo.id}>{depo.ad}</option>)}</select></label><label>Malzeme<select value={malzemeId} onChange={(event) => setMalzemeId(Number(event.target.value))}>{malzemeler.map((malzeme) => <option value={malzeme.id} key={malzeme.id}>{malzeme.ad}</option>)}</select></label><label>Miktar<input type="number" min="1" value={miktar} onChange={(event) => setMiktar(Number(event.target.value))} required /></label><label>Açıklama<textarea value={aciklama} onChange={(event) => setAciklama(event.target.value)} rows={3} /></label>{hata && <div className="form-error">{hata}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button><button type="submit" className="primary-button" disabled={yukleniyor}>{yukleniyor ? "Kaydediliyor..." : "Hareketi kaydet"}</button></div></form></section></div>
}

function TacticalMap({ depolar, bolgeler, sevkiyatSayisi, ihtiyacSayisi }: { depolar: Depo[]; bolgeler: Bolge[]; sevkiyatSayisi: number; ihtiyacSayisi: number }) {
  const points = [...depolar.map((depo) => ({ id: `depo-${depo.id}`, label: depo.ad, type: "depo", lat: Number(depo.enlem), lon: Number(depo.boylam) })), ...bolgeler.map((bolge) => ({ id: `bolge-${bolge.id}`, label: bolge.ad, type: "bolge", lat: Number(bolge.enlem), lon: Number(bolge.boylam) }))].filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
  const lats = points.map((point) => point.lat)
  const lons = points.map((point) => point.lon)
  const minLat = Math.min(...lats, 0), maxLat = Math.max(...lats, 1), minLon = Math.min(...lons, 0), maxLon = Math.max(...lons, 1)
  const latRange = Math.max(maxLat - minLat, 1), lonRange = Math.max(maxLon - minLon, 1)
  const position = (point: { lat: number; lon: number }) => ({ left: `${18 + ((point.lon - minLon) / lonRange) * 64}%`, top: `${78 - ((point.lat - minLat) / latRange) * 58}%` })

  return <article className="tactical-panel map-panel"><PanelTitle number="01" title="Canlı operasyon & harita" subtitle="Dark cinematic mode" />
    <div className="map-stage"><div className="map-grid" />{points.length > 1 && <svg className="route-lines" viewBox="0 0 100 100" preserveAspectRatio="none">{points.slice(1).map((point, index) => { const from = position(points[index]); const to = position(point); return <line key={point.id} x1={String(parseFloat(from.left))} y1={String(parseFloat(from.top))} x2={String(parseFloat(to.left))} y2={String(parseFloat(to.top))} /> })}</svg>}{points.map((point) => <span className={`map-node ${point.type}`} style={position(point)} title={point.label} key={point.id}><i /></span>)}{points.length === 0 && <div className="map-empty">Koordinatlı operasyon noktası bulunmuyor.</div>}<div className="map-legend"><span><i className="cyan-dot" /> Depo</span><span><i className="orange-dot" /> Afet bölgesi</span></div></div>
    <div className="map-stats"><div><span>Aktif sevkiyat</span><strong>{sevkiyatSayisi}</strong></div><div><span>Bekleyen ihtiyaç</span><strong>{ihtiyacSayisi}</strong></div><div><span>Koordinatlı nokta</span><strong>{points.length}</strong></div></div>
  </article>
}

function PanelTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) { return <div className="panel-title"><div><span className="panel-number">{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div><span className="panel-menu">•••</span></div> }

function InventoryPanel({ stocks, critical }: { stocks: Stok[]; critical: Stok[] }) { return <article className="tactical-panel inventory-panel"><PanelTitle number="02" title="Depo & envanter" subtitle="Modern glassmorphic dark" /><div className="inventory-top"><div className="ring-stat"><div><strong>{stocks.length}</strong><span>Kalem</span></div></div><div className="ring-stat orange-ring"><div><strong>{stocks.reduce((sum, stock) => sum + stock.miktar, 0)}</strong><span>Adet</span></div></div><div className={`emergency-box ${critical.length ? "danger" : "safe"}`}><AlertTriangle size={16} /><strong>{critical.length ? "Kritik stok uyarıları!" : "Stoklar güvenli"}</strong><small>{critical.length ? `${critical.length} kalem eşik altında` : "Acil müdahale gerekmiyor"}</small></div></div><div className="mini-table"><div className="mini-head"><span>Malzeme</span><span>Stok</span><span>Durum</span></div>{stocks.slice(0, 3).map((stock) => { const low = critical.some((item) => item.id === stock.id); return <div className="mini-row" key={stock.id}><span>{stock.malzemeler.ad}</span><b>{stock.miktar}</b><em className={low ? "low" : "ok"}>{low ? "Kritik" : "Dolu"}</em></div> })}{stocks.length === 0 && <Empty text="Envanter verisi bulunmuyor." />}</div></article> }

function ShipmentPanel({ sevkiyatlar }: { sevkiyatlar: Sevkiyat[] }) { const shipment = sevkiyatlar[0]; const stages = ["HAZIRLANIYOR", "CIKTI", "YOLDA", "TESLIM_EDILDI"]; const current = shipment ? Math.max(stages.indexOf(shipment.durum), 0) : -1; return <article className="tactical-panel shipment-panel"><PanelTitle number="03" title="Sevkiyat & rota" subtitle="Crisp light / sleek mode" />{shipment ? <><div className="shipment-route"><span className={current >= 0 ? "active" : ""}>Hazırlanıyor</span><b>→</b><span className={current >= 2 ? "active" : ""}>Yola çıktı</span><b>→</b><span className={current >= 3 ? "active" : ""}>Teslim edildi</span></div><div className="shipment-info"><div><small>Çıkış deposu</small><strong>{shipment.depolar.ad}</strong></div><div><small>Hedef bölge</small><strong>{shipment.ihtiyaclar.bolgeler.ad}</strong></div><div><small>Araç</small><strong>{shipment.araclar?.plaka ?? "Atanmadı"}</strong></div><span className="route-hud">⌁</span></div></> : <Empty text="Henüz sevkiyat rotası bulunmuyor." />}</article> }

function NeedsPanel({ ihtiyaclar }: { ihtiyaclar: Ihtiyac[] }) { return <article className="tactical-panel needs-panel"><PanelTitle number="04" title="İhtiyaç & eşleştirme" subtitle="High-contrast tactical / hybrid mode" />{ihtiyaclar.length ? <div className="needs-layout"><div className="priority-list">{ihtiyaclar.slice(0, 4).map((item) => <div className={`priority-row ${item.aciliyet.toLowerCase()}`} key={item.id}><strong>{item.aciliyet}</strong><span>{item.bolgeler.ad}</span><small>{item.durum}</small></div>)}</div><div className="need-bars">{ihtiyaclar.slice(0, 3).map((item) => <div key={item.id}><div><span>{item.bolgeler.ad}</span><b>{item.ihtiyac_kalemleri.length} kalem</b></div><div className="need-track"><i style={{ width: item.durum === "TESLIM_EDILDI" ? "100%" : "34%" }} /></div></div>)}</div></div> : <Empty text="İhtiyaç kaydı bulunmuyor." />}</article> }

function FleetPanel({ araclar }: { araclar: Arac[] }) { const maxCapacity = Math.max(...araclar.map((arac) => arac.kapasite_kg ?? 0), 1); return <article className="tactical-panel fleet-panel"><PanelTitle number="05" title="Filo & araç yönetimi" subtitle="Dark tactical mode" />{araclar.length ? <div className="fleet-grid">{araclar.slice(0, 3).map((arac) => <div className="fleet-card" key={arac.id}><div className="fleet-head"><strong>{arac.arac_tipi}</strong><span className={arac.durum === "MUSAIT" ? "available" : "busy"}>{arac.durum}</span></div><div className="vehicle-shape"><Truck size={42} /></div><h3>{arac.plaka}</h3><p>{arac.surucu_adi || "Sürücü atanmamış"}</p><div className="capacity"><span>Kapasite</span><b>{arac.kapasite_kg ? `${arac.kapasite_kg} kg` : "-"}</b><i><em style={{ width: `${((arac.kapasite_kg ?? 0) / maxCapacity) * 100}%` }} /></i></div></div>)}</div> : <Empty text="Araç kaydı bulunmuyor." />}</article> }

function StockPage({ stocks, critical, movements }: { stocks: Stok[]; critical: Stok[]; movements: StokHareketi[] }) {
  const [arama, setArama] = useState("")
  const [depoFiltresi, setDepoFiltresi] = useState("TUMU")
  const [durumFiltresi, setDurumFiltresi] = useState("TUMU")
  const depolar = [...new Map(stocks.map((stock) => [stock.depo_id, stock.depolar.ad])).entries()]
  const filtered = stocks.filter((stock) => {
    const isCritical = critical.some((item) => item.id === stock.id)
    const matchesSearch = `${stock.malzemeler.ad} ${stock.depolar.ad}`.toLocaleLowerCase("tr-TR").includes(arama.toLocaleLowerCase("tr-TR"))
    const matchesDepot = depoFiltresi === "TUMU" || String(stock.depo_id) === depoFiltresi
    const matchesStatus = durumFiltresi === "TUMU" || (durumFiltresi === "KRITIK" ? isCritical : !isCritical)
    return matchesSearch && matchesDepot && matchesStatus
  })

  return <DataPage title="Stok yönetimi" kicker="ENVANTER" description="Depolardaki güncel malzeme bakiyeleri ve kritik eşikler."><div className="table-toolbar"><input placeholder="Malzeme veya depo ara..." value={arama} onChange={(event) => setArama(event.target.value)} /><select value={depoFiltresi} onChange={(event) => setDepoFiltresi(event.target.value)}><option value="TUMU">Tüm depolar</option>{depolar.map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select><select value={durumFiltresi} onChange={(event) => setDurumFiltresi(event.target.value)}><option value="TUMU">Tüm durumlar</option><option value="KRITIK">Kritik</option><option value="NORMAL">Normal</option></select></div><div className="table-wrap"><table><thead><tr><th>Malzeme</th><th>Kategori</th><th>Depo</th><th>Mevcut</th><th>Minimum</th><th>Durum</th></tr></thead><tbody>{filtered.map((stock) => { const isCritical = critical.some((item) => item.id === stock.id); return <tr key={stock.id}><td><strong>{stock.malzemeler.ad}</strong></td><td>{stock.malzemeler.malzeme_kategorileri?.ad ?? "-"}</td><td>{stock.depolar.ad}</td><td className="amount">{stock.miktar} {stock.malzemeler.birim}</td><td>{stock.malzemeler.kritik_stok_seviyesi}</td><td><span className={`status-tag ${isCritical ? "danger" : "success"}`}>{isCritical ? "Kritik" : "Normal"}</span></td></tr> })}</tbody></table></div>{filtered.length === 0 && <Empty text="Filtreye uyan stok kaydı bulunmuyor." />}<StockHistory movements={movements} /></DataPage>
}

function StockHistory({ movements }: { movements: StokHareketi[] }) {
  const [filter, setFilter] = useState<"TUMU" | "GIRIS" | "CIKIS">("TUMU")
  const filtered = movements.filter((movement) => filter === "TUMU" || movement.hareket_tipi === filter)
  return <section className="history-section"><div className="section-heading"><div><p className="eyebrow">DENETİM İZİ</p><h2>Son stok hareketleri</h2></div><select className="history-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="TUMU">Tümü</option><option value="GIRIS">Girişler</option><option value="CIKIS">Çıkışlar</option></select></div>{filtered.length ? <div className="history-list">{filtered.map((movement) => <div className="history-row" key={movement.id}><span className={`history-icon ${movement.hareket_tipi === "GIRIS" ? "in" : "out"}`}>{movement.hareket_tipi === "GIRIS" ? "↑" : "↓"}</span><div className="history-main"><strong>{movement.malzemeler.ad}</strong><span>{movement.depolar.ad} · {movement.kullanicilar.ad_soyad}</span></div><div className={`history-amount ${movement.hareket_tipi === "GIRIS" ? "in" : "out"}`}>{movement.hareket_tipi === "GIRIS" ? "+" : "-"}{movement.miktar} {movement.malzemeler.birim}</div><time>{new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(movement.tarih))}</time></div>)}</div> : <Empty text="Henüz stok hareketi bulunmuyor." />}</section>
}

function DepoPage({ depolar, stocks, onAdd, onUpdate }: { depolar: Depo[]; stocks: Stok[]; onAdd: () => void; onUpdate: (id: number, aktif: boolean) => void }) { return <DataPage title="Depolar" kicker="ALTYAPI" description="Sistemdeki yardım depoları ve operasyon durumları." actionLabel="Yeni depo" onAction={onAdd}><div className="entity-grid">{depolar.map((depo) => { const depoStocks = stocks.filter((stock) => stock.depo_id === depo.id); const total = depoStocks.reduce((sum, stock) => sum + stock.miktar, 0); return <article className="entity-card" key={depo.id}><div className="entity-icon"><Warehouse size={18} /></div><div><h3>{depo.ad}</h3><p>{depo.il}{depo.ilce ? `, ${depo.ilce}` : ""}</p></div><div className="entity-stat"><span>Toplam stok</span><strong>{total}</strong></div><div className="entity-footer"><span>{depoStocks.length} malzeme kalemi</span><button type="button" className={`account-toggle ${depo.aktif ? "active" : ""}`} onClick={() => onUpdate(depo.id, !depo.aktif)}>{depo.aktif ? "Aktif" : "Pasif"}</button></div></article> })}</div>{depolar.length === 0 && <Empty text="Depo kaydı bulunmuyor." />}</DataPage> }

function MalzemePage({ malzemeler, onAdd, onUpdate }: { malzemeler: Malzeme[]; onAdd: () => void; onUpdate: (id: number, aktif: boolean) => void }) { return <DataPage title="Yardım malzemeleri" kicker="KATALOG" description="Sistemde tanımlı yardım malzemeleri ve kritik seviyeleri." actionLabel="Yeni malzeme" onAction={onAdd}><div className="entity-grid">{malzemeler.map((item) => <article className="entity-card" key={item.id}><div className="entity-icon orange"><PackageCheck size={18} /></div><h3>{item.ad}</h3><p>{item.malzeme_kategorileri?.ad ?? "Kategori belirtilmemiş"}</p><div className="entity-footer"><span>Birim: {item.birim}</span><button type="button" className={`account-toggle ${item.aktif ? "active" : ""}`} onClick={() => onUpdate(item.id, !item.aktif)}>{item.aktif ? "Aktif" : "Pasif"}</button></div></article>)}</div>{malzemeler.length === 0 && <Empty text="Malzeme kaydı bulunmuyor." />}</DataPage> }

function IhtiyacPage({ ihtiyaclar, onAdd, onUpdate }: { ihtiyaclar: Ihtiyac[]; onAdd: () => void; onUpdate: (id: number, durum: string) => void }) { return <DataPage title="Yardım talepleri" kicker="OPERASYON" description="Bölgelerden gelen ihtiyaç kayıtları." actionLabel="Yeni talep" onAction={onAdd}><div className="request-list">{ihtiyaclar.map((item) => <article className="request-card" key={item.id}><div><span className={`priority ${item.aciliyet.toLowerCase()}`}>{item.aciliyet}</span><h3>{item.bolgeler.ad}</h3><p>{item.aciklama || "Açıklama girilmemiş."}</p></div><div className="request-meta"><span>{item.kullanicilar.ad_soyad}</span><StatusSelect value={item.durum} options={["BEKLEMEDE", "ONAYLANDI", "KARSILANIYOR", "TAMAMLANDI", "IPTAL"]} onChange={(value) => onUpdate(item.id, value)} /></div></article>)}</div>{ihtiyaclar.length === 0 && <Empty text="Yardım talebi bulunmuyor." />}</DataPage> }

function SevkiyatPage({ sevkiyatlar, onAdd, onUpdate }: { sevkiyatlar: Sevkiyat[]; onAdd: () => void; onUpdate: (id: number, durum: string) => void }) { const [durum, setDurum] = useState("TUMU"); const filtered = sevkiyatlar.filter((item) => durum === "TUMU" || item.durum === durum); return <DataPage title="Sevkiyatlar" kicker="DAĞITIM" description="Hazırlanan ve takip edilen yardım sevkiyatları." actionLabel="Yeni sevkiyat" onAction={onAdd}><div className="table-toolbar"><select value={durum} onChange={(event) => setDurum(event.target.value)}><option value="TUMU">Tüm sevkiyatlar</option><option value="YOLDA">Yolda</option><option value="HAZIRLANIYOR">Hazırlanıyor</option><option value="TESLIM_EDILDI">Teslim edildi</option><option value="IPTAL">İptal</option></select></div><div className="request-list">{filtered.map((item) => <article className="request-card" key={item.id}><div><span className="priority info">SEVKİYAT #{item.id}</span><h3>{item.ihtiyaclar.bolgeler.ad}</h3><p>{item.depolar.ad}{item.araclar ? ` · ${item.araclar.plaka}` : " · Araç atanmamış"}</p></div><div className="request-meta"><StatusSelect value={item.durum} options={["HAZIRLANIYOR", "YOLDA", "TESLIM_EDILDI", "IPTAL"]} onChange={(value) => onUpdate(item.id, value)} /></div></article>)}</div>{filtered.length === 0 && <Empty text="Filtreye uyan sevkiyat bulunmuyor." />}</DataPage> }

function AracPage({ araclar, onAdd, onUpdate }: { araclar: Arac[]; onAdd: () => void; onUpdate: (id: number, durum: string) => void }) { const [durum, setDurum] = useState("TUMU"); const filtered = araclar.filter((arac) => durum === "TUMU" || arac.durum === durum); return <DataPage title="Araç yönetimi" kicker="FİLO" description="Dağıtımlarda kullanılabilecek araçlar." actionLabel="Yeni araç" onAction={onAdd}><div className="table-toolbar"><select value={durum} onChange={(event) => setDurum(event.target.value)}><option value="TUMU">Tüm araçlar</option><option value="MUSAIT">Müsait</option><option value="GOREVDE">Görevde</option><option value="BAKIMDA">Bakımda</option></select></div><div className="entity-grid">{filtered.map((arac) => <article className="entity-card" key={arac.id}><div className="entity-icon"><Truck size={18} /></div><h3>{arac.plaka}</h3><p>{arac.arac_tipi} · {arac.surucu_adi || "Sürücü atanmamış"}</p><div className="entity-footer"><span>{arac.kapasite_kg ? `${arac.kapasite_kg} kg` : "Kapasite yok"}</span><StatusSelect value={arac.durum} options={["MUSAIT", "GOREVDE", "BAKIMDA"]} onChange={(value) => onUpdate(arac.id, value)} /></div></article>)}</div>{filtered.length === 0 && <Empty text="Filtreye uyan araç bulunmuyor." />}</DataPage> }

function KullaniciPage({ kullanicilar, onAdd, onUpdate }: { kullanicilar: YonetimKullanicisi[]; onAdd: () => void; onUpdate: (id: number, aktif: boolean) => void }) {
  return <DataPage title="Kullanıcı yönetimi" kicker="SİSTEM" description="Operasyon ekibinin erişim ve hesap durumlarını yönetin." actionLabel="Yeni kullanıcı" onAction={onAdd}><div className="user-grid">{kullanicilar.map((kullanici) => <article className="user-card" key={kullanici.id}><div className="user-card-head"><span className="avatar">{kullanici.ad_soyad.slice(0, 1)}</span><div><h3>{kullanici.ad_soyad}</h3><p>{kullanici.eposta}</p></div></div><div className="user-card-meta"><span className="role-pill">{kullanici.roller.ad}</span><button type="button" className={`account-toggle ${kullanici.aktif ? "active" : ""}`} onClick={() => onUpdate(kullanici.id, !kullanici.aktif)}>{kullanici.aktif ? "Aktif" : "Pasif"}</button></div></article>)}</div>{kullanicilar.length === 0 && <Empty text="Kullanıcı bulunmuyor." />}</DataPage>
}

const statusDetails: Record<string, { label: string; tone: string; Icon: typeof Check }> = {
  MUSAIT: { label: "Müsait", tone: "available", Icon: Check },
  BEKLEMEDE: { label: "Beklemede", tone: "pending", Icon: Clock3 },
  ONAYLANDI: { label: "Onaylandı", tone: "approved", Icon: Check },
  KARSILANIYOR: { label: "Karşılanıyor", tone: "active", Icon: Activity },
  GOREVDE: { label: "Görevde", tone: "active", Icon: Activity },
  TAMAMLANDI: { label: "Tamamlandı", tone: "completed", Icon: Check },
  HAZIRLANIYOR: { label: "Hazırlanıyor", tone: "pending", Icon: Clock3 },
  YOLDA: { label: "Yolda", tone: "active", Icon: Truck },
  TESLIM_EDILDI: { label: "Teslim edildi", tone: "completed", Icon: Check },
  IPTAL: { label: "İptal", tone: "critical", Icon: CircleAlert },
}

function StatusSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  const [acik, setAcik] = useState(false)
  const [yon, setYon] = useState<"down" | "up">("down")
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = statusDetails[value] ?? { label: value.replaceAll("_", " "), tone: "neutral", Icon: CircleAlert }
  const SelectedIcon = selected.Icon

  const konumuBelirle = () => {
    const container = containerRef.current
    const menu = menuRef.current
    if (!container || !menu) return

    const containerRect = container.getBoundingClientRect()
    const menuHeight = menu.getBoundingClientRect().height
    const gap = 8
    const asagiBosluk = window.innerHeight - containerRect.bottom
    const yukariBosluk = containerRect.top
    setYon(asagiBosluk < menuHeight + gap && yukariBosluk >= menuHeight + gap ? "up" : "down")
  }

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setAcik(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  useEffect(() => {
    if (!acik) return
    const frame = window.requestAnimationFrame(konumuBelirle)
    window.addEventListener("resize", konumuBelirle)
    window.addEventListener("scroll", konumuBelirle, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", konumuBelirle)
      window.removeEventListener("scroll", konumuBelirle, true)
    }
  }, [acik, options.length])

  return <div className={`status-dropdown ${acik ? "open" : ""}`} ref={containerRef}>
    <button type="button" className={`status-trigger status-${selected.tone}`} onClick={() => setAcik((current) => !current)} aria-haspopup="listbox" aria-expanded={acik}>
      <span className="status-trigger-label"><SelectedIcon size={14} /><span>{selected.label}</span></span><ChevronDown size={14} className="status-chevron" />
    </button>
    {acik && <div ref={menuRef} className={`status-menu status-menu-${yon}`} role="listbox" aria-label="Durum seçenekleri">
      {options.map((option) => {
        const detail = statusDetails[option] ?? { label: option.replaceAll("_", " "), tone: "neutral", Icon: CircleAlert }
        const OptionIcon = detail.Icon
        return <button type="button" role="option" aria-selected={option === value} className={`status-option status-${detail.tone} ${option === value ? "selected" : ""}`} key={option} onClick={() => { onChange(option); setAcik(false) }}>
          <span className="status-trigger-label"><OptionIcon size={14} /><span>{detail.label}</span></span>{option === value && <Check size={14} />}
        </button>
      })}
    </div>}
  </div>
}

function DepoModal({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const [form, setForm] = useState({ ad: "", il: "", ilce: "", adres: "", enlem: "", boylam: "" })
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await api.depoOlustur({ ad: form.ad, il: form.il, ilce: form.ilce, adres: form.adres, enlem: form.enlem ? Number(form.enlem) : undefined, boylam: form.boylam ? Number(form.boylam) : undefined })
      await onDone()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Depo oluşturulamadı")
    } finally {
      setYukleniyor(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="movement-modal glass-card"><div className="modal-heading"><div><p className="eyebrow">ALTYAPI KAYDI</p><h2>Yeni depo ekle</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={17} /></button></div><form className="movement-form" onSubmit={submit}><label>Depo adı<input value={form.ad} onChange={(event) => update("ad", event.target.value)} required /></label><div className="form-two-columns"><label>İl<input value={form.il} onChange={(event) => update("il", event.target.value)} required /></label><label>İlçe<input value={form.ilce} onChange={(event) => update("ilce", event.target.value)} /></label></div><label>Adres<textarea value={form.adres} onChange={(event) => update("adres", event.target.value)} rows={2} /></label><div className="form-two-columns"><label>Enlem<input type="number" step="any" value={form.enlem} onChange={(event) => update("enlem", event.target.value)} /></label><label>Boylam<input type="number" step="any" value={form.boylam} onChange={(event) => update("boylam", event.target.value)} /></label></div>{hata && <div className="form-error">{hata}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button><button type="submit" className="primary-button" disabled={yukleniyor}>{yukleniyor ? "Kaydediliyor..." : "Depoyu kaydet"}</button></div></form></section></div>
}

function MalzemeModal({ kategoriler, onClose, onDone }: { kategoriler: Kategori[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [form, setForm] = useState({ ad: "", kategori_id: kategoriler[0]?.id ?? 0, birim: "Adet", kritik_stok_seviyesi: 5 })
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await api.malzemeOlustur(form)
      await onDone()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Malzeme oluşturulamadı")
    } finally {
      setYukleniyor(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="movement-modal glass-card"><div className="modal-heading"><div><p className="eyebrow">KATALOG KAYDI</p><h2>Yeni malzeme ekle</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={17} /></button></div><form className="movement-form" onSubmit={submit}><label>Malzeme adı<input value={form.ad} onChange={(event) => setForm((current) => ({ ...current, ad: event.target.value }))} required /></label><label>Kategori<select value={form.kategori_id} onChange={(event) => setForm((current) => ({ ...current, kategori_id: Number(event.target.value) }))}>{kategoriler.map((kategori) => <option value={kategori.id} key={kategori.id}>{kategori.ad}</option>)}</select></label><div className="form-two-columns"><label>Birim<input value={form.birim} onChange={(event) => setForm((current) => ({ ...current, birim: event.target.value }))} required /></label><label>Kritik stok seviyesi<input type="number" min="0" value={form.kritik_stok_seviyesi} onChange={(event) => setForm((current) => ({ ...current, kritik_stok_seviyesi: Number(event.target.value) }))} required /></label></div>{hata && <div className="form-error">{hata}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button><button type="submit" className="primary-button" disabled={yukleniyor || kategoriler.length === 0}>{yukleniyor ? "Kaydediliyor..." : "Malzemeyi kaydet"}</button></div></form></section></div>
}

function AracModal({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const [form, setForm] = useState({ plaka: "", arac_tipi: "KAMYON", kapasite_kg: "", surucu_adi: "", surucu_telefon: "" })
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await api.aracOlustur({
        plaka: form.plaka.trim().toUpperCase(),
        arac_tipi: form.arac_tipi,
        kapasite_kg: form.kapasite_kg ? Number(form.kapasite_kg) : undefined,
        surucu_adi: form.surucu_adi.trim() || undefined,
        surucu_telefon: form.surucu_telefon.trim() || undefined,
      })
      await onDone()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Araç oluşturulamadı")
    } finally {
      setYukleniyor(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="movement-modal glass-card"><div className="modal-heading"><div><p className="eyebrow">FİLO KAYDI</p><h2>Yeni araç ekle</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={17} /></button></div><form className="movement-form" onSubmit={submit}><div className="form-two-columns"><label>Plaka<input value={form.plaka} onChange={(event) => update("plaka", event.target.value)} placeholder="44 DEM 046" required /></label><label>Araç tipi<select value={form.arac_tipi} onChange={(event) => update("arac_tipi", event.target.value)}><option>TIR</option><option>KAMYON</option><option>VAN</option><option>PICKUP</option></select></label></div><div className="form-two-columns"><label>Kapasite (kg)<input type="number" min="1" value={form.kapasite_kg} onChange={(event) => update("kapasite_kg", event.target.value)} /></label><label>Sürücü adı<input value={form.surucu_adi} onChange={(event) => update("surucu_adi", event.target.value)} /></label></div><label>Sürücü telefonu<input type="tel" value={form.surucu_telefon} onChange={(event) => update("surucu_telefon", event.target.value)} placeholder="05xxxxxxxxx" /></label>{hata && <div className="form-error">{hata}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button><button type="submit" className="primary-button" disabled={yukleniyor}>{yukleniyor ? "Kaydediliyor..." : "Aracı kaydet"}</button></div></form></section></div>
}

function KullaniciModal({ roller, onClose, onDone }: { roller: Rol[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [form, setForm] = useState({ ad_soyad: "", eposta: "", sifre: "", rol_id: roller[0]?.id ?? 0 })
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await api.kullaniciOlustur({ ...form, ad_soyad: form.ad_soyad.trim(), eposta: form.eposta.trim().toLowerCase() })
      await onDone()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Kullanıcı oluşturulamadı")
    } finally {
      setYukleniyor(false)
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="movement-modal glass-card"><div className="modal-heading"><div><p className="eyebrow">ERİŞİM KAYDI</p><h2>Yeni kullanıcı ekle</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={17} /></button></div><form className="movement-form" onSubmit={submit}><label>Ad soyad<input value={form.ad_soyad} onChange={(event) => setForm((current) => ({ ...current, ad_soyad: event.target.value }))} required /></label><label>Eposta<input type="email" value={form.eposta} onChange={(event) => setForm((current) => ({ ...current, eposta: event.target.value }))} required /></label><div className="form-two-columns"><label>Geçici şifre<input type="password" minLength={6} value={form.sifre} onChange={(event) => setForm((current) => ({ ...current, sifre: event.target.value }))} required /></label><label>Rol<select value={form.rol_id} onChange={(event) => setForm((current) => ({ ...current, rol_id: Number(event.target.value) }))}>{roller.map((rol) => <option value={rol.id} key={rol.id}>{rol.ad}</option>)}</select></label></div>{hata && <div className="form-error">{hata}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button><button type="submit" className="primary-button" disabled={yukleniyor || roller.length === 0}>{yukleniyor ? "Kaydediliyor..." : "Kullanıcıyı kaydet"}</button></div></form></section></div>
}

function IhtiyacModal({ bolgeler, malzemeler, onClose, onDone }: { bolgeler: Bolge[]; malzemeler: Malzeme[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [bolgeId, setBolgeId] = useState(bolgeler[0]?.id ?? 0)
  const [malzemeId, setMalzemeId] = useState(malzemeler[0]?.id ?? 0)
  const [aciliyet, setAciliyet] = useState("KRITIK")
  const [miktar, setMiktar] = useState(1)
  const [aciklama, setAciklama] = useState("")
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await api.ihtiyacOlustur({ bolge_id: bolgeId, aciliyet, aciklama, kalemler: [{ malzeme_id: malzemeId, talep_edilen_miktar: Number(miktar) }] })
      await onDone()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Yardım talebi oluşturulamadı")
    } finally {
      setYukleniyor(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="movement-modal glass-card"><div className="modal-heading"><div><p className="eyebrow">OPERASYON KAYDI</p><h2>Yeni yardım talebi</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={17} /></button></div><form className="movement-form" onSubmit={submit}><label>Afet bölgesi<select value={bolgeId} onChange={(event) => setBolgeId(Number(event.target.value))}>{bolgeler.map((bolge) => <option value={bolge.id} key={bolge.id}>{bolge.ad}</option>)}</select></label><div className="form-two-columns"><label>Aciliyet<select value={aciliyet} onChange={(event) => setAciliyet(event.target.value)}><option value="KRITIK">Kritik</option><option value="YUKSEK">Yüksek</option><option value="ORTA">Orta</option><option value="DUSUK">Düşük</option></select></label><label>Miktar<input type="number" min="1" value={miktar} onChange={(event) => setMiktar(Number(event.target.value))} required /></label></div><label>Malzeme<select value={malzemeId} onChange={(event) => setMalzemeId(Number(event.target.value))}>{malzemeler.map((malzeme) => <option value={malzeme.id} key={malzeme.id}>{malzeme.ad}</option>)}</select></label><label>Açıklama<textarea value={aciklama} onChange={(event) => setAciklama(event.target.value)} rows={3} required /></label>{hata && <div className="form-error">{hata}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button><button type="submit" className="primary-button" disabled={yukleniyor || bolgeler.length === 0 || malzemeler.length === 0}>{yukleniyor ? "Kaydediliyor..." : "Talebi kaydet"}</button></div></form></section></div>
}

function SevkiyatModal({ ihtiyaclar, depolar, araclar, malzemeler, onClose, onDone }: { ihtiyaclar: Ihtiyac[]; depolar: Depo[]; araclar: Arac[]; malzemeler: Malzeme[]; onClose: () => void; onDone: () => Promise<void> }) {
  const [ihtiyacId, setIhtiyacId] = useState(ihtiyaclar[0]?.id ?? 0)
  const [depoId, setDepoId] = useState(depolar[0]?.id ?? 0)
  const [aracId, setAracId] = useState(araclar[0]?.id ?? 0)
  const [malzemeId, setMalzemeId] = useState(malzemeler[0]?.id ?? 0)
  const [miktar, setMiktar] = useState(1)
  const [aciklama, setAciklama] = useState("")
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setYukleniyor(true)
    setHata(null)
    try {
      await api.sevkiyatOlustur({ ihtiyac_id: ihtiyacId, kaynak_depo_id: depoId, arac_id: aracId || undefined, aciklama, kalemler: [{ malzeme_id: malzemeId, miktar: Number(miktar) }] })
      await onDone()
    } catch (error) {
      setHata(error instanceof Error ? error.message : "Sevkiyat oluşturulamadı")
    } finally {
      setYukleniyor(false)
    }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="movement-modal glass-card"><div className="modal-heading"><div><p className="eyebrow">DAĞITIM KAYDI</p><h2>Yeni sevkiyat</h2></div><button className="icon-button" onClick={onClose} aria-label="Pencereyi kapat"><X size={17} /></button></div><form className="movement-form" onSubmit={submit}><label>İhtiyaç talebi<select value={ihtiyacId} onChange={(event) => setIhtiyacId(Number(event.target.value))}>{ihtiyaclar.map((ihtiyac) => <option value={ihtiyac.id} key={ihtiyac.id}>#{ihtiyac.id} · {ihtiyac.bolgeler.ad}</option>)}</select></label><div className="form-two-columns"><label>Çıkış deposu<select value={depoId} onChange={(event) => setDepoId(Number(event.target.value))}>{depolar.map((depo) => <option value={depo.id} key={depo.id}>{depo.ad}</option>)}</select></label><label>Araç<select value={aracId} onChange={(event) => setAracId(Number(event.target.value))}><option value={0}>Araç atama</option>{araclar.map((arac) => <option value={arac.id} key={arac.id}>{arac.plaka} · {arac.arac_tipi}</option>)}</select></label></div><div className="form-two-columns"><label>Malzeme<select value={malzemeId} onChange={(event) => setMalzemeId(Number(event.target.value))}>{malzemeler.map((malzeme) => <option value={malzeme.id} key={malzeme.id}>{malzeme.ad}</option>)}</select></label><label>Miktar<input type="number" min="1" value={miktar} onChange={(event) => setMiktar(Number(event.target.value))} required /></label></div><label>Açıklama<textarea value={aciklama} onChange={(event) => setAciklama(event.target.value)} rows={3} required /></label>{hata && <div className="form-error">{hata}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Vazgeç</button><button type="submit" className="primary-button" disabled={yukleniyor || ihtiyaclar.length === 0 || depolar.length === 0 || malzemeler.length === 0}>{yukleniyor ? "Kaydediliyor..." : "Sevkiyatı oluştur"}</button></div></form></section></div>
}

function DataPage({ title, kicker, description, actionLabel, onAction, children }: { title: string; kicker: string; description: string; actionLabel?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="data-page"><div className="page-heading"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1><p className="hero-copy">{description}</p></div>{actionLabel && onAction ? <button className="primary-button" onClick={onAction}>+ {actionLabel}</button> : <button className="secondary-button"><RefreshCw size={15} /> Yenile</button>}</div><article className="glass-card data-card">{children}</article></section> }
function Empty({ text }: { text: string }) { return <div className="empty-state"><ClipboardList size={22} /><span>{text}</span></div> }

export default App
