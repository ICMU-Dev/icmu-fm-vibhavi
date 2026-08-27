"use client";;
// beui.dev/components/motion/drawer

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { EASE_OUT, SPRING_PANEL } from "@/lib/ease";
import { PresenceGate } from "@/lib/presence-gate";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
  backdropClassName,
  ariaLabel,
  dismissable = true
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange]);

  const offscreen = side === "right" ? "100%" : "-100%";

  // Two fixed siblings, no wrapper: the backdrop spans the viewport edges but
  // paints the scrim, and the panel is inset off one side and paints its own
  // surface, so neither is a transparent edge-spanning layer. Both hang off
  // `PresenceGate`, so interaction releases in the same commit that starts the
  // exit rather than when it ends. See tests/fixed-overlay-edge-sampling.test.tsx.
  return (
    <AnimatePresence>
      {open ? (
        <PresenceGate key="backdrop">
          {({ gate }) => (
            <motion.button
              type="button"
              aria-label="Close"
              tabIndex={dismissable ? 0 : -1}
              onClick={() => dismissable && onOpenChange(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              {...gate}
              className={cn(
                "fixed inset-0 z-50 h-full w-full cursor-default bg-black/40",
                backdropClassName
              )} />
          )}
        </PresenceGate>
      ) : null}
      {open ? (
        <PresenceGate key="panel">
          {({ gate }) => (
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              initial={reduce ? { opacity: 0 } : side === "bottom" ? { y: "100%" } : { x: offscreen }}
              animate={reduce ? { opacity: 1 } : side === "bottom" ? { y: 0 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : side === "bottom" ? { y: "100%" } : { x: offscreen }}
              transition={
                reduce ? { duration: 0.2, ease: EASE_OUT } : SPRING_PANEL
              }
              {...gate}
              className={cn(
                "fixed z-50 flex bg-background max-w-2xl mx-auto",
                side === "bottom"
                  ? "inset-x-0 bottom-0 w-full h-auto flex-col rounded-t-4xl border-t border-border shadow-2xl pb-safe"
                  : side === "right"
                    ? "inset-y-0 right-0 w-80 max-w-[85vw] flex-col border-l border-border shadow-ultimate"
                    : "inset-y-0 left-0 w-80 max-w-[85vw] flex-col border-r border-border shadow-ultimate",
                className
              )}>
              {children}
            </motion.aside>
          )}
        </PresenceGate>
      ) : null}
    </AnimatePresence>
  );
}
