import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Play, Pause } from 'lucide-react'

const BAR_HEIGHTS = [8, 18, 12, 26, 14, 30, 10, 22, 16, 28, 12, 20, 9, 24, 15, 27, 11, 19, 13, 25]

export default function RecordingModal({ open, onClose, callerName }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!open) {
      setPlaying(false)
      setProgress(0)
    }
  }, [open])

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setPlaying(false)
          return 100
        }
        return p + 1
      })
    }, 90)
    return () => clearInterval(interval)
  }, [playing])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-abyss-900 border border-white/10 clip-facet p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-mist-400 hover:text-mist-200"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <p className="text-xs text-mist-400">Call recording</p>
            <h3 className="text-sm font-semibold text-mist-100 mt-1">{callerName}</h3>

            {/* waveform */}
            <div className="mt-6 flex items-end gap-1 h-16">
              {BAR_HEIGHTS.map((h, i) => {
                const barProgress = (i / BAR_HEIGHTS.length) * 100
                const isPast = barProgress <= progress
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-colors ${
                      isPast ? 'bg-signal-400' : 'bg-white/10'
                    }`}
                    style={{ height: `${h}px` }}
                  />
                )
              })}
            </div>

            <div className="mt-5 flex items-center gap-4">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="w-10 h-10 flex items-center justify-center bg-signal-500/15 text-signal-400 clip-shield hover:bg-signal-500/25 transition-colors shrink-0"
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-signal-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-mist-400 text-center">
              This is a placeholder player — connect a real recording URL once the backend is live.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
