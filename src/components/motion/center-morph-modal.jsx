import React from 'react';
"use client";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { EASE_OUT } from "@/lib/ease";
import { PresenceGate } from "@/lib/presence-gate";
import { cn } from "@/lib/utils";
const CenterMorphModalContext = createContext(null);
function useCenterMorphModalContext(component) {
  const context = useContext(CenterMorphModalContext);
  if (!context) {
    throw new Error(`${component} must be used within <CenterMorphModal>`);
  }
  return context;
}
function CenterMorphModal({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange
}) {
  const id = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = controlledOpen !== void 0;
  const open = controlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (next) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );
  const value = useMemo(
    () => ({
      open,
      setOpen,
      triggerId: `${id}-trigger`,
      contentId: `${id}-content`
    }),
    [id, open, setOpen]
  );
  return /* @__PURE__ */ React.createElement(CenterMorphModalContext.Provider, { value }, children);
}
function CenterMorphModalTrigger({
  children
}) {
  const context = useCenterMorphModalContext("CenterMorphModalTrigger");
  if (!isValidElement(children)) return children;
  const child = children;
  const childOnClick = child.props.onClick;
  return cloneElement(child, {
    id: context.triggerId,
    onClick: (event) => {
      childOnClick?.(event);
      if (!event.defaultPrevented) context.setOpen(!context.open);
    },
    "aria-haspopup": "dialog",
    "aria-expanded": context.open,
    "aria-controls": context.open ? context.contentId : void 0
  });
}
function CenterMorphModalClose({
  children
}) {
  const context = useCenterMorphModalContext("CenterMorphModalClose");
  if (!isValidElement(children)) return children;
  const child = children;
  const childOnClick = child.props.onClick;
  return cloneElement(child, {
    onClick: (event) => {
      childOnClick?.(event);
      if (!event.defaultPrevented) context.setOpen(false);
    }
  });
}
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");
const CENTER_FOLDED_CLIP = "inset(48% 48% 48% 48% round 30px)";
const CENTER_OPEN_CLIP = "inset(0% 0% 0% 0% round 30px)";
const CENTER_UNFOLD_EASE = [0.2, 0, 0.2, 1];
const CENTER_UNFOLD_TRANSITION = {
  duration: 0.43,
  ease: CENTER_UNFOLD_EASE
};
function getFocusableElements(root) {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll(FOCUSABLE_SELECTOR)
  ).filter((element) => element.tabIndex >= 0);
}
function CenterMorphModalContent({
  children,
  ariaLabel,
  ariaDescribedBy,
  dismissible = true,
  showCloseButton = true,
  closeButtonLabel = "Close modal",
  className,
  backdropClassName
}) {
  const context = useCenterMorphModalContext("CenterMorphModalContent");
  const reduce = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!context.open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(panelRef.current);
      (firstFocusable ?? panelRef.current)?.focus();
    });
    const onKeyDown = (event) => {
      if (event.key === "Escape" && dismissible) {
        event.preventDefault();
        context.setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.getElementById(context.triggerId)?.focus();
    };
  }, [context, dismissible]);
  if (!mounted) return null;
  return createPortal(
    /* @__PURE__ */ React.createElement(AnimatePresence, null, context.open ? /* @__PURE__ */ React.createElement(PresenceGate, null, ({ isPresent, gate }) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      motion.button,
      {
        type: "button",
        "aria-label": "Dismiss modal",
        tabIndex: -1,
        disabled: !dismissible,
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        ...gate,
        transition: {
          duration: reduce ? 0.1 : 0.28,
          ease: EASE_OUT
        },
        onClick: () => context.setOpen(false),
        className: cn(
          "pointer-events-auto fixed inset-0 z-[100] h-full w-full cursor-default bg-black/60",
          backdropClassName
        )
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        inert: !isPresent,
        className: "pointer-events-none fixed inset-4 z-[100] flex items-center justify-center overflow-y-auto drop-shadow-2xl"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex w-full flex-col items-center py-8" }, /* @__PURE__ */ React.createElement(
        motion.div,
        {
          ref: panelRef,
          id: context.contentId,
          role: "dialog",
          "aria-modal": "true",
          "aria-label": ariaLabel,
          "aria-describedby": ariaDescribedBy,
          tabIndex: -1,
          initial: reduce ? { opacity: 0, clipPath: CENTER_OPEN_CLIP } : { opacity: 1, clipPath: CENTER_FOLDED_CLIP },
          animate: {
            opacity: 1,
            clipPath: CENTER_OPEN_CLIP
          },
          exit: reduce ? {
            opacity: 0,
            clipPath: CENTER_OPEN_CLIP
          } : {
            opacity: 1,
            clipPath: CENTER_FOLDED_CLIP
          },
          ...gate,
          transition: reduce ? { duration: 0.14, ease: EASE_OUT } : CENTER_UNFOLD_TRANSITION,
          className: cn(
            "pointer-events-auto relative w-full max-w-[26rem] origin-center overflow-hidden rounded-[30px] border border-border bg-background will-change-[clip-path]",
            className
          )
        },
        children,
        showCloseButton ? /* @__PURE__ */ React.createElement(
          motion.button,
          {
            type: "button",
            "aria-label": closeButtonLabel,
            onClick: () => context.setOpen(false),
            initial: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            exit: {
              opacity: 0,
              scale: reduce ? 1 : 0.88,
              transition: { duration: 0.1, ease: EASE_OUT }
            },
            transition: {
              delay: reduce ? 0 : 0.16,
              duration: reduce ? 0.12 : 0.2,
              ease: EASE_OUT
            },
            className: "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          },
          /* @__PURE__ */ React.createElement(X, { className: "h-4 w-4", "aria-hidden": "true" })
        ) : null
      ))
    ))) : null),
    document.body
  );
}
export {
  CenterMorphModal,
  CenterMorphModalClose,
  CenterMorphModalContent,
  CenterMorphModalTrigger
};
