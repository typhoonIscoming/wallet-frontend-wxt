import { defineConfig } from 'wxt';

export default defineConfig({
	modules: ['@wxt-dev/module-react'],
	outDir: 'dist',
	manifest: {
		permissions: ['sidePanel'],
		action: {
			default_title: 'Wallet',
		},
		side_panel: {
			default_path: 'sidepanel.html',
		},
	},
});
