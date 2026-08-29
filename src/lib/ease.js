const EASE_OUT = [0.16, 1, 0.3, 1];
const EASE_IN_OUT = [0.77, 0, 0.175, 1];
const EASE_DRAWER = [0.32, 0.72, 0, 1];
const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6
};
const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55
};
const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5
};
const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6
};
const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3
};
const SPRING_GLIDE = {
  stiffness: 700,
  damping: 50,
  mass: 0.5
};
export {
  EASE_DRAWER,
  EASE_IN_OUT,
  EASE_OUT,
  EASE_OUT_CSS,
  SPRING_GLIDE,
  SPRING_LAYOUT,
  SPRING_MOUSE,
  SPRING_PANEL,
  SPRING_PRESS,
  SPRING_SWAP
};
