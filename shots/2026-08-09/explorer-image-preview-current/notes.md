# Explorer image preview current-head evidence

- Isolated server `ws://127.0.0.1:58900`, trusted Lynx-for-Web origin
  `http://127.0.0.1:9534`, server instance
  `0b7e3879-3bca-4e53-9938-a62a14573103`.
- Canonical project/thread use `/private/tmp/synara-explorer-image`.
- Selected `preview.png` resolves to
  `http://127.0.0.1:58900/api/local-image?...`, not the default 58090 endpoint.
- The HTTP route returns 200, `image/png`, 142 bytes, trusted-origin CORS, and
  `nosniff`.
- The real 32x24 fixture renders via `mode="aspectFit"` in a 375x682 image
  viewport. Both light and dark screenshots contain 51,324 exact red pixels and
  51,324 exact blue pixels.
- Relay records no `projects.readFile`, proving the binary image skips text
  decoding. One connection, zero pending requests, and no transport error.
- Both screenshots are 1280x820 and `page-errors.txt` is empty.
- Final focused verification: 8 tests, Native/Desktop and Lynx-for-Web builds,
  React Doctor changed-scope zero issues.
