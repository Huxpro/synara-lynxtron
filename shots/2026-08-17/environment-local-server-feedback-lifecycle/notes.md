# Environment Local Server Feedback Lifecycle

## Reliability gap

The stop-failure alert introduced in the preceding slice belonged to a
specific server process, but its state originally stored only a string.

If that process later exited and Refresh removed its row, the alert had no
ownership identity and could remain visible for a server that no longer
existed.

`lynx-environment-local-server-stale-feedback`: P1 state contribution
`1.00 -> 0.00`.

## Root fix

- Stop feedback now carries `{ pid, message }`.
- `retainLocalServerStopFeedback` retains an alert only while its target PID
  remains in the refreshed server list.
- The Environment effect clears feedback after that PID disappears.
- Feedback for a still-running resistant process remains available for retry.

## Focused contract

Executable focused tests prove:

- feedback is retained for server PID `42` while `[7, 42]` are present;
- feedback clears when the list becomes `[7]`;
- null feedback remains null.

The preceding runtime slice already proved the alert presenter and real
`stopped:false` message. The dynamic Refresh slice independently proved list
growth/shrink while the popup remains open. This slice closes the ownership
decision between those verified runtime boundaries without rerunning the
unstable resistant-server harness.

## Validation

- Focused Environment + lifecycle Rstest: `11/11` passed.
- Web production build passed with `8953` transformed modules.
- Web main SHA-256:
  `844311714c248e66218f5bf6ea2543471054602a265bfeeb5ebac62055348817`.
- Lynx-for-Web production build:
  `4592.7 kB`,
  SHA-256
  `bb8ee7bd1dd27ce25f70b54844148e334042b9609cec21bfd0e35e2c3001675a`.
- Native/Desktop production build:
  `4297.3 kB`,
  SHA-256
  `5102ed2b0cfe0c689b994191d64316f41ab28e87714dcb25d59251bcbd73358c`.
- Browser lifecycle remained `sessions: []` with zero agent-browser-owned
  processes.
