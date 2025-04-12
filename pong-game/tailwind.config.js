/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/*/*.{ts,tsx}"],
	theme: {
	extend: {
		fontFamily: {
		press: ['"Press Start 2P"', 'monospace'],
		},
	},
	},
	plugins: [],
	future: {
		hoverOnlyWhenSupported: true
	} // ✅ 明确兼容所有现代浏览器
}
