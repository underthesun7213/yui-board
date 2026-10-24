/* The YUNABI mark (assets/brand/yunabi-mark.svg). Light blue only shows well on
   navy, so it is only drawn on the navy header (design A, P3). */
export function Butterfly() {
  return (
    <svg className="mark" viewBox="52 84 408 330" aria-hidden="true" focusable="false">
      <defs>
        <g id="yn-half">
          <path
            d="M262 236C292 150 384 96 432 132C474 164 452 236 386 258C340 273 296 268 262 262Z"
            fill="#8ECDF2"
          />
          <path
            d="M276 238C304 176 368 140 404 160C432 177 420 222 376 238C344 249 306 248 276 246Z"
            fill="#C9E9FB"
          />
          <path
            d="M262 270C330 266 392 286 396 330C400 376 352 398 314 370C288 351 270 318 262 286Z"
            fill="#8ECDF2"
          />
          <path
            d="M276 284C322 284 366 300 368 330C370 356 342 366 320 350C300 336 286 312 276 292Z"
            fill="#C9E9FB"
          />
          <path
            d="M258 212C262 178 280 150 304 136"
            fill="none"
            stroke="#8ECDF2"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="306" cy="134" r="9" fill="#8ECDF2" />
        </g>
      </defs>
      <use href="#yn-half" />
      <use href="#yn-half" transform="translate(512 0) scale(-1 1)" />
      <rect x="247" y="204" width="18" height="152" rx="9" fill="#5FB3E6" />
    </svg>
  );
}
