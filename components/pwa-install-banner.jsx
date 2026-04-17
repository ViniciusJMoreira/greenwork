"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Download } from "lucide-react"

const STORAGE_KEY = "pwa-banner-dismissed"

export function PwaInstallBanner() {
  const [show, setShow]               = useState(false)
  const [isIos, setIsIos]             = useState(false)
  const [deferredPrompt, setDeferred] = useState(null)

  useEffect(() => {
    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    if (isStandalone) return
    if (localStorage.getItem(STORAGE_KEY)) return

    const ua  = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)

    if (ios) {
      setIsIos(true)
      setShow(true)
      return
    }

    function handler(e) {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1")
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") localStorage.setItem(STORAGE_KEY, "1")
    setShow(false)
    setDeferred(null)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border p-4 shadow-2xl md:left-auto md:right-6 md:w-80 md:bottom-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192.png" alt="COOP134" className="w-9 h-9 rounded-xl" />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Installa COOP134
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Aggiungila alla schermata Home
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="p-1 rounded-lg transition-colors"
              style={{ color: "var(--text-faint)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* iOS — istruzioni manuali */}
          {isIos && (
            <div
              className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 mb-3"
              style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
            >
              <span className="shrink-0 mt-0.5">1.</span>
              <span>
                Tocca il tasto{" "}
                <span className="font-semibold" style={{ color: "var(--text)" }}>
                  Condividi
                </span>{" "}
                <ShareIcon />{" "}
                in basso in Safari
              </span>
            </div>
          )}
          {isIos && (
            <div
              className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2 mb-3"
              style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
            >
              <span className="shrink-0 mt-0.5">2.</span>
              <span>
                Scorri e tocca{" "}
                <span className="font-semibold" style={{ color: "var(--text)" }}>
                  "Aggiungi a schermata Home"
                </span>{" "}
                <PlusBoxIcon />
              </span>
            </div>
          )}

          {/* Android — bottone diretto */}
          {!isIos && (
            <button
              type="button"
              onClick={install}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity active:opacity-80"
              style={{ background: "var(--primary)" }}
            >
              <Download className="w-4 h-4" />
              Installa app
            </button>
          )}

          {/* Dismiss link */}
          <button
            type="button"
            onClick={dismiss}
            className="w-full mt-2 text-xs text-center transition-colors"
            style={{ color: "var(--text-faint)" }}
          >
            Non ora
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ShareIcon() {
  return (
    <svg
      className="inline-block align-middle mb-0.5"
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

function PlusBoxIcon() {
  return (
    <svg
      className="inline-block align-middle mb-0.5"
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}
