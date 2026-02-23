import { motion } from "framer-motion";

const backgrounds = [
  { name: "Stanford University" },
  { name: "Microsoft" },
  { name: "Riksbanken" },
  { name: "Vanguard" },
  { name: "Stanford AI Lab" },
];

export function TrustSection() {
  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60 mb-5">
        Built by a team from
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {backgrounds.map((org, i) => (
          <motion.span
            key={org.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 + i * 0.08 }}
            className="text-sm font-medium text-muted-foreground/70 whitespace-nowrap"
          >
            {org.name}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
