/* Leaflet's own styles travel with the slot, so every screen that shows the map
   has them — the place form opened straight from a link or from My posts too.
   Without them the map is not clipped and its tiles cover the page. */
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useEffect, useRef } from 'react';
import { attach, detach } from './runtime';

/* An empty slot the Leaflet container is moved into. React never renders
   children here, so it never fights Leaflet over this node. */
export function MapSlot({ loading }: { loading: string }) {
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = slot.current!;
    void attach(el);
    return () => detach(el);
  }, []);
  return <div className="lmapslot" ref={slot} data-loading={loading} />;
}
