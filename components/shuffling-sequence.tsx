"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useShoe } from "@/contexts/shoe-context"
import { Volume2, VolumeX, FastForward } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShufflingSequenceProps {
  numDecks: number
  onComplete: () => void
  isVisible: boolean
}

type ShufflePhase = "intro" | "unbox" | "combine" | "wash" | "riffle1" | "strip" | "final" | "load-shoe" | "complete"

const phaseDescriptions: Record<ShufflePhase, string> = {
  intro: "Preparing new shoe...",
  unbox: "Opening fresh decks...",
  combine: "Combining decks...",
  wash: "Washing the cards...",
  riffle1: "Riffle shuffle...",
  strip: "Strip shuffle...",
  final: "Squaring up...",
  "load-shoe": "Loading the shoe...",
  complete: "Ready to cut!",
}

const phaseDurations: Record<ShufflePhase, number> = {
  intro: 800,
  unbox: 1200,
  combine: 1200,
  wash: 2000,
  riffle1: 1200,
  strip: 1200,
  final: 800,
  "load-shoe": 1200,
  complete: 500,
}

export function ShufflingSequence({ numDecks, onComplete, isVisible }: ShufflingSequenceProps) {
  const { startNewShoe, skipAnimations, setSkipAnimations } = useShoe()
  const [phase, setPhase] = useState<ShufflePhase>("intro")
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [progress, setProgress] = useState(0)

  // Phase sequence
  const phases: ShufflePhase[] = [
    "intro",
    "unbox",
    "combine",
    "wash",
    "riffle1",
    "strip",
    "final",
    "load-shoe",
    "complete",
  ]

  // Progress through phases
  useEffect(() => {
    if (!isVisible) return

    // Start the shuffle when sequence becomes visible
    startNewShoe(numDecks)

    if (skipAnimations) {
      setPhase("complete")
      setTimeout(onComplete, 300)
      return
    }

    let currentIndex = 0
    const advancePhase = () => {
      if (currentIndex < phases.length - 1) {
        currentIndex++
        setPhase(phases[currentIndex])
        setProgress((currentIndex / (phases.length - 1)) * 100)

        if (phases[currentIndex] === "complete") {
          setTimeout(onComplete, 500)
        } else {
          setTimeout(advancePhase, phaseDurations[phases[currentIndex]])
        }
      }
    }

    const timer = setTimeout(advancePhase, phaseDurations["intro"])
    return () => clearTimeout(timer)
  }, [isVisible, numDecks, onComplete, skipAnimations, startNewShoe])

  const handleSkip = useCallback(() => {
    setPhase("complete")
    onComplete()
  }, [onComplete])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900"
      >
        {/* Header controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-white/60 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-white/60 hover:text-white">
            <FastForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </div>

        {/* Title */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-white mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Shuffling {numDecks}-Deck Shoe
        </motion.h1>

        {/* Animation container */}
        <div className="relative w-80 h-64 md:w-96 md:h-80 mb-8">
          {/* Deck boxes phase */}
          {phase === "unbox" && (
            <motion.div className="absolute inset-0 flex items-center justify-center gap-2">
              {Array.from({ length: Math.min(numDecks, 8) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -50, opacity: 0, scale: 0.8 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="w-10 h-14 md:w-12 md:h-16 bg-gradient-to-br from-red-700 to-red-900 rounded shadow-lg border border-red-600"
                >
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {i + 1}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Combining phase */}
          {phase === "combine" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: Math.min(numDecks, 8) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: (i - numDecks / 2) * 50,
                    y: 0,
                    rotate: (i - numDecks / 2) * 5,
                  }}
                  animate={{
                    x: 0,
                    y: i * -2,
                    rotate: 0,
                  }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="absolute w-20 h-28 md:w-24 md:h-32 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-xl"
                  style={{ zIndex: i }}
                >
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                      <span className="text-white/50 text-2xl md:text-3xl font-serif">&#9824;</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Washing phase - cards spread on table */}
          {phase === "wash" && (
            <motion.div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                  }}
                  animate={{
                    x: Math.cos(i * 0.5) * (80 + Math.random() * 60),
                    y: Math.sin(i * 0.7) * (50 + Math.random() * 40),
                    rotate: Math.random() * 360,
                    scale: 0.8,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 1,
                    repeatType: "reverse",
                    delay: i * 0.02,
                  }}
                  className="absolute w-8 h-11 md:w-10 md:h-14 bg-gradient-to-br from-blue-800 to-blue-900 rounded shadow-md"
                >
                  <div className="absolute inset-0.5 border border-white/20 rounded" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Riffle shuffle phases */}
          {phase === "riffle1" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              {/* Left half */}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: [-40, 0], rotateZ: [5, 0] }}
                transition={{ duration: 0.8, repeat: 1, repeatType: "reverse" }}
                className="absolute w-20 h-32 md:w-24 md:h-40 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-xl"
                style={{ left: "30%" }}
              >
                <div className="absolute inset-1 border-2 border-white/20 rounded" />
                {/* Riffle lines */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0 }}
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 0.3, delay: i * 0.05, repeat: 2 }}
                    className="absolute right-0 w-full h-1 bg-white/10"
                    style={{ top: `${12 + i * 10}%` }}
                  />
                ))}
              </motion.div>
              {/* Right half */}
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: [40, 0], rotateZ: [-5, 0] }}
                transition={{ duration: 0.8, repeat: 1, repeatType: "reverse" }}
                className="absolute w-20 h-32 md:w-24 md:h-40 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-xl"
                style={{ right: "30%" }}
              >
                <div className="absolute inset-1 border-2 border-white/20 rounded" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0 }}
                    animate={{ x: [0, -10, 0] }}
                    transition={{ duration: 0.3, delay: i * 0.05, repeat: 2 }}
                    className="absolute left-0 w-full h-1 bg-white/10"
                    style={{ top: `${12 + i * 10}%` }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Strip shuffle phase */}
          {phase === "strip" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 0, x: 0 }}
                  animate={{
                    y: [0, -30, 0],
                    x: [0, (i - 2.5) * 20, 0],
                  }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                  className="absolute w-20 h-8 md:w-24 md:h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded shadow-lg"
                  style={{ zIndex: 6 - i }}
                >
                  <div className="absolute inset-0.5 border border-white/20 rounded" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Final squaring up */}
          {phase === "final" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 1.1, rotate: 2 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-24 h-36 md:w-28 md:h-44 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-2xl"
              >
                <div className="absolute inset-1 border-2 border-white/20 rounded-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white/50 text-4xl font-serif">&#9824;</div>
                    <div className="text-white/40 text-xs mt-1">{numDecks * 52} cards</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Loading into shoe */}
          {phase === "load-shoe" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              {/* The shoe */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-8 w-32 h-24 md:w-40 md:h-28"
              >
                {/* Shoe body */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900 to-amber-800 rounded-lg shadow-xl transform perspective-500 rotateY-10">
                  <div className="absolute left-0 top-2 bottom-2 w-4 bg-amber-950/50 rounded-l" />
                  <div className="absolute right-2 top-4 bottom-4 w-1 bg-amber-950/30" />
                  <div className="absolute top-1 left-6 right-4 h-2 bg-amber-950/20 rounded" />
                </div>
                <div className="absolute -top-1 left-4 right-2 h-3 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t" />
              </motion.div>

              {/* Cards sliding into shoe */}
              <motion.div
                initial={{ x: -50 }}
                animate={{ x: 30 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute w-24 h-36 md:w-28 md:h-44 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-xl"
              >
                <div className="absolute inset-1 border-2 border-white/20 rounded-lg" />
              </motion.div>
            </motion.div>
          )}

          {/* Complete - ready state */}
          {phase === "complete" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="relative">
                {/* Loaded shoe */}
                <motion.div
                  className="w-40 h-28 md:w-48 md:h-32 bg-gradient-to-r from-amber-900 to-amber-800 rounded-lg shadow-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(251,191,36,0.2)",
                      "0 0 40px rgba(251,191,36,0.4)",
                      "0 0 20px rgba(251,191,36,0.2)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <div className="absolute left-0 top-2 bottom-2 w-6 bg-amber-950/50 rounded-l flex items-center justify-center">
                    <div className="w-4 h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded" />
                  </div>
                  <div className="absolute right-3 top-4 bottom-4 w-1 bg-amber-950/30" />
                  <div className="absolute top-2 left-8 text-amber-200/60 text-xs">{numDecks * 52} cards loaded</div>
                </motion.div>

                {/* Sparkle effect */}
                <motion.div
                  className="absolute -inset-4 border-2 border-amber-400/30 rounded-xl"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>
            </motion.div>
          )}

          {/* Intro - casino table background */}
          {phase === "intro" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                className="w-16 h-16 border-4 border-amber-400/30 border-t-amber-400 rounded-full"
              />
            </motion.div>
          )}
        </div>

        {/* Phase description */}
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl text-amber-200/80 mb-6"
        >
          {phaseDescriptions[phase]}
        </motion.p>

        {/* Progress bar */}
        <div className="w-64 md:w-80 h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Skip animations toggle */}
        <div className="absolute bottom-4 left-4">
          <label className="flex items-center gap-2 text-white/50 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={skipAnimations}
              onChange={(e) => setSkipAnimations(e.target.checked)}
              className="rounded border-white/30"
            />
            Skip animations in future
          </label>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
