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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadScannerScript()
      .then(() => {
        if (cancelled) return
        const Html5Qrcode = window.Html5Qrcode
        const scanner = new Html5Qrcode(elementId)
        scannerRef.current = scanner
        setLoading(false)
        scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decodedText: string) => {
            if (!cancelled) onScan(decodedText.trim())
          },
          () => { /* skanerlanmagan freymlar — e'tiborsiz qoldiramiz */ }
        ).catch((err: any) => {
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

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
    <div className="w-full max-w-sm rounded-xl bg-card p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">Shtrix kodni skanerlang</h3>
        <button onClick={onClose}><X className="size-5" /></button>
      </div>
      {loading && <p className="mb-2 text-xs text-muted-foreground">Kamera yuklanmoqda...</p>}
      {error
        ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        : <div id={elementId} className="overflow-hidden rounded-lg bg-black" />}
      <p className="mt-3 text-center text-xs text-muted-foreground">Kodni kameraga aniq tuting. Ishlamasa, pastdagi maydonga qo‘lda kiriting.</p>
    </div>
  </div>
}
