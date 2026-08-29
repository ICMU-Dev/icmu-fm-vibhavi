import React from 'react';
"use client";
import { useIsPresent } from "motion/react";
function PresenceGate({ children }) {
  const isPresent = useIsPresent();
  return children({
    isPresent,
    gate: {
      inert: !isPresent,
      style: { pointerEvents: isPresent ? "auto" : "none" }
    }
  });
}
export {
  PresenceGate
};
