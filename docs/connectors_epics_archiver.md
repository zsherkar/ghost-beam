# EPICS Archiver Connector Stub

Ghost Beam includes a disabled read-only connector shape for future EPICS Archiver Appliance integration.

Current MVP behavior:

- No live EPICS connection
- No Archiver Appliance network calls
- No PV discovery
- No PV writes
- No hardware control
- No runtime dependency on `pyarchappl`

Future approved connector shape:

- `get_pv_window(pv_names, start, end)` for archived PV history
- `get_pv_at_time(pv_names, at)` for timestamped read-only snapshots
- `status()` for configuration and safety state

The connector is intended only for archived PV context. It is not part of the live synthetic JAX demo, and it cannot apply control actions.
