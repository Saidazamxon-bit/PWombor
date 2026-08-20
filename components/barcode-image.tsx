'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window { JsBarcode?: any }
}

const SCRIPT_URL = 'https://unpkg.com/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'
let scriptLoadPromise: Promise<void> | null = null

function loadJsBarcode(): Promise<void> {
  if (window.JsBarcode) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Shtrix kod kutubxonasini yuklab bo‘lmadi.'))
    document.body.appendChild(script)
  })
  return scriptLoadPromise
}

// Berilgan kod uchun bosib chiqarish mumkin bo'lgan shtrix kod (Code128) chizadi
export function BarcodeImage({ value, className = '' }: { value: string; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let cancelled = false
    loadJsBarcode().then(() => {
      if (cancelled || !svgRef.current) return
      try {
        window.JsBarcode(svgRef.current, value, { format: 'CODE128', width: 2, height: 50, displayValue: true, fontSize: 14, margin: 6 })
      } catch { /* noto'g'ri qiymat bo'lsa jim o'tkazamiz */ }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [value])

  return <svg ref={svgRef} className={className} />
}

// Shtrix kod + mahsulot ID va nomini bitta PNG rasm qilib, kompyuterga yuklab beradi
export async function downloadBarcodeLabel(product: { barcode: string; productId: string; name: string }) {
  if (!product.barcode) return
  await loadJsBarcode()

  const barcodeCanvas = document.createElement('canvas')
  window.JsBarcode(barcodeCanvas, product.barcode, { format: 'CODE128', width: 3, height: 70, displayValue: true, fontSize: 18, margin: 10 })

  const headerHeight = 34
  const composed = document.createElement('canvas')
  composed.width = Math.max(barcodeCanvas.width, 260)
  composed.height = barcodeCanvas.height + headerHeight

  const ctx = composed.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, composed.width, composed.height)
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  ctx.font = 'bold 15px sans-serif'
  ctx.fillText(`ID: ${product.productId}  •  ${product.name}`, composed.width / 2, 22)
  ctx.drawImage(barcodeCanvas, (composed.width - barcodeCanvas.width) / 2, headerHeight)

  const url = composed.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = `mahsulot-ID${product.productId}-${product.barcode}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
