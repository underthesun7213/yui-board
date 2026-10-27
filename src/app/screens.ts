import { lazy } from 'react';

/* Screens split into their own chunks. The render check imports the same
   loaders, and preload() fetches them in the background after the first paint
   so switching tabs does not flash the loading state. */
export const loaders = {
  learn: () => import('../features/learn/LearnList'),
  lesson: () => import('../features/learn/Lesson'),
  collection: () => import('../features/learn/Collection'),
  map: () => import('../features/map/MapScreen'),
  cal: () => import('../features/calendar/Calendar'),
  event: () => import('../features/calendar/EventDetail'),
  placeForm: () => import('../features/write/PlaceForm'),
  eventForm: () => import('../features/write/EventForm'),
  weekForm: () => import('../features/write/WeekForm'),
  me: () => import('../features/me/MyItems'),
  report: () => import('../features/report/ReportSheet'),
  zoom: () => import('../features/learn/ComicZoom'),
};

export const LearnList = lazy(() => loaders.learn().then((m) => ({ default: m.LearnList })));
export const Lesson = lazy(() => loaders.lesson().then((m) => ({ default: m.Lesson })));
export const Collection = lazy(() => loaders.collection().then((m) => ({ default: m.Collection })));
export const MapScreen = lazy(() => loaders.map().then((m) => ({ default: m.MapScreen })));
export const Calendar = lazy(() => loaders.cal().then((m) => ({ default: m.Calendar })));
export const EventDetail = lazy(() => loaders.event().then((m) => ({ default: m.EventDetail })));
export const PlaceForm = lazy(() => loaders.placeForm().then((m) => ({ default: m.PlaceForm })));
export const EventForm = lazy(() => loaders.eventForm().then((m) => ({ default: m.EventForm })));
export const WeekForm = lazy(() => loaders.weekForm().then((m) => ({ default: m.WeekForm })));
export const MyItems = lazy(() => loaders.me().then((m) => ({ default: m.MyItems })));
export const ReportSheet = lazy(() => loaders.report().then((m) => ({ default: m.ReportSheet })));
export const ComicZoom = lazy(() => loaders.zoom().then((m) => ({ default: m.ComicZoom })));

export function preload() {
  for (const load of Object.values(loaders)) load().catch(() => {});
}
