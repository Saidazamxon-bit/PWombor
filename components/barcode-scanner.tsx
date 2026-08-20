'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

declare global {
  interface Window { Html5Qrcode?: any }
}

const SCRIPT_URL = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
let scriptLoadPromise: Promise<void> | null = null

function loadScannerScript(): Promise<void> {
  if (window.Html5Qrcode) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Skaner kutubxonasini yuklab bo‘lmadi. Internet aloqasini tekshiring.'))
    document.body.appendChild(script)
  })
  return scriptLoadPromise
}

// Kichik tugma: bosilganda kamera skaneri ochiladi, kod topilganda onScan(code) chaqiriladi
export function BarcodeScanButton({ onScan }: { onScan: (code: string) => void }) {
  const [open, setOpen] = useState(false)
  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted">
      <Camera className="size-4" />Kamera
    </button>
    {open && <ScannerModal onClose={() => setOpen(false)} onScan={(code) => { setOpen(false); onScan(code) }} />}
  </>
}

function ScannerModal({ onClose, onScan }: { onClose: () => void; onScan: (code: string) => void }) {
  const elementId = useRef(`pw-scanner-${Math.random().toString(36).slice(2)}`).current
  const scannerRef = useRef<any>(null)
  const zoomFeatureRef = useRef<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [canZoom, setCanZoom] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadScannerScript()
      .then(() => {
        if (cancelled) return
        const Html5Qrcode = window.Html5Qrcode
        const scanner = new Html5Qrcode(elementId)
        scannerRef.current = scanner
        setLoading(false)
        const startScanner = async () => {
          let cameraId: string | undefined
          try {
            const cameras = await Html5Qrcode.getCameras()
            cameraId = cameras.find((camera: { id: string; label: string }) => {
              const label = (camera.label || '').toLowerCase()
              return (label.includes('back') || label.includes('orqa')) && !label.includes('ultra') && !label.includes('0.5')
            })?.id
          } catch {}

          const startConfig = { fps: 10, qrbox: { width: 260, height: 160 } }
          const startTarget = cameraId || { facingMode: 'environment' }
          await scanner.start(
            startTarget,
            startConfig,
            (decodedText: string) => {
              if (!cancelled) onScan(decodedText.trim())
            },
            () => { /* skanerlanmagan freymlar — e'tiborsiz qoldiramiz */ }
          )

          try {
            const capabilities = await Promise.resolve(scanner.getRunningTrackCameraCapabilities?.())
            const zoomFeature = typeof capabilities?.zoomFeature === 'function' ? capabilities.zoomFeature() : capabilities?.zoomFeature
            const minZoom = typeof zoomFeature?.min === 'function' ? zoomFeature.min() : zoomFeature?.min
            const maxZoom = typeof zoomFeature?.max === 'function' ? zoomFeature.max() : zoomFeature?.max
            if (zoomFeature && Number(minZoom) <= 1 && Number(maxZoom) >= 1) {
              zoomFeatureRef.current = zoomFeature
              setCanZoom(true)
              if (typeof zoomFeature.apply === 'function') await zoomFeature.apply(1)
              else await scanner.applyVideoConstraints?.({ advanced: [{ zoom: 1 }] })
            }
          } catch {}
        }

        startScanner().catch((err: any) => {
          if (!cancelled) setError('Kamerani ochib bo‘lmadi: ' + (err?.message || err) + '. Brauzer kamera ruxsatini tekshiring.')
        })
      })
      .catch((err) => setError(err.message))

    return () => {
      cancelled = true
      if (scannerRef.current) {
        scannerRef.current.stop?.().then(() => scannerRef.current.clear?.()).catch(() => {})
      }
    }
  }, [])

  const resetZoom = () => {
    try {
      const zoomFeature = zoomFeatureRef.current
      const result = typeof zoomFeature?.apply === 'function'
        ? zoomFeature.apply(1)
        : scannerRef.current?.applyVideoConstraints?.({ advanced: [{ zoom: 1 }] })
      Promise.resolve(result).catch(() => {})
    } catch {}
  }

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className="w-full max-w-sm rounded-xl bg-card p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">Shtrix kodni skanerlang</h3>
        <button onClick={onClose}><X className="size-5" /></button>
      </div>
      {loading && <p className="mb-2 text-xs text-muted-foreground">Kamera yuklanmoqda...</p>}
      {error
        ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        : <div className="relative"><div id={elementId} className="overflow-hidden rounded-lg bg-black" />{canZoom && <button type="button" onClick={resetZoom} className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-black/80">1x</button>}</div>}
      <p className="mt-3 text-center text-xs text-muted-foreground">Kodni kameraga aniq tuting. Ishlamasa, pastdagi maydonga qo‘lda kiriting.</p>
    </div>
  </div>
}
