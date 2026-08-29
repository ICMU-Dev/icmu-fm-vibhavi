import React from 'react';
"use client";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { EASE_IN_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";
const ASCII_SETS = {
  ascii: ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"],
  "ascii-line": ["|", "/", "-", "\\"],
  "ascii-braille": ["\u28FE", "\u28FD", "\u28FB", "\u28BF", "\u287F", "\u28DF", "\u28EF", "\u28F7"],
  "ascii-blocks": ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588", "\u2587", "\u2586", "\u2585", "\u2584", "\u2583", "\u2582"],
  "ascii-bounce": ["\u2801", "\u2802", "\u2804", "\u2840", "\u2880", "\u2820", "\u2810", "\u2808"]
};
const REDUCED = {
  animate: { opacity: [1, 0.4, 1] },
  transition: { duration: 1.4, ease: EASE_IN_OUT, repeat: Infinity }
};
function Loader({
  variant = "spinner",
  size = 32,
  speed = 1,
  label = "Loading",
  className
}) {
  const reduce = useReducedMotion() ?? false;
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      role: "status",
      "aria-label": label,
      className: cn(
        "inline-flex items-center justify-center text-foreground",
        className
      )
    },
    variant === "spinner" && /* @__PURE__ */ React.createElement(Spinner, { size, speed, reduce }),
    variant === "dots" && /* @__PURE__ */ React.createElement(Dots, { size, speed, reduce }),
    variant === "bars" && /* @__PURE__ */ React.createElement(Bars, { size, speed, reduce }),
    variant === "dot-matrix" && /* @__PURE__ */ React.createElement(DotMatrix, { size, speed, reduce }),
    variant === "dither" && /* @__PURE__ */ React.createElement(Dither, { size, speed, reduce }),
    ASCII_SETS[variant] && /* @__PURE__ */ React.createElement(Ascii, { frames: ASCII_SETS[variant], size, speed, reduce }),
    variant === "morph" && /* @__PURE__ */ React.createElement(Morph, { size, speed, reduce }),
    variant === "comet" && /* @__PURE__ */ React.createElement(Comet, { size, speed, reduce }),
    variant === "scramble" && /* @__PURE__ */ React.createElement(Scramble, { size, speed, reduce }),
    variant === "metaballs" && /* @__PURE__ */ React.createElement(Metaballs, { size, speed, reduce }),
    variant === "newton" && /* @__PURE__ */ React.createElement(Newton, { size, speed, reduce }),
    variant === "helix" && /* @__PURE__ */ React.createElement(Helix, { size, speed, reduce }),
    variant === "percent" && /* @__PURE__ */ React.createElement(Percent, { size, speed, reduce }),
    /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, label)
  );
}
function Spinner({ size, speed, reduce }) {
  const stroke = Math.max(2, size * 0.09);
  const r = (size - stroke) / 2;
  return /* @__PURE__ */ React.createElement(
    motion.svg,
    {
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      animate: reduce ? REDUCED.animate : { rotate: 360 },
      transition: reduce ? REDUCED.transition : { duration: speed, ease: "linear", repeat: Infinity }
    },
    /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: size / 2,
        cy: size / 2,
        r,
        fill: "none",
        stroke: "currentColor",
        strokeOpacity: 0.2,
        strokeWidth: stroke
      }
    ),
    /* @__PURE__ */ React.createElement(
      "path",
      {
        d: `M ${size / 2} ${size / 2 - r} A ${r} ${r} 0 0 1 ${size / 2 + r} ${size / 2}`,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: stroke,
        strokeLinecap: "round"
      }
    )
  );
}
function Dots({ size, speed, reduce }) {
  const dot = size * 0.24;
  return /* @__PURE__ */ React.createElement("span", { className: "flex items-center", style: { gap: size * 0.14 } }, [0, 1, 2].map((i) => /* @__PURE__ */ React.createElement(
    motion.span,
    {
      key: i,
      className: "rounded-full bg-current",
      style: { width: dot, height: dot },
      animate: reduce ? { opacity: [0.4, 1, 0.4] } : { y: [0, -size * 0.3, 0], opacity: [0.5, 1, 0.5] },
      transition: {
        duration: speed,
        ease: EASE_IN_OUT,
        repeat: Infinity,
        delay: i * speed * 0.16
      }
    }
  )));
}
function Ascii({
  frames,
  size,
  speed,
  reduce
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const step = (reduce ? speed * 2.5 : speed) / frames.length * 1e3;
    const id = setInterval(
      () => setFrame((f) => (f + 1) % frames.length),
      step
    );
    return () => clearInterval(id);
  }, [frames.length, speed, reduce]);
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "font-mono leading-none tabular-nums",
      style: { fontSize: size, lineHeight: 1 }
    },
    frames[frame % frames.length]
  );
}
const MORPH_POINTS = 24;
function ngonRadius(ang, n, phase = 0) {
  const seg = 2 * Math.PI / n;
  const a = ang - phase;
  const local = (a % seg + seg) % seg - seg / 2;
  return Math.cos(Math.PI / n) / Math.cos(local);
}
function morphPath(radiusAt) {
  const parts = [];
  for (let i = 0; i < MORPH_POINTS; i++) {
    const ang = i / MORPH_POINTS * 2 * Math.PI - Math.PI / 2;
    const r = Math.min(1.05, radiusAt(ang));
    const x = (50 + Math.cos(ang) * 46 * r).toFixed(2);
    const y = (50 + Math.sin(ang) * 46 * r).toFixed(2);
    parts.push(`${i === 0 ? "M" : "L"}${x} ${y}`);
  }
  return `${parts.join(" ")} Z`;
}
const MORPH_PATHS = [
  morphPath(() => 1),
  // circle
  morphPath((a) => ngonRadius(a, 4, Math.PI / 4)),
  // square
  morphPath((a) => ngonRadius(a, 3)),
  // triangle
  morphPath((a) => ngonRadius(a, 6)),
  // hexagon
  morphPath((a) => ngonRadius(a, 4))
  // diamond
];
const MORPH_SEQ = [...MORPH_PATHS.flatMap((p) => [p, p]), MORPH_PATHS[0]];
const MORPH_ROT = [0, 0, 72, 72, 144, 144, 216, 216, 288, 288, 360];
const MORPH_SCALE = [1, 1, 0.88, 0.88, 1, 1, 0.88, 0.88, 1, 1, 1];
function Morph({ size, speed, reduce }) {
  return /* @__PURE__ */ React.createElement(
    motion.svg,
    {
      width: size,
      height: size,
      viewBox: "0 0 100 100",
      role: "img",
      animate: reduce ? { opacity: [1, 0.4, 1] } : { rotate: MORPH_ROT, scale: MORPH_SCALE },
      transition: reduce ? { duration: 1.4, ease: EASE_IN_OUT, repeat: Infinity } : { duration: speed * 5, ease: EASE_IN_OUT, repeat: Infinity }
    },
    /* @__PURE__ */ React.createElement("title", null, "Loading"),
    /* @__PURE__ */ React.createElement(
      motion.path,
      {
        fill: "currentColor",
        d: MORPH_PATHS[0],
        animate: reduce ? void 0 : { d: MORPH_SEQ },
        transition: reduce ? void 0 : { duration: speed * 5, ease: EASE_IN_OUT, repeat: Infinity }
      }
    )
  );
}
const COMET_TRAIL = [0, 1, 2, 3, 4, 5];
function Comet({ size, speed, reduce }) {
  const head = size * 0.2;
  const r = size / 2 - head / 2;
  return /* @__PURE__ */ React.createElement("span", { className: "relative", style: { width: size, height: size } }, /* @__PURE__ */ React.createElement(
    motion.span,
    {
      className: "absolute inset-0",
      animate: reduce ? REDUCED.animate : { rotate: 360 },
      transition: reduce ? REDUCED.transition : { duration: speed, ease: "linear", repeat: Infinity }
    },
    COMET_TRAIL.map((i) => {
      const scale = 1 - i * 0.13;
      const sz = head * scale;
      return /* @__PURE__ */ React.createElement(
        "span",
        {
          key: i,
          className: "absolute top-1/2 left-1/2 rounded-full bg-current",
          style: {
            width: sz,
            height: sz,
            marginLeft: -sz / 2,
            marginTop: -sz / 2,
            opacity: 1 - i * 0.16,
            transform: `rotate(${-i * 15}deg) translateY(${-r}px)`
          }
        }
      );
    })
  ));
}
const SCRAMBLE_TARGET = "LOADING";
const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/*#@";
function Scramble({ size, speed, reduce }) {
  const [text, setText] = useState(SCRAMBLE_TARGET);
  useEffect(() => {
    if (reduce) {
      setText(SCRAMBLE_TARGET);
      return;
    }
    let tick = 0;
    const total = SCRAMBLE_TARGET.length + 4;
    const id = setInterval(
      () => {
        const reveal = tick % total;
        let s = "";
        for (let i = 0; i < SCRAMBLE_TARGET.length; i++) {
          s += i < reveal ? SCRAMBLE_TARGET[i] : SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        }
        setText(s);
        tick++;
      },
      speed / SCRAMBLE_TARGET.length * 1e3 * 0.55
    );
    return () => clearInterval(id);
  }, [speed, reduce]);
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "font-mono font-medium tracking-[0.2em] tabular-nums",
      style: { fontSize: size * 0.42 }
    },
    text
  );
}
function Metaballs({ size, speed, reduce }) {
  const id = useId().replace(/:/g, "");
  return /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 100 100", role: "img" }, /* @__PURE__ */ React.createElement("title", null, "Loading"), /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("filter", { id }, /* @__PURE__ */ React.createElement("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "5", result: "b" }), /* @__PURE__ */ React.createElement(
    "feColorMatrix",
    {
      in: "b",
      values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
    }
  ))), /* @__PURE__ */ React.createElement("g", { filter: `url(#${id})`, fill: "currentColor" }, /* @__PURE__ */ React.createElement(
    motion.circle,
    {
      cy: "50",
      r: "15",
      animate: reduce ? { opacity: [0.4, 1, 0.4] } : { cx: [30, 70, 30] },
      transition: { duration: speed * 1.6, ease: EASE_IN_OUT, repeat: Infinity },
      cx: reduce ? 40 : 30
    }
  ), /* @__PURE__ */ React.createElement(
    motion.circle,
    {
      cy: "50",
      r: "15",
      animate: reduce ? { opacity: [0.4, 1, 0.4] } : { cx: [70, 30, 70] },
      transition: { duration: speed * 1.6, ease: EASE_IN_OUT, repeat: Infinity },
      cx: reduce ? 60 : 70
    }
  )));
}
const NEWTON_BALLS = [0, 1, 2, 3, 4];
function Newton({ size, speed, reduce }) {
  const d = size * 0.2;
  const out = d * 1.1;
  const moves = {
    0: { x: [0, -out, 0, 0], times: [0, 0.28, 0.5, 1] },
    4: { x: [0, 0, out, 0], times: [0, 0.5, 0.78, 1] }
  };
  return /* @__PURE__ */ React.createElement("span", { className: "flex items-center justify-center", style: { height: d } }, NEWTON_BALLS.map((i) => {
    const move = moves[i];
    return /* @__PURE__ */ React.createElement(
      motion.span,
      {
        key: i,
        className: "rounded-full bg-current",
        style: { width: d, height: d },
        animate: reduce || !move ? void 0 : { x: move.x },
        transition: reduce || !move ? void 0 : {
          duration: speed * 1.5,
          ease: EASE_IN_OUT,
          repeat: Infinity,
          times: move.times
        }
      }
    );
  }));
}
function Helix({ size, speed, reduce }) {
  const rows = 7;
  const dot = size * 0.14;
  const amp = size * 0.32;
  return /* @__PURE__ */ React.createElement("span", { className: "relative", style: { width: size, height: size } }, Array.from({ length: rows }, (_, r) => {
    const top = r / (rows - 1) * (size - dot);
    const delay = r / rows * speed;
    return /* @__PURE__ */ React.createElement("span", { key: `row-${top}` }, /* @__PURE__ */ React.createElement(
      motion.span,
      {
        className: "absolute rounded-full bg-current",
        style: { width: dot, height: dot, left: size / 2 - dot / 2, top },
        animate: reduce ? { opacity: [0.4, 1, 0.4] } : {
          x: [amp, -amp, amp],
          scale: [1, 0.5, 1],
          opacity: [1, 0.45, 1]
        },
        transition: {
          duration: speed,
          ease: EASE_IN_OUT,
          repeat: Infinity,
          delay
        }
      }
    ), /* @__PURE__ */ React.createElement(
      motion.span,
      {
        className: "absolute rounded-full bg-current",
        style: { width: dot, height: dot, left: size / 2 - dot / 2, top },
        animate: reduce ? { opacity: [0.4, 1, 0.4] } : {
          x: [-amp, amp, -amp],
          scale: [0.5, 1, 0.5],
          opacity: [0.45, 1, 0.45]
        },
        transition: {
          duration: speed,
          ease: EASE_IN_OUT,
          repeat: Infinity,
          delay
        }
      }
    ));
  }));
}
function Percent({ size, speed, reduce }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const dur = (reduce ? speed * 2 : speed) * 1e3;
    const start = { t: 0 };
    const tickMs = 40;
    const id = setInterval(() => {
      start.t += tickMs;
      const next = Math.min(100, Math.round(start.t / dur * 100));
      setP(next);
      if (next >= 100) start.t = 0;
    }, tickMs);
    return () => clearInterval(id);
  }, [speed, reduce]);
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "flex flex-col items-center",
      style: { gap: size * 0.14, width: size * 1.4 }
    },
    /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "font-mono font-medium tabular-nums",
        style: { fontSize: size * 0.42, lineHeight: 1 }
      },
      p,
      "%"
    ),
    /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "w-full overflow-hidden rounded-full bg-current/15",
        style: { height: Math.max(3, size * 0.1) }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "block h-full rounded-full bg-current",
          style: { width: `${p}%` }
        }
      )
    )
  );
}
function Bars({ size, speed, reduce }) {
  const bar = size * 0.16;
  return /* @__PURE__ */ React.createElement("span", { className: "flex items-center", style: { gap: size * 0.1, height: size } }, [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement(
    motion.span,
    {
      key: i,
      className: "rounded-full bg-current",
      style: { width: bar, height: size, originY: 1 },
      animate: reduce ? { opacity: [0.4, 1, 0.4] } : { scaleY: [0.3, 1, 0.3] },
      transition: {
        duration: speed,
        ease: EASE_IN_OUT,
        repeat: Infinity,
        delay: i * speed * 0.12
      }
    }
  )));
}
function DotMatrix({ size, speed, reduce }) {
  const n = 3;
  const gap = size * 0.14;
  const dot = (size - gap * (n - 1)) / n;
  const cells = Array.from({ length: n * n }, (_, idx) => idx);
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "grid",
      style: {
        gap,
        gridTemplateColumns: `repeat(${n}, ${dot}px)`
      }
    },
    cells.map((idx) => {
      const x = idx % n;
      const y = Math.floor(idx / n);
      const delay = (x + y) / (2 * (n - 1)) * speed;
      return /* @__PURE__ */ React.createElement(
        motion.span,
        {
          key: idx,
          className: "rounded-full bg-current",
          style: { width: dot, height: dot },
          animate: reduce ? { opacity: [0.3, 1, 0.3] } : { opacity: [0.2, 1, 0.2], scale: [0.7, 1, 0.7] },
          transition: {
            duration: speed,
            ease: EASE_IN_OUT,
            repeat: Infinity,
            delay
          }
        }
      );
    })
  );
}
const BAYER_4 = [
  0,
  8,
  2,
  10,
  12,
  4,
  14,
  6,
  3,
  11,
  1,
  9,
  15,
  7,
  13,
  5
];
function Dither({ size, speed, reduce }) {
  const n = 4;
  const gap = Math.max(1, size * 0.05);
  const cell = (size - gap * (n - 1)) / n;
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "grid",
      style: { gap, gridTemplateColumns: `repeat(${n}, ${cell}px)` }
    },
    BAYER_4.map((order, idx) => /* @__PURE__ */ React.createElement(
      motion.span,
      {
        key: idx,
        className: "bg-current",
        style: { width: cell, height: cell },
        animate: reduce ? { opacity: [0.3, 1, 0.3] } : { opacity: [0.1, 1, 0.1] },
        transition: {
          duration: speed,
          ease: EASE_IN_OUT,
          repeat: Infinity,
          delay: order / BAYER_4.length * speed
        }
      }
    ))
  );
}
export {
  Loader
};
