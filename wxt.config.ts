import { defineConfig } from 'wxt';
// import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	modules: ['@wxt-dev/module-react'],
	outDir: 'dist',
	manifest: {
		permissions: ['sidePanel', 'storage'],
		action: {
			default_title: 'Wallet',
		},
		side_panel: {
			default_path: 'sidepanel.html',
		},
		web_accessible_resources: [
			{
				resources: ['inject-provider.js'],
				matches: ['<all_urls>'],
			},
		],
	},
	// 以下是tailwindV4的配置方式，V3的方式是+postcss
	// vite: () => ({
	// 	plugins: [tailwindcss()],
	// }),
});
