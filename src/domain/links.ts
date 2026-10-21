/* The server's link rule (app.check_maps_url) for links the app opens. It is
   kept apart from validation.ts so the map chunk does not pull in the forms'
   code (bundle budget); tests/unit/domain.test.ts checks the two agree. */

/** A Google Maps link the server would also accept (app.check_maps_url, Y-S4, T-08), or null. */
export const safeMapsUrl = (u: string | null | undefined): string | null =>
  u &&
  [...u].length <= 500 &&
  /^https:\/\/((www\.)?google\.(com|co\.jp)\/maps([/?#]|$)|maps\.app\.goo\.gl\/)/.test(u) &&
  !/(\/|%2f)(\.|%2e){1,2}(\/|%2f|\?|#|$)/i.test(u) &&
  !/[\\\s]/.test(u)
    ? u
    : null;
