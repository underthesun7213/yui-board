import { createStore } from './store';

export const net = createStore<{ online: boolean }>({ online: true });
