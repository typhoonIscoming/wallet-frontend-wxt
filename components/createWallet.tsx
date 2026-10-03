import type { PopupRoute } from '@/entrypoints/background/types';
import { useState, useContext } from 'react';
import Header from './header';
import RootContext from './rootContext';
import { SIDEPANEL } from '@/utils/env';

interface CreateWalletProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function CreateWallet({ onNavigate }: CreateWalletProps) {
	const { mode } = useContext(RootContext);

	return (
		<div className="w-full">
			<Header
				title="创建钱包"
				showBack
				onBack={() => {
					onNavigate('main');
				}}
			/>
			<p>Create Wallet Page</p>
		</div>
	);
}
