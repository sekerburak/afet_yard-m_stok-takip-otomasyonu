import { useEffect, useState } from "react"

type Saglik = { durum: string; mesaj: string }

function App() {
  const [saglik, setSaglik] = useState<Saglik | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:3000/api/saglik")
      .then((yanit) => yanit.json())
      .then((veri: Saglik) => setSaglik(veri))
      .catch(() => setHata("Backend'e ulaşılamadı"))
  }, [])

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Afet Yardım Depoları Yönetim Sistemi</h1>
      <p>Stok, sevkiyat ve ihtiyaç yönetimi prototipi</p>

      {saglik && (
        <p>
          Backend durumu: {saglik.durum} - {saglik.mesaj}
        </p>
      )}
      {hata && <p>{hata}</p>}
    </div>
  )
}

export default App