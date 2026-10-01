import { defineConfig } from 'wxt';

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
});
