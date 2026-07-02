# WMS Mobile Vmobile-v2.1 Release Notes

Release date: 2026-07-02

Branch: `release/wms-mobile-v2.1`

Tag: `Vmobile-v2.1`

## Scope

This release archives the current WMS mobile/PDA prototype as a stage version. It focuses on preserving the mobile work completed after the PC/mobile mixed iterations and keeping the mobile scope aligned with the current PC business baseline.

## Included Mobile Capabilities

- Mobile login and user profile.
- Mobile workbench with task cards and bottom navigation.
- Global warehouse selector in the mobile UI.
- Inbound expected arrival notice list and detail.
- Inbound SN collection by order and line.
- Inbound receiving and cancel-related mock support.
- Inbound SAP posting / retry mock support.
- Outbound shipping order list and detail.
- Outbound allocation, picking, shipping and reverse operation mock support.
- Outbound SAP posting / retry mock support.
- Inventory query and SN query.
- Lightweight inventory cycle count and inventory move prototype pages.
- Shared mobile request layer with mock/real API switch.
- Mobile scan input component and compact action button styling.

## Scope Alignment

The following mobile entries are intentionally not exposed in this version because they are not part of the current calibrated PC mobile scope:

- Independent inbound putaway / shelving operation.
- Independent outbound review operation.

Historical status values such as `ON_SHELF` may still exist in mock data for inventory/SN state compatibility, but they are not exposed as standalone mobile operations.

## Validation

Validated commands:

```bash
cd mobile
npm run build
```

Result:

- `vue-tsc --noEmit`: passed.
- `vite build`: passed.
- Mobile preview opened at `http://127.0.0.1:5176/home`.
- Checked common mobile widths: 375px, 390px and 414px.
- Main mobile routes opened successfully:
  - `/home`
  - `/inbound`
  - `/inbound/:id`
  - `/inbound/:orderId/sn-collect/:lineId`
  - `/inbound/:orderId/receive`
  - `/outbound`
  - `/outbound/:id`
  - `/outbound/:orderId/allocation`
  - `/outbound/:orderId/pick`
  - `/outbound/:orderId/ship`
  - `/inventory`
  - `/inventory/cycle-count`
  - `/inventory/move`
  - `/profile`

## Demo Entry

```bash
cd mobile
npm run dev
```

URL: `http://127.0.0.1:5176/home`

Demo account: `admin / admin123`

The mobile project runs in mock mode by default in local development.

## Known Issues

- The mobile side is still primarily mock-driven. Real backend replacement must be handled through the existing service/request layer.
- Inventory cycle count and inventory move are lightweight prototype flows. They can display demo data and submit user feedback, but they are not yet full inventory transaction closures.
- Inventory cycle count currently has a Vue runtime-only warning caused by a local component declared with a `template` option.
- Outbound shipping needs a dedicated demo order in picked-but-not-shipped state for smoother direct shipping demonstrations.
- The repository may contain unrelated PC-side local changes during parallel PC work. This mobile release only includes mobile release-scope changes.

## Next Recommended Work

P0:

- Prepare stable mobile demo data for outbound allocation -> picking -> shipping -> SAP posting.
- Prepare stable mobile demo data for inbound SN collection -> receiving -> SAP posting.
- Fix the cycle count Vue runtime warning.

P1:

- Add a reset-demo-data switch for repeatable demonstrations.
- Add lightweight mobile end-to-end regression scripts.
- Formalize real backend API switching for mobile service methods.

