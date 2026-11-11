import { createStore } from './store';

/** usage statistics on (D40), for the switch on the terms screen; a store of
    its own so the first screen does not carry it */
export const stats = createStore<{ on: boolean }>({ on: true });
