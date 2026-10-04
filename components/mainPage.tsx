import type { PopupRoute } from '@/entrypoints/background/types';
import { useWalletStore } from '@/utils/wallet-store';
import Header from './header';
import { useBalance } from '@/hooks/useBalance';
import { useEffect, useState } from 'react';
import { AES, enc } from 'crypto-js';

function UnlockIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="lucide lucide-lock-keyhole-open preview-icon"
		>
			<circle cx="12" cy="16" r="1" />
			<rect width="18" height="12" x="3" y="10" rx="2" />
			<path d="M7 10V7a5 5 0 0 1 9.33-2.5" />
		</svg>
	);
}
function LockIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="lucide lucide-lock-keyhole preview-icon"
		>
			<circle cx="12" cy="16" r="1" />
			<rect x="3" y="10" width="18" height="12" rx="2" />
			<path d="M7 10V7a5 5 0 0 1 10 0v3" />
		</svg>
	);
}
interface MainPageProps {
	onNavigate: (route: PopupRoute) => void;
}
export default function MainPage({ onNavigate }: MainPageProps) {
	const { isLocked, accounts, currentAccount, mnemonic, currentNetwork } = useWalletStore();
	const { balance, balanceLoading } = useBalance();
	const [revealed, setRevealed] = useState(false);
	const [savedMnemonic, setSavedMnemonic] = useState<string | null>(null);
	console.log('currentNetwork', currentNetwork, 'accounts', accounts, 'mnemonic', mnemonic);
	// 获取已保存的助记词（解密）
	const getDecryptedMnemonic = async () => {
		console.log('getDecryptedMnemonic called', mnemonic);
		if (!mnemonic) return null;
		try {
			const res = await browser.runtime.sendMessage({ type: 'WALLET_GET_PASSWORD' });
			console.log('WALLET_GET_PASSWORD response', res);
			const pwd = res?.password;
			if (!pwd) return null;
			const decrypted = AES.decrypt(mnemonic, pwd).toString(enc.Utf8);
			console.log('decrypted mnemonic', decrypted);
			return decrypted || null;
		} catch {
			return null;
		}
	};

	useEffect(() => {
		console.log('revealed', revealed, 'mnemonic', mnemonic, 'isLocked', isLocked);
		if (revealed && mnemonic && !isLocked) {
			getDecryptedMnemonic().then(setSavedMnemonic);
		}
	}, [revealed, mnemonic, isLocked]);
	const wordList = savedMnemonic ? savedMnemonic.trim().split(/\s+/) : [];

	const UnlockItem = () => {
		return (
			<div
				className="flex cursor-pointer p-[4px] hover:bg-[#e8e8e8] items-center gap-2"
				onClick={() => onNavigate('unlock')}
			>
				{isLocked ? <UnlockIcon /> : <LockIcon />}
				{isLocked ? '解锁' : '加锁'}
			</div>
		);
	};
	if (accounts.length === 0) {
		return (
			<div className="w-full">
				<Header title="钱包" showBack={false} className="p-2 bg-white sticky top-0 z-9" />
				<div className="px-2 pb-4 mt-4">
					<div className="space-y-3">
						<button
							className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20"
							onClick={() => onNavigate('create')}
						>
							创建新钱包
						</button>
						<button
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:border-accent/50 transition-colors"
							onClick={() => onNavigate('import')}
						>
							导入钱包
						</button>
					</div>
				</div>
			</div>
		);
	}
	return (
		<div className="w-full">
			<Header
				title="钱包"
				rightAction={<UnlockItem />}
				className="p-2 bg-white sticky top-0 z-9"
			/>
			{currentAccount && (
				<div className="mt-0 px-2">
					<div className="pt-4 pb-4">
						{/* 余额显示 */}
						<div className="rounded-xl border border-gray-100 bg-[#f3f3f3] p-4 mb-3 backdrop-blur-sm">
							<div className="flex items-center justify-between mb-2">
								<div className="text-xs text-black">余额</div>
								<button
									onClick={() => onNavigate('networks')}
									className="text-xs p-0 py-1 text-black hover:outline-none border-none bg-transparent hover:text-black/70 flex items-center gap-1 transition-colors"
								>
									<svg
										className="w-3 h-3"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 9l4-4 4 4m0 6l-4 4-4-4"
										/>
									</svg>
									{currentNetwork.name}
								</button>
							</div>
							<div className="flex items-baseline gap-2 mb-1">
								<div className="text-2xl font-bold text-black">
									{balanceLoading ? '...' : balance}
								</div>
								<div className="text-sm text-black/50">
									{currentNetwork.currencySymbol}
								</div>
							</div>
						</div>

						{/* 操作按钮 */}
						<div className="grid grid-cols-2 gap-3 mb-3">
							<button
								className="rounded-lg cursor-pointer disabled:cursor-not-allowed bg-accent px-4 py-3 text-sm font-medium text-black hover:bg-accent-light disabled:hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
								onClick={() => {
									console.log('send');
									onNavigate('send');
								}}
								disabled={isLocked}
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
									/>
								</svg>
								发送
							</button>
							<button
								className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:border-accent/50 transition-colors flex items-center justify-center gap-2"
								onClick={() => onNavigate('receive')}
								disabled={isLocked}
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 5v14m7-7l-7 7-7-7"
									/>
								</svg>
								收款
							</button>
						</div>

						{/* 代币和 NFT 入口 */}
						<div className="grid grid-cols-2 gap-3 mb-3">
							<button
								className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:border-accent/50 transition-colors flex items-center justify-center gap-2"
								onClick={() => onNavigate('tokens')}
								disabled={isLocked}
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								代币
							</button>
							<button
								className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:border-accent/50 transition-colors flex items-center justify-center gap-2"
								onClick={() => onNavigate('nfts')}
								disabled={isLocked}
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								NFT
							</button>
						</div>

						{/* 账户信息 */}
						<div className="rounded-xl border border-gray-100 bg-[#f3f3f3] p-4 mb-3">
							<div className="text-xs text-black mb-1">当前账户</div>
							<div className="text-sm font-mono text-black break-all">
								{currentAccount.address}
							</div>
							<div className="text-xs text-black/50 mt-2">{currentAccount.name}</div>
						</div>

						{/* 助记词 */}
						<div className="rounded-xl border border-gray-100 bg-[#f3f3f3] p-3">
							<div className="flex items-center justify-between mb-3">
								<div className="text-sm text-black">助记词</div>
								{mnemonic && (
									<button
										className="text-xs text-black hover:text-black/70 transition-colors"
										onClick={() => setRevealed((v) => !v)}
									>
										{revealed ? '隐藏' : '显示'}
									</button>
								)}
							</div>

							{mnemonic ? (
								<div>
									{revealed && savedMnemonic ? (
										<div className="grid grid-cols-3 gap-2">
											{wordList.map((w, i) => (
												<div
													key={`${w}-${i}`}
													className="rounded-lg border border-slate-800 bg-gray-500 px-2 py-2"
												>
													<div className="text-[14px] text-white">
														{i + 1}
													</div>
													<div className="mt-1 truncate text-white text-sm font-medium">
														{w}
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
											点击"显示"查看助记词
										</div>
									)}
								</div>
							) : (
								<div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
									未保存助记词
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
