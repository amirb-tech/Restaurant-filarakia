"use client";

interface SplitRevealProps {
  text: string;
  progress: number;
  stagger?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}

/** Word-by-word masked reveal, driven directly by scroll progress (no CSS transitions). */
export function SplitReveal({
  text,
  progress,
  stagger = 0.09,
  className,
  as = "h2",
}: SplitRevealProps) {
  const words = text.split(" ");
  const n = words.length;
  const span = Math.max(1 - (n - 1) * stagger, 0.2);
  const Tag = as;

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => {
        const start = i * stagger;
        const wordT = Math.min(Math.max((progress - start) / span, 0), 1);
        const eased = 1 - Math.pow(1 - wordT, 3);
        return (
          <span className="split-mask" key={i}>
            <span
              className="split-word"
              style={{
                transform: `translateY(${(1 - eased) * 100}%)`,
                opacity: eased,
              }}
            >
              {word}
              {i < n - 1 ? " " : ""}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
