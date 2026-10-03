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
			await createWallet(password);
			onNavigate('main');
		} catch (err) {
			setError('创建钱包失败，请重试');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full">
			<Header
				title="创建钱包"
				showBack
				onBack={() => {
					onNavigate('main');
				}}
				className="mb-2"
			/>
			<div className="space-y-4">
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
		</div>
	);
}
