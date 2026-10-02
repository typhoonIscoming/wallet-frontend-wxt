import type { Config } from 'tailwindcss';

export default {
	content: [
		'./entrypoints/**/*.{ts,tsx,html}',
		'./public/**/*.html',
		'./components/**/*.{ts,tsx,html}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e', // 主绿色
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
					950: '#052e16',
				},
				accent: {
					DEFAULT: '#a3e635', // 亮绿色（logo 色）
					light: '#bef264',
					dark: '#84cc16',
				},
			},
		},
	},
	plugins: [],
} satisfies Config;
