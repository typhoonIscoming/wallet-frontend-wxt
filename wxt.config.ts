import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react'],
	// 相对于项目根目录
	//   srcDir: "src",             // 默认值: "."
	//   modulesDir: "wxt-modules", // 默认值: "modules"
	outDir: 'dist', // 默认值: ".output"
	//   publicDir: "static",       // 默认值: "public"

	//   // 相对于 srcDir
	//   entrypointsDir: "entries", // 默认值: "entrypoints"
});
