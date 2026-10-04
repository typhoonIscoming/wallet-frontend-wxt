const noon = () => {};
// 密码管理
interface WalletPasswordMessage {
	message: any;
	sender: any;
	sendResponse: (response: any) => void;
}
export default async function setWalletPassword({
	message,
	sendResponse = noon,
}: WalletPasswordMessage): Promise<void> {
	try {
		const password = message.data?.password;
		console.log('[background] WALLET_SET_PASSWORD received', message);
		if (!password) {
			console.error('[Background] WALLET_SET_PASSWORD: Password is empty');
			sendResponse({ error: '密码不能为空' });
			return;
		}
		console.log('[Background] WALLET_SET_PASSWORD: Setting password, length:', password.length);
		await browser.storage.local.set({ walletPassword: password });
		// 验证密码是否已存储
		const verify = await browser.storage.local.get('walletPassword');
		if (verify.walletPassword === password) {
			console.log('[Background] WALLET_SET_PASSWORD: Password stored successfully');
			sendResponse({ success: true });
		} else {
			console.error('[Background] WALLET_SET_PASSWORD: Password verification failed');
			sendResponse({ error: '密码存储验证失败' });
		}
	} catch (e) {
		console.error('[Background] WALLET_SET_PASSWORD: Error:', e);
		sendResponse({
			error: e instanceof Error ? e.message : '设置密码失败',
		});
	}
}

export async function getWalletPassword({
	message,
	sendResponse = noon,
}: WalletPasswordMessage): Promise<void> {
	try {
		const result = await browser.storage.local.get('walletPassword');
		const password = result.walletPassword || null;
		console.log(
			'[Background] WALLET_GET_PASSWORD: Password retrieved, hasPassword:',
			!!password,
			'length:',
			password ? (password as string).length : 0
		);
		sendResponse({ password });
	} catch (e) {
		console.error('[Background] WALLET_GET_PASSWORD: Error:', e);
		sendResponse({
			error: e instanceof Error ? e.message : '获取密码失败',
		});
	}
}
