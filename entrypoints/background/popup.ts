/**
 * Popup 窗口管理
 *
 * 【用途】
 * 统一管理 Popup/sidepanel 窗口的打开操作。
 *
 * 【浏览器限制】
 * - browser.action.openPopup() 只能由用户手势触发
 * - 如果 Popup 已经打开，再次调用会失败（这是正常的）
 * - 错误会被捕获并忽略，因为 Popup 可能已经打开
 *
 * 【使用场景】
 * 当 DApp 发起需要用户确认的操作时：
 * 1. 打开 Popup
 * 2. 设置路由到对应的确认页面
 * 3. 用户操作后关闭或保持打开
 *
 * 【设计说明】
 * 使用 try-catch 捕获错误，因为 Popup 可能已经打开。
 * 这是浏览器扩展的常见模式。
 */
import { browser } from 'wxt/browser';

/**
 * 打开 popup 窗口
 *
 * @returns Promise<void> - 打开操作完成（可能失败，但不会抛出错误）
 */
export default async function openPopup(): Promise<void> {
	try {
		// 尝试打开 popup
		await browser.action.openPopup();
	} catch (error) {
		// 如果无法打开 popup（可能已经打开），忽略错误
		console.log('[Background] Popup may already be open:', error);
	}
}
