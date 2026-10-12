import type { MyItem } from '../api/rpc';
import { createStore } from './store';

/* This browser's anonymous account and what it posted (ME-02). `mine` says
   which public places and events get edit and delete buttons. */
export interface Session {
  hasAccount: boolean;
  items: MyItem[] | null;
  minePlaces: Record<number, true>;
  mineEvents: Record<number, true>;
  /** framed in another page: writes are off (T-24) */
  framed: boolean;
  /** the server asked for a CAPTCHA on account creation (Y-S7) */
  captchaRequired: boolean;
  captchaReady: boolean;
  /** my_items could not be read */
  itemsError: boolean;
}
export const session = createStore<Session>({
  hasAccount: false,
  items: null,
  minePlaces: {},
  mineEvents: {},
  framed: false,
  captchaRequired: false,
  captchaReady: false,
  itemsError: false,
});
