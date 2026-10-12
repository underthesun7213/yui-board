import { Component, type ReactNode } from 'react';

/* A screen whose chunk fails to load (offline, or a deploy replaced the file)
   shows a message with a reload instead of a blank page. */
export class ScreenBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
