import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Layers, GripVertical, Plus, Cable, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "./HeroBackground";

export function LandingPage() {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate("/repos");
  };

  return (
    <div className="relative bg-background min-h-screen">
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
              <span className="text-sm font-medium text-muted-foreground">Understand code in seconds, not hours</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]"
          >
            Navigate any codebase
            <br />
            <span className="text-primary">like you wrote it</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Auto-generate interactive architecture diagrams. See dependencies,
            data flows, and how everything connects — instantly.
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

      {/* Features section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-center mb-12 text-foreground"
          >
            Built for exploration
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: GripVertical,
                title: "Drag to rearrange",
                description: "Move nodes to match your mental model of the architecture.",
              },
              {
                icon: Plus,
                title: "Add components",
                description: "Create custom nodes directly on the graph with the + button.",
              },
              {
                icon: Cable,
                title: "Draw connections",
                description: "Connect nodes by dragging between their handles.",
              },
              {
                icon: Search,
                title: "Four zoom levels",
                description: "Context → System → Module → File. Drill down to any depth.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-xl border bg-card p-6 space-y-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary/50" />
            </div>
            <span>Legend</span>
          </div>
          <p>&copy; 2025 Legend</p>
        </div>
      </footer>
    </div>
  );
}
