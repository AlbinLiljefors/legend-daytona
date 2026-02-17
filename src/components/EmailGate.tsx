import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMAIL_KEY = "legend-user-email";
const NAME_KEY = "legend-user-name";

declare global {
  interface Window {
    posthog?: {
      identify: (id: string, properties?: Record<string, unknown>) => void;
    };
  }
}

function identifyUser(email: string, name: string) {
  window.posthog?.identify(email, { email, name });
}

export function getStoredUser(): { email: string; name: string } | null {
  const email = localStorage.getItem(EMAIL_KEY);
  const name = localStorage.getItem(NAME_KEY);
  if (email && name) return { email, name };
  return null;
}

export function clearStoredUser() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(NAME_KEY);
}

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      identifyUser(user.email, user.name);
      navigate("/loading/daytona", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const trimmedEmail = email.trim().toLowerCase() || `${trimmedName.replace(/\s+/g, ".")}@anonymous`;
    localStorage.setItem(EMAIL_KEY, trimmedEmail);
    localStorage.setItem(NAME_KEY, trimmedName);
    identifyUser(trimmedEmail, trimmedName);
    navigate("/loading/daytona");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground font-['Space_Grotesk'] mb-2">
            Welcome to Legend
          </h1>
          <p className="text-muted-foreground">
            Sign in to explore the Daytona architecture
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <Button type="submit" className="w-full py-3 gap-2">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Your info is only used to personalize your exploration session.
        </p>
      </motion.div>
    </div>
  );
}
