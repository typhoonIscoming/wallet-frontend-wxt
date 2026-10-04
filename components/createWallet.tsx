import type { PopupRoute } from '@/entrypoints/background/types';
import { useState, useContext } from 'react';
import Header from './header';
import RootContext from './rootContext';
import { SIDEPANEL } from '@/utils/env';
import { useWalletStore } from '@/utils/wallet-store';

interface CreateWalletProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function CreateWallet({ onNavigate }: CreateWalletProps) {
	const { mode } = useContext(RootContext);
	const { createWallet } = useWalletStore();

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [newMnemonic, setNewMnemonic] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const onPasswordChange = (value: string) => {
		setPassword(value);
	};

	const onConfirmPasswordChange = (value: string) => {
		setConfirmPassword(value);
	};

	const onCreateWallet = async () => {
		if (password !== confirmPassword) {
			setError('两次输入的密码不一致');
			return;
		}
		setLoading(true);
		setError('');
		try {
			const { mnemonic: generatedMnemonic } = await createWallet(password);
			console.log('Generated mnemonic:', generatedMnemonic);
			setNewMnemonic(generatedMnemonic);
			// onNavigate('main');
		} catch (err) {
			setError('创建钱包失败，请重试');
		} finally {
			setLoading(false);
		}
	};
	const wordList = newMnemonic ? newMnemonic.trim().split(/\s+/) : [];
	const copyMnemonic = async () => {
		if (!newMnemonic) return;
		try {
			await navigator.clipboard.writeText(newMnemonic);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// 忽略错误
		}
	};
	const onMnemonicConfirmed = () => {
		// onNavigate('main');
	};

	const showMnemonic = () => {
		return (
			<div className="space-y-4 px-2">
				<div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-4">
					<div className="text-sm font-medium text-yellow-200 mb-2">
						⚠️ 请妥善保管助记词
					</div>
					<div className="text-xs text-yellow-200/80">
						助记词一旦泄露，资产可能被盗。建议离线抄写，不要截图/云端同步。
					</div>
				</div>

				<div className="grid grid-cols-3 gap-2">
					{wordList.map((w, i) => (
						<div
							key={`${w}-${i}`}
							className="rounded-lg border border-slate-800 bg-slate-950/50 px-2 py-2"
						>
							<div className="text-[10px] text-slate-500">{i + 1}</div>
							<div className="mt-1 truncate text-sm font-medium">{w}</div>
						</div>
					))}
				</div>

				<div className="flex gap-2">
					<button
						className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
						onClick={copyMnemonic}
					>
						{copied ? '已复制' : '复制助记词'}
					</button>
					<button
						className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20"
						onClick={onMnemonicConfirmed}
					>
						已完成
					</button>
				</div>
			</div>
		);
	};
	const showCreateWalletForm = () => {
		return (
			<div className="space-y-4 px-2">
				<div>
					<div className="text-sm mb-2">设置密码</div>
					<input
						type="password"
						placeholder="至少8位字符"
						value={password}
						onChange={(e) => onPasswordChange(e.target.value)}
						className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-white focus:border-accent focus:outline-none transition-colors"
						disabled={loading}
					/>
				</div>

				<div>
					<div className="text-sm mb-2">确认密码</div>
					<input
						type="password"
						placeholder="再次输入密码"
						value={confirmPassword}
						onChange={(e) => onConfirmPasswordChange(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && onCreateWallet()}
						className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-white focus:border-accent focus:outline-none transition-colors"
						disabled={loading}
					/>
				</div>

				{error && <div className="rounded-lg py-1 text-sm text-red-700">{error}</div>}

				<button
					className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
					onClick={onCreateWallet}
					disabled={loading || !password || !confirmPassword}
				>
					{loading ? '创建中...' : '创建钱包'}
				</button>
			</div>
		);
	};

	return (
		<div className="w-full">
			<Header
				title="创建钱包"
				showBack
				onBack={() => {
					onNavigate('main');
				}}
				className="mb-2 p-2 bg-white sticky top-0 z-9"
			/>
			{newMnemonic ? showMnemonic() : showCreateWalletForm()}
		</div>
	);
}
