/**
 * 获取已解锁的钱包实例
 *
 * 【用途】
 * Wallet 实例用于签名操作：
 * - 签名消息（signMessage）
 * - 签名交易（signTransaction）
 * - EIP-712 签名（signTypedData）
 *
 * 【安全流程】
 * 1. 检查钱包状态（是否锁定、是否有账户）
 * 2. 从 storage 获取密码
 * 3. 验证密码（通过尝试解密助记词）
 * 4. 解密私钥（使用 AES 解密）
 * 5. 验证私钥格式
 * 6. 创建 Wallet 实例（需要 Provider）
 *
 * 【私钥存储格式】
 * - 加密存储：使用 AES 加密，Base64 编码
 * - 未加密：66 字符（0x + 64 个十六进制字符）
 *
 * 【解密策略】
 * - 优先尝试 UTF-8 解码
 * - 如果失败，尝试 Hex 解码
 * - 验证解密后的格式（必须是有效的私钥）
 *
 * 【错误处理】
 * - 密码错误：返回 null，记录详细日志
 * - 数据损坏：返回 null，记录详细日志
 * - 格式错误：返回 null，记录详细日志
 *
 * @returns Promise<ethers.Wallet | null> - Wallet 实例，如果解锁失败则返回 null
 */
import { browser } from 'wxt/browser';
import crypto from 'crypto-js';
import getWalletState from './getWalletState';
import getProvider from './getProvider';
import { ethers } from 'ethers';
import { WALLET_PASSWORD_KEY } from '@/utils/env';

const { AES, enc } = crypto;

export default async function getUnlockedWallet(): Promise<ethers.Wallet | null> {
	try {
		const state = await getWalletState();
		if (!state) {
			console.error('[Background] getUnlockedWallet: No wallet state');
			return null;
		}

		if (state.isLocked) {
			console.error('[Background] getUnlockedWallet: Wallet is locked');
			return null;
		}

		if (!state.currentAccount) {
			console.error('[Background] getUnlockedWallet: No current account');
			return null;
		}

		// 获取密码
		const passwordResult = await browser.storage.local.get(WALLET_PASSWORD_KEY);
		const password = passwordResult[WALLET_PASSWORD_KEY];
		if (!password) {
			console.error('[Background] getUnlockedWallet: No password in storage');
			return null;
		}

		// 验证密码是否正确（通过尝试解密助记词来验证）
		let passwordValid = false;
		if (state.mnemonic) {
			try {
				const testDecrypt = AES.decrypt(state.mnemonic, password as string);
				const testResult = testDecrypt.toString(enc.Utf8);
				// 如果解密成功且结果看起来像助记词（至少有几个单词）
				if (testResult && testResult.trim().split(/\s+/).length >= 12) {
					passwordValid = true;
				}
			} catch (e) {
				console.warn('[Background] Password validation failed:', e);
			}
		}

		if (!passwordValid && state.mnemonic) {
			console.error(
				'[Background] getUnlockedWallet: Password validation failed - password may be incorrect'
			);
			// 即使密码验证失败，也尝试解密私钥（可能助记词和私钥使用不同的密码）
		}

		// 解密私钥
		try {
			const storedPrivateKey = state.currentAccount.privateKey;
			let privateKey: string | null = null;

			// 检查私钥是否已经是未加密格式（66个字符：0x + 64个十六进制字符）
			// 加密后的私钥应该是Base64编码，长度会远大于66
			if (
				storedPrivateKey.length === 66 &&
				storedPrivateKey.startsWith('0x') &&
				/^0x[a-fA-F0-9]{64}$/.test(storedPrivateKey)
			) {
				// 私钥看起来是未加密的，直接使用
				console.warn('[Background] Private key appears to be unencrypted, using directly');
				privateKey = storedPrivateKey;
			} else {
				// 私钥是加密的，需要解密
				console.log(
					'[Background] Private key appears to be encrypted, attempting decryption...'
				);
				const decryptedBytes = AES.decrypt(storedPrivateKey, password as string);

				// 尝试多种编码方式
				// 首先尝试 UTF-8（最常见的情况）
				try {
					const utf8Result = decryptedBytes.toString(enc.Utf8).trim();
					// 验证是否是有效的私钥格式
					if (
						utf8Result &&
						(utf8Result.startsWith('0x') ||
							/^[0-9a-fA-F]{64}$/.test(utf8Result.replace(/^0x/, '')))
					) {
						privateKey = utf8Result;
						console.log('[Background] Successfully decrypted private key using UTF-8');
					} else {
						console.warn(
							'[Background] UTF-8 result does not match private key format:',
							{
								length: utf8Result.length,
								preview: utf8Result.substring(0, 20) + '...',
							}
						);
					}
				} catch (utf8Error: any) {
					// UTF-8 解码失败，继续尝试其他方式
					console.warn(
						'[Background] UTF-8 decode failed, trying Hex:',
						utf8Error.message
					);
				}

				// 如果 UTF-8 失败，尝试 Hex 编码
				if (!privateKey) {
					try {
						const hexString = decryptedBytes.toString(enc.Hex);
						// 验证是否是有效的十六进制字符串
						if (hexString && /^[0-9a-fA-F]{64}$/.test(hexString)) {
							privateKey = '0x' + hexString;
							console.log(
								'[Background] Successfully decrypted private key using Hex'
							);
						} else {
							console.warn(
								'[Background] Hex result does not match private key format:',
								{
									length: hexString.length,
									preview: hexString.substring(0, 20) + '...',
								}
							);
						}
					} catch (hexError: any) {
						console.warn('[Background] Hex decode failed:', hexError.message);
					}
				}

				// 如果都失败了，说明密码可能错误或数据损坏
				if (!privateKey) {
					console.error(
						'[Background] getUnlockedWallet: Failed to decrypt private key - invalid password or corrupted data',
						{
							accountAddress: state.currentAccount.address,
							hasPassword: !!password,
							passwordLength: (password as string).length,
							encryptedPrivateKeyLength: storedPrivateKey.length,
							encryptedPrivateKeyPreview: storedPrivateKey.substring(0, 50) + '...',
							passwordValid: passwordValid,
							isBase64Like: /^[A-Za-z0-9+/=]+$/.test(storedPrivateKey), // Base64 通常只包含这些字符
						}
					);
					return null;
				}
			}

			// 清理私钥格式：确保有 0x 前缀
			if (!privateKey.startsWith('0x')) {
				privateKey = '0x' + privateKey;
			}

			// 移除可能的空白字符
			privateKey = privateKey.trim();

			// 验证私钥格式（应该是 66 个字符：0x + 64 个十六进制字符）
			if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
				console.error('[Background] getUnlockedWallet: Invalid private key format:', {
					length: privateKey.length,
					startsWith0x: privateKey.startsWith('0x'),
					preview:
						privateKey.substring(0, 10) +
						'...' +
						privateKey.substring(privateKey.length - 10),
				});
				return null;
			}

			// 获取 provider
			const provider = await getProvider();
			if (!provider) {
				console.error('[Background] getUnlockedWallet: No provider available');
				return null;
			}

			// 验证私钥是否有效
			try {
				const wallet = new ethers.Wallet(privateKey, provider);
				console.log(
					'[Background] getUnlockedWallet: Successfully created wallet for',
					wallet.address
				);
				return wallet;
			} catch (walletError) {
				console.error(
					'[Background] getUnlockedWallet: Failed to create wallet from private key:',
					walletError
				);
				return null;
			}
		} catch (decryptError: any) {
			console.error('[Background] getUnlockedWallet: Decryption error:', {
				error: decryptError.message,
				errorName: decryptError.name,
				accountAddress: state.currentAccount.address,
				hasPassword: !!password,
				passwordLength: password ? (password as string).length : 0,
			});
			return null;
		}
	} catch (error) {
		console.error('[Background] Failed to get unlocked wallet:', error);
		return null;
	}
}
