/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
        "colors": {
            "surface-dim": "#131313",
            "secondary-container": "#920703",
            "primary-fixed-dim": "#e9c349",
            "primary-container": "#d4af37",
            "secondary-fixed": "#ffdad4",
            "on-primary-fixed": "#241a00",
            "on-error": "#690005",
            "tertiary-fixed-dim": "#e9c400",
            "tertiary-container": "#d2b100",
            "inverse-on-surface": "#313030",
            "surface-bright": "#393939",
            "secondary": "#ffb4a8",
            "secondary-fixed-dim": "#ffb4a8",
            "on-primary-fixed-variant": "#574500",
            "surface": "#131313",
            "on-secondary": "#690000",
            "inverse-primary": "#735c00",
            "surface-tint": "#e9c349",
            "on-primary-container": "#554300",
            "on-tertiary-container": "#534400",
            "on-background": "#e5e2e1",
            "on-secondary-fixed-variant": "#920703",
            "surface-container-high": "#2a2a2a",
            "on-tertiary-fixed": "#221b00",
            "error": "#ffb4ab",
            "outline-variant": "#4d4635",
            "tertiary-fixed": "#ffe16d",
            "on-tertiary-fixed-variant": "#544600",
            "surface-variant": "#353534",
            "on-surface-variant": "#d0c5af",
            "on-secondary-container": "#ff9a8a",
            "surface-container": "#201f1f",
            "surface-container-lowest": "#0e0e0e",
            "on-error-container": "#ffdad6",
            "inverse-surface": "#e5e2e1",
            "primary": "#f2ca50",
            "on-tertiary": "#3a3000",
            "on-surface": "#e5e2e1",
            "error-container": "#93000a",
            "primary-fixed": "#ffe088",
            "outline": "#99907c",
            "on-secondary-fixed": "#410000",
            "surface-container-low": "#1c1b1b",
            "surface-container-highest": "#353534",
            "background": "#131313",
            "tertiary": "#f2cc00",
            "on-primary": "#3c2f00"
        },
        "borderRadius": {
            "DEFAULT": "0.25rem",
            "lg": "0.5rem",
            "xl": "0.75rem",
            "full": "9999px"
        },
        "spacing": {
            "stack-md": "24px",
            "stack-lg": "48px",
            "gutter": "16px",
            "unit": "8px",
            "stack-sm": "8px",
            "container-margin": "24px"
        },
        "fontFamily": {
            "display-xl": ["Epilogue"],
            "label-bold": ["Be Vietnam Pro"],
            "headline-lg": ["Epilogue"],
            "headline-md": ["Epilogue"],
            "body-lg": ["Be Vietnam Pro"],
            "body-md": ["Be Vietnam Pro"]
        },
        "fontSize": {
            "display-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "800" }],
            "label-bold": ["14px", { "lineHeight": "20px", "fontWeight": "700" }],
            "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "700" }],
            "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
            "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
            "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
        }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
