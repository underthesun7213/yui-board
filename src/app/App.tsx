import { Suspense, useDeferredValue, useEffect } from 'react';
import { reload } from '../actions/app';
import { Home } from '../features/home/Home';
import { useT } from '../i18n/useT';
import { route, type Route } from '../state/route';
import { useStore } from '../state/useStore';
import { ScreenBoundary } from '../ui/ErrorBoundary';
import { Header } from '../ui/Header';
import { TabBar } from '../ui/TabBar';
import { Toast } from '../ui/Toast';
import { ROOTS } from './routes';
import { Calendar, Collection, EventDetail, LearnList, Lesson, MapScreen } from './screens';

function Screen({ r }: { r: Route }) {
  switch (r.name) {
    case 'home':
      return <Home />;
    case 'learn':
      return <LearnList />;
    case 'lesson':
      return <Lesson lid={r.lid} />;
    case 'collection':
      return <Collection />;
    case 'map':
      return <MapScreen />;
    case 'cal':
      return <Calendar />;
    case 'event':
      return <EventDetail id={r.id} date={r.date} />;
  }
}

export function App() {
  const m = useT();
  const nav = useStore(route, (s) => s);
  const current = nav.route.name;
  /* While a new screen's chunk loads, the old screen stays up instead of
     flashing "Loading" (store updates cannot be transitions themselves). */
  const deferred = useDeferredValue(nav);
  const shown = deferred.route;
  /* A tap starts the screen at the top once it is on screen (a tab tapped
     again too); system back keeps where the page was, as in v1.3. */
  useEffect(() => {
    if (deferred.taps) scrollTo(0, 0);
  }, [deferred.taps]);
  const failed = (
    <div className="chunkfail" role="alert">
      <p>{m.chunkFail}</p>
      <button className="primary" onClick={reload}>
        {m.reload}
      </button>
    </div>
  );
  return (
    <>
      <div id="statusfill" />
      <div id="app">
        {ROOTS.includes(current) && <Header />}
        <main id="main">
          <ScreenBoundary key={shown.name} fallback={failed}>
            <Suspense
              fallback={
                <p className="loading" data-route-loading="">
                  {m.loading}
                </p>
              }
            >
              <Screen r={shown} />
            </Suspense>
          </ScreenBoundary>
        </main>
      </div>
      <TabBar />
      <Toast />
    </>
  );
}
