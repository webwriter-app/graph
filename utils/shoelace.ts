const computedStyle = getComputedStyle(document.documentElement);
const cssVar = (name: string, unit?: string): string => {
	let value = computedStyle.getPropertyValue(name).trim();

	if (value.startsWith("var(")) return cssVar(value.slice(4, -1));
	if (unit && value.endsWith(unit))
		value = value.slice(0, -unit.length).trim();

	return value;
};

const conversionCtx = document.createElement("canvas").getContext("2d")!;
export function hslToHex(hsl: string) {
	conversionCtx.fillStyle = hsl;
	return conversionCtx.fillStyle;
}

// A selection of Shoelace design tokens used in the app
// See https://shoelace.style/tokens/typography
const SHOELACE = {
	font: {
		sans: cssVar("--sl-font-sans"),
	},
	focus: {
		ringColor: cssVar("--sl-focus-ring-color"),
		ringWidthPx: +cssVar("--sl-focus-ring-width", "px"),
	},
	color: {
		neutral: {
			300: hslToHex(cssVar("--sl-color-neutral-300")),
		},
		gray: {
			950: hslToHex(cssVar("--sl-color-gray-950")),
		},
		red: {
			500: hslToHex(cssVar("--sl-color-red-500")),
		},
		orange: {
			500: hslToHex(cssVar("--sl-color-orange-500")),
		},
		yellow: {
			500: hslToHex(cssVar("--sl-color-yellow-500")),
		},
		lime: {
			500: hslToHex(cssVar("--sl-color-lime-500")),
		},
		green: {
			500: hslToHex(cssVar("--sl-color-green-500")),
		},
		teal: {
			500: hslToHex(cssVar("--sl-color-teal-500")),
		},
		cyan: {
			500: hslToHex(cssVar("--sl-color-cyan-500")),
		},
		blue: {
			500: hslToHex(cssVar("--sl-color-blue-500")),
		},
		violet: {
			500: hslToHex(cssVar("--sl-color-violet-500")),
		},
		purple: {
			500: hslToHex(cssVar("--sl-color-purple-500")),
		},
		pink: {
			500: hslToHex(cssVar("--sl-color-pink-500")),
		},
	},
};

export default SHOELACE;
