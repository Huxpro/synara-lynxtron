# Environment Four Servers with Stop Alert at 320x200

## Newly combined state

Four real server rows were present while a harness-owned resistant server
produced the real stop-failure alert:

`Stop signal sent; the process is still shutting down.`

This combines the previously independent multi-server scroll and stop-feedback
states.

## Geometry

- popup:
  `288x184 @ (27,16)`, ending at `200`;
- alert:
  `274x23 @ (34,46)`, ending at `69`;
- server list:
  `274x124 @ (34,69)`;
- list `clientHeight=124`, `scrollHeight=174`;
- list `overflow-y: scroll`;
- four 42px rows remained mounted;
- page errors: none.

The alert consumes fixed space above the list, and the list flexes into the
remaining popup height instead of pushing the popup beyond the viewport.

## Classification

- `environment-local-servers-alert-scroll-composition`:
  missing coverage `1.00 -> 0.00`;
- product-loss contribution: `0.00 -> 0.00`;
- no code change was required.

The geometry probe observed one unrelated pending provider-discovery request.
It is not used as a new settled behavior pass. The alert's settled
`stopped:false` behavior was already proved with pending requests at zero in
the stop-feedback slice.

## Harness

- server instance:
  `0a954c8b-97f6-435f-9f38-0d384bb6bf5d`;
- post-fixture snapshot sequence: `2`;
- real ports:
  `8891`, `58171`, `58172`, `58173`;
- every auxiliary process was current-run owned;
- all five owned ports, browser sessions, and agent-browser-owned processes
  were clear at exit.
