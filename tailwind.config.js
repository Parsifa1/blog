import typography from "@tailwindcss/typography";

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
];
export const theme = {
  // Remove the following screen breakpoint or add other breakpoints
  // if one breakpoint is not enough for you
  screens: {
    sm: "850px",
  },

  extend: {
    fontSize: {
      ft: "0.9rem",
    },
    textColor: {
      skin: {
        base: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
        inverted: withOpacity("--color-fill"),
      },
      gray: {
        base: withOpacity("--color-gray"),
      },
    },
    backgroundColor: {
      skin: {
        fill: withOpacity("--color-fill"),
        accent: withOpacity("--color-accent"),
        inverted: withOpacity("--color-text-base"),
        card: withOpacity("--color-card"),
        "card-muted": withOpacity("--color-card-muted"),
      },
    },
    outlineColor: {
      skin: {
        fill: withOpacity("--color-accent"),
      },
    },
    borderColor: {
      skin: {
        line: withOpacity("--color-border"),
        fill: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
      },
    },
    fill: {
      skin: {
        base: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
      },
      transparent: "transparent",
    },
    stroke: {
      skin: {
        accent: withOpacity("--color-accent"),
      },
    },
    fontFamily: {
      mono: ["IBM Plex Mono", "monospace"],
      sans: [
        "IBM Plex Mono",
        "Noto Sans SC",
        "PingFang SC",
        "Microsoft Yahei",
        "sans",
      ],
      serif: [
        "IBM Plex Mono",
        "Noto Serif SC",
        "Helvetica",
        "Neue",
        "Helvetica",
        "Arial",
        "sans-serif",
      ],
      code: ["Iosevka Cloudtide", "JetBrains Mono", "Consolas", "monosapce"],
    },

    typography: {
      DEFAULT: {
        css: {
          pre: {
            color: false,
          },
          code: {
            color: false,
          },
        },
      },
    },
  },
};
export const plugins = [typography];
