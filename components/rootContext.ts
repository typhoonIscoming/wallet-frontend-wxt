import { createContext } from 'react';
import { SIDEPANEL } from '@/utils/env';

export const initRootContext = {
	mode: SIDEPANEL,
};

const RootContext = createContext(initRootContext);

export default RootContext;
