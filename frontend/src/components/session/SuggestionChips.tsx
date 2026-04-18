"use client";

import { useEffect, useState } from "react";

interface SuggestionChipsProps {
  chips: string[];
  visible: boolean;
  onSelect: (chip: string) => void;
}

export function SuggestionChips({ chips, visible, onSelect }: SuggestionChipsProps) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setRendered(true), 20);
      return () => clearTimeout(t);
    } else {
      setRendered(false);
    }
  }, [visible]);

  if (!visible && !rendered) return null;

  return (
    <div className="flex flex-row items-center justify-center gap-2 px-4">
      {chips.map((chip, i) => (
        <div key={i} className="group relative flex items-center w-48">
          <button
            className="w-full font-manrope text-sm px-4 py-2 rounded-2xl text-center text-on-surface border border-white/50 hover:bg-white/80"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              opacity: rendered && visible ? 1 : 0,
              transform: rendered && visible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
              transitionDelay: rendered && visible ? `${0.7 + i * 1.2}s` : "0s",
            }}
          >
            {chip}
          </button>

          {/* Side tooltip bubble — shown on hover */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 bg-surface-lowest border border-outline-variant/30 rounded-2xl px-3 py-1.5 shadow-ambient-sm whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={i === 0 ? { right: "calc(100% + 10px)" } : { left: "calc(100% + 10px)" }}
          >
            <span
              className="absolute top-1/2 -translate-y-1/2 w-0 h-0"
              style={i === 0 ? {
                right: -6,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: "6px solid var(--color-outline-variant, #ccc)",
              } : {
                left: -6,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderRight: "6px solid var(--color-outline-variant, #ccc)",
              }}
            />
            <p className="font-manrope text-xs text-on-surface-variant">
              Try saying this! 🎤
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
