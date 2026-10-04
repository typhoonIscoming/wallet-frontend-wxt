/**
 * 通用 Header 组件，包含 Logo
 */
import React, { useContext } from 'react';
import logo from '@/public/wxt.svg';
import { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardPortal } from './hoverCard';
import RootContext from './rootContext';
import { POPUP, SIDEPANEL } from '@/utils/env';
import {
	saveAppMode,
	openPopupAndCloseSidePanel,
	openSidePanelAndClosePopup,
	type AppMode,
} from '@/utils/mode';

interface HeaderProps {
	title?: string;
	showBack?: boolean;
	onBack?: () => void;
	showRightIcon?: boolean;
	rightAction?: React.ReactNode;
	className?: string;
}

export default function Header({
	title,
	showBack,
	onBack,
	showRightIcon = true,
	rightAction,
	className,
}: HeaderProps) {
	const { mode } = useContext(RootContext);
	const switchMode = () => {
		// 切换模式逻辑
		if (mode === POPUP) {
			openSidePanelAndClosePopup();
			saveAppMode(SIDEPANEL as AppMode);
		} else {
			openPopupAndCloseSidePanel();
			saveAppMode(POPUP as AppMode);
		}
	};
	let right = null;
	if (React.isValidElement(rightAction)) {
		right = rightAction;
	}
	return (
		<div
			className={`header-wrapper w-full flex items-center justify-center ${className || ''}`}
			style={{ zIndex: 999 }}
		>
			<div className="flex-1 flex items-center">
				<div className="flex items-center gap-3">
					{showBack && onBack && (
						<div
							onClick={onBack}
							className="text-slate-400 cursor-pointer p-0 hover:text-accent transition-colors"
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
						</div>
					)}
					<img src={logo} alt="Logo" className="w-5 h-5" />
				</div>
				<div className="flex-1 flex justify-center items-center gap-2">
					{title && <div className="text-base font-semibold text-black-600">{title}</div>}
				</div>
			</div>
			{showRightIcon && (
				<HoverCard triggerMode="click">
					<HoverCardPortal>
						<HoverCardTrigger className="text-sm font-medium text-slate-700">
							<span className="cursor-pointer">
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
									className="lucide lucide-settings preview-icon"
								>
									<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							</span>
						</HoverCardTrigger>
						<HoverCardContent className="w-[150px] p-[8px]">
							<div className="space-y-2">
								<div
									className="flex cursor-pointer p-[4px] hover:bg-[#e8e8e8] items-center gap-2"
									onClick={switchMode}
								>
									<ArrowLeftRight />
									{mode === POPUP ? '侧边栏模式' : '弹窗模式'}
								</div>
								{right}
							</div>
						</HoverCardContent>
					</HoverCardPortal>
				</HoverCard>
			)}
		</div>
	);
}

function ArrowLeftRight() {
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
			className="lucide lucide-arrow-left-right preview-icon"
		>
			<path d="M8 3 4 7l4 4" />
			<path d="M4 7h16" />
			<path d="m16 21 4-4-4-4" />
			<path d="M20 17H4" />
		</svg>
	);
}
