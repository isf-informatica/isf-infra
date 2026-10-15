import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function VideoModal({ open, onClose, videoUrl }) {
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
            className="relative w-full max-w-3xl aspect-video bg-abyss-900 clip-facet overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center bg-black/50 text-white clip-shield"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-mist-400 text-sm px-8 text-center">
                Add your product demo video URL to VideoModal's videoUrl prop
                (e.g. an uploaded .mp4 in /public/videos, or a hosted link).
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
