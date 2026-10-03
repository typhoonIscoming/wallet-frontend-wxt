import React, {
	cloneElement,
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
	type HTMLAttributes,
	type ReactElement,
} from 'react';

export type HoverCardTriggerMode = 'hover' | 'click';

interface HoverCardContextValue {
	open: boolean;
	setOpen: (value: boolean) => void;
	triggerMode: HoverCardTriggerMode;
	openDelay: number;
	closeDelay: number;
	contentId: string;
	triggerRef: React.RefObject<HTMLElement | null>;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function cn(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(' ');
}

interface HoverCardProps {
	children: React.ReactNode;
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	triggerMode?: HoverCardTriggerMode;
	openDelay?: number;
	closeDelay?: number;
}

export function HoverCard({
	children,
	defaultOpen = false,
	open: controlledOpen,
	onOpenChange,
	triggerMode = 'hover',
	openDelay = 150,
	closeDelay = 150,
}: HoverCardProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const contentId = useRef(`hover-card-${Math.random().toString(36).slice(2, 9)}`).current;
	const triggerRef = useRef<HTMLElement | null>(null);

	const setOpen = (value: boolean) => {
		if (!isControlled) {
			setUncontrolledOpen(value);
		}
		onOpenChange?.(value);
	};

	return (
		<HoverCardContext.Provider
			value={{
				open,
				setOpen,
				triggerMode,
				openDelay,
				closeDelay,
				contentId,
				triggerRef,
			}}
		>
			{children}
		</HoverCardContext.Provider>
	);
}

interface HoverCardTriggerProps extends HTMLAttributes<HTMLElement> {
	asChild?: boolean;
	children: React.ReactNode;
}

export function HoverCardTrigger({
	children,
	asChild = false,
	className,
	...props
}: HoverCardTriggerProps) {
	const context = useContext(HoverCardContext);
	if (!context) {
		throw new Error('HoverCardTrigger must be used inside HoverCard');
	}

	const { open, setOpen, triggerMode, openDelay, closeDelay, triggerRef } = context;
	const timerRef = useRef<number | null>(null);
	const localTriggerRef = useRef<HTMLElement | null>(null);

	const mergedRef = (node: HTMLElement | null) => {
		localTriggerRef.current = node;
		if (typeof triggerRef === 'object' && triggerRef !== null) {
			(triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
		}
	};

	const clearTimer = () => {
		if (timerRef.current !== null) {
			window.clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	};

	const openCard = () => {
		clearTimer();
		if (triggerMode === 'hover') {
			timerRef.current = window.setTimeout(() => setOpen(true), openDelay);
			return;
		}
		setOpen(true);
	};

	const closeCard = () => {
		clearTimer();
		if (triggerMode === 'hover') {
			timerRef.current = window.setTimeout(() => setOpen(false), closeDelay);
			return;
		}
		setOpen(false);
	};

	const sharedProps = {
		...props,
		'aria-expanded': open,
		'aria-haspopup': 'dialog' as const,
		className: cn(className, 'outline-none'),
		onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
			props.onMouseEnter?.(event);
			if (triggerMode === 'hover') {
				openCard();
			}
		},
		onMouseLeave: (event: React.MouseEvent<HTMLElement>) => {
			props.onMouseLeave?.(event);
			if (triggerMode === 'hover') {
				closeCard();
			}
		},
		onFocus: (event: React.FocusEvent<HTMLElement>) => {
			props.onFocus?.(event);
			if (triggerMode === 'hover') {
				openCard();
			}
		},
		onBlur: (event: React.FocusEvent<HTMLElement>) => {
			props.onBlur?.(event);
			if (triggerMode === 'hover') {
				closeCard();
			}
		},
		onClick: (event: React.MouseEvent<HTMLElement>) => {
			props.onClick?.(event);
			if (triggerMode === 'click') {
				setOpen(!open);
			}
		},
	};

	useEffect(() => {
		return () => clearTimer();
	}, []);

	if (asChild && React.isValidElement(children)) {
		const child = children as ReactElement<any>;
		const clonedProps: Record<string, unknown> = {
			...sharedProps,
			...child.props,
			ref: mergedRef,
		};

		return cloneElement(child, clonedProps as any);
	}

	return (
		<div ref={mergedRef} {...sharedProps}>
			{children}
		</div>
	);
}

interface HoverCardContentProps extends HTMLAttributes<HTMLDivElement> {
	sideOffset?: number;
	align?: 'start' | 'center' | 'end';
	style?: CSSProperties;
}

export function HoverCardContent({
	children,
	className,
	sideOffset = 8,
	align = 'end',
	style,
	...props
}: HoverCardContentProps) {
	const context = useContext(HoverCardContext);
	if (!context) {
		throw new Error('HoverCardContent must be used inside HoverCard');
	}

	const { open, contentId, setOpen, triggerRef } = context;
	const ref = useRef<HTMLDivElement | null>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [arrowOffset, setArrowOffset] = useState(50);

	useEffect(() => {
		if (!open) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (!ref.current) return;
			const target = event.target as Node;
			if (!ref.current.contains(target) && !triggerRef.current?.contains(target)) {
				setOpen(false);
			}
		};

		window.addEventListener('mousedown', handlePointerDown);
		return () => window.removeEventListener('mousedown', handlePointerDown);
	}, [open, setOpen, triggerRef]);

	useLayoutEffect(() => {
		if (!open || !ref.current || !triggerRef.current) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();
		const contentWidth = ref.current.offsetWidth || 240;
		const padding = 8;
		const minLeft = padding;
		const maxLeft = window.innerWidth - contentWidth - padding;

		let nextLeft = triggerRect.left;
		if (align === 'center') {
			nextLeft = triggerRect.left + (triggerRect.width - contentWidth) / 2;
		} else if (align === 'end') {
			nextLeft = triggerRect.right - contentWidth;
		} else if (align === 'start') {
			nextLeft = triggerRect.left;
		}

		nextLeft = Math.min(Math.max(nextLeft, minLeft), maxLeft) + 12;
		const triggerCenterX = triggerRect.left + triggerRect.width / 2;
		const nextArrowOffset = Math.min(
			Math.max(triggerCenterX - nextLeft, 12),
			Math.max(contentWidth - 12, 12)
		);
		setPosition({
			top: triggerRect.bottom + sideOffset,
			left: nextLeft,
		});
		setArrowOffset(nextArrowOffset);
	}, [open, align, sideOffset, triggerRef]);

	if (!open) return null;

	return (
		<div
			ref={ref}
			id={contentId}
			role="dialog"
			aria-live="polite"
			style={{
				position: 'fixed',
				top: `${position.top}px`,
				left: `${position.left}px`,
				zIndex: 50,
				overflow: 'visible',
				...style,
			}}
			className={cn(
				'relative pointer-events-auto rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-xl shadow-slate-300/40',
				'animate-in fade-in-0 zoom-in-95',
				className
			)}
			{...props}
		>
			<div
				aria-hidden="true"
				style={{
					position: 'absolute',
					top: '-6px',
					left: `${arrowOffset}px`,
					width: '12px',
					height: '12px',
					background: 'white',
					borderLeft: '1px solid rgb(226 232 240)',
					borderTop: '1px solid rgb(226 232 240)',
					transform: 'translateX(-50%) rotate(45deg)',
					pointerEvents: 'none',
					zIndex: 0,
				}}
			/>
			<div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
		</div>
	);
}

export function HoverCardPortal({
	children,
	className,
	style,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			style={{
				position: 'relative',
				display: 'inline-block',
				...style,
			}}
			className={className}
			{...props}
		>
			{children}
		</div>
	);
}

export default HoverCard;
