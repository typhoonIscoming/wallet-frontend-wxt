/**
 * 通用 Header 组件，包含 Logo
 */
import logo from '@/public/wxt.svg';

interface HeaderProps {
	title?: string;
	showBack?: boolean;
	onBack?: () => void;
	rightAction?: React.ReactNode;
}

export default function Header({ title, showBack, onBack, rightAction }: HeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				{showBack && onBack && (
					<button
						onClick={onBack}
						className="text-slate-400 hover:text-accent transition-colors"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</button>
				)}
				<div className="flex items-center gap-2">
					<img src={logo} alt="Logo" className="w-5 h-5" />
					{title && <div className="text-base font-semibold text-slate-100">{title}</div>}
				</div>
			</div>
			{rightAction && <div>{rightAction}</div>}
		</div>
	);
}
