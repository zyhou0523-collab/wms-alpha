# Known Issues

## Runtime

- The project currently does not include Maven Wrapper. Developers need Maven 3.8+ installed locally.
- Docker Compose currently starts MySQL only. Frontend and backend are intended to run locally during Alpha demos.

## Import / Export

- Current import/export is CSV based. Excel `.xlsx` multi-sheet support is planned.
- Inbound order import represents Sheet1 and Sheet2 by CSV sections.

## Auth and Security

- Demo passwords are plain demo values in seed data.
- No enterprise-grade RBAC, SSO, password encryption, or tenant isolation is implemented yet.

## Business Scope

- Inbound core demo flow is more complete than outbound.
- Outbound, VMI, RMA, inventory strategy, replenishment, cycle count, and label printing need further hardening.

## Data

- Seed data is for demonstration only.
- Re-running seed scripts resets demo data.

## Testing

- Automated backend test coverage is minimal.
- Frontend build passes, but there is no full end-to-end test suite yet.
