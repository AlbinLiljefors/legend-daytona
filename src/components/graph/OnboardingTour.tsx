import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

type ZoomLevel = "context" | "system" | "module" | "file";

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onZoomChange?: (level: ZoomLevel) => void;
}

interface Step {
  title: string;
  description: string;
  zoomLevel?: ZoomLevel;
  badge?: string;
}

const steps: Step[] = [
  {
    title: "Welcome to your atlas",
    description:
      "This is Daytona's codebase, auto-mapped from source code. Every card is a component. Lines show real dependencies extracted from the code.",
  },
  {
    title: "Context Level",
    description:
      "The 30,000ft view — actors, external services, and how they interact with Daytona.",
    zoomLevel: "context",
  },
  {
    title: "System Level",
    description:
      "Deployment units — the Go API server, Docker engine, CLI, workspace orchestration. How Daytona is actually shipped.",
    zoomLevel: "system",
  },
  {
    title: "Module Level",
    description:
      "Logical modules within each system. This is where the real architecture lives — drill into any system to see its internals.",
    zoomLevel: "module",
  },
  {
    title: "File Level",
    description:
      "Double-click any module to see its actual files and dependency weights between directories.",
  },
  {
    title: "Make it yours",
    description:
      "This map is AI-generated — it's a starting point, not the final word. Click any node's name or description to edit it inline. Fix labels, rewrite descriptions, add context only you know.",
    badge: "Key Feature",
  },
  {
    title: "Add & connect",
    description:
      "Missing a component? Click the + button to create new nodes. Drag between node handles to draw dependency lines. Right-click any node or edge to remove it.",
    badge: "Key Feature",
  },
  {
    title: "Your edits persist",
    description:
      "Every change you make — renames, new nodes, repositioned cards, deleted edges — is saved automatically in your browser. Come back anytime and pick up where you left off.",
    badge: "Key Feature",
  },
  {
    title: "Help us improve",
    description:
      "We're testing whether developers find enough value in manually refining these maps to make them accurate. Your edits help us understand what matters. Don't hold back — reshape this atlas until it matches your understanding of the codebase.",
  },
];

export function OnboardingTour({ isOpen, onClose, onZoomChange }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      const nextStep = steps[step + 1];
      if (nextStep.zoomLevel && onZoomChange) {
        onZoomChange(nextStep.zoomLevel);
      }
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
          />

          {/* Tooltip — always centered */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 w-96 bg-card rounded-xl shadow-2xl border p-6"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">
                  Step {step + 1} of {steps.length}
                </span>
                {currentStep.badge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {currentStep.badge === "Key Feature" ? (
                      <Pencil className="w-3 h-3" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {currentStep.badge}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              <Button onClick={handleNext} size="sm">
                {isLastStep ? "Start exploring" : "Next"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
