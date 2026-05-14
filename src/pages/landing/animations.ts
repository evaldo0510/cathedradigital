export const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.08, ease },
  }),
};

export const cardHover = {
  rest: { y: 0 },
  hover: { y: -4, transition: { duration: 0.3, ease: "easeOut" as const } },
  tap: { scale: 0.98 },
};

export const buttonHover = {
  rest: { opacity: 1 },
  hover: { opacity: 0.9, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};
