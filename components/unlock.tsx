/**
 * 解锁页面组件
 */
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';
import { useState } from 'react';
import { useWalletStore } from '@/utils/wallet-store';

interface UnlockPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function UnlockPage({ onNavigate }: UnlockPageProps) {
	const { unlockWallet } = useWalletStore();
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onPasswordChange = (value: string) => {
		setPassword(value);
	};

	const onUnlock = () => {
		setLoading(true);
		setError(null);
		// 模拟解锁逻辑
		setTimeout(() => {
			unlockWallet(password)
				.then(() => {
					setPassword('');
					onNavigate('main');
				})
				.catch(() => {
					setError('密码错误');
				})
				.finally(() => {
					setLoading(false);
				});
		}, 1000);
	};

	return (
		<div className="min-h-full w-[360px] text-slate-100">
			<Header title="解锁钱包" className="p-2 bg-white sticky top-0" />
			<div className="px-2 pt-6 pb-4">
				<div className="text-sm text-gray-600 mb-2">请输入密码以解锁钱包</div>
				<div className="space-y-4">
					<div>
						<input
							type="password"
							placeholder="请输入密码"
							value={password}
							onChange={(e) => onPasswordChange(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
							className="w-full rounded-lg border border-gray-500 px-3 py-2 text-black text-sm focus:border-gray-500 focus:outline-none transition-colors"
							disabled={loading}
							autoFocus
						/>
					</div>

					{error && <div className="rounded-lg text-sm text-red-600">{error}</div>}

					<button
						className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={onUnlock}
						disabled={loading || !password}
					>
						{loading ? '解锁中...' : '解锁'}
					</button>
				</div>
			</div>
		</div>
	);
}
