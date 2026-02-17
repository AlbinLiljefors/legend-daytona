import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "./HeroBackground";

export function LandingPage() {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate("/signin");
  };

  return (
    <div className="relative bg-background h-screen overflow-hidden">
      {/* Fixed header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Legend</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExplore}
          className="text-muted-foreground hover:text-foreground"
        >
          Sign in
        </Button>
      </motion.header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <HeroBackground />

        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Daytona codebase — fully mapped</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]"
          >
            Explore Daytona's architecture,
            <br />
            <span className="text-primary">visually</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Interactive architecture diagrams. Go, TypeScript, Python — from system level to individual files.
          </motion.p>

          {/* Single CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={handleExplore}
              className="gap-2.5 text-base px-8 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Explore the map
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary/50" />
            </div>
            <span>Legend</span>
          </div>
          <p>© 2025 Legend</p>
        </div>
      </footer>
    </div>
  );
}
