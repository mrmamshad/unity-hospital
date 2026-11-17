# Lab report — Medislot / Unity Hospital

`Unity-Hospital-Lab-Report.pdf` is the printable report (A4, 24 pages). The cover is
**not** included — print it separately and bind it as page 1.

## Structure (same as the previous project's lab report)

| Pages | Section |
|---|---|
| 1–2 | Problem definition, objectives, system specification, project overview |
| 3–4 | Use case diagram + use case descriptions |
| 5–7 | Database — every table with its columns and constraints, stored procedures, RLS, ER diagram |
| 8–18 | Source code listings (auth → register/login → slots → book/visits → assistant queue/confirm/decline → KPIs → rewrite → leads RLS) |
| 19–24 | Screenshots of the running application (landing, portals, console) |

## Regenerate

Note: screenshots were captured from the current build and still show the
**Terafab** brand mark — the product is presented in this report as **Unity
Hospital**. Re-brand the app first if the screenshots also need renaming.

```bash
python3 presentation/report/build_report.py      # HTML
node /tmp/opencode/print_medislot_report.mjs     # A4 PDF with page numbers
```

`build_report.py` reads the real source files from the repository, so a code
change is reflected by re-running the two commands. Screenshots live in
`shots/` and are captured from the running app on the live database:

- Landings at `https://buildcamp.site` (rewritten `/`), register/login forms.
- Patient portal with a demo patient (`demo.patient@terafab.health`) and one
  real pending booking (#APT-0005, booked for the report).
- Hospital console with the seeded specialists, 252 slots and the queue.

## Notes

- Fonts: Liberation Sans (body) and DejaVu Sans Mono (code) — both ship with
  LibreOffice/Chromium on Linux, so the PDF is identical on any machine.
- Page numbers come from the print step (`N | Page`, bottom right), matching
  the previous report's footer.
- The use case and ER diagrams are inline SVG in `build_report.py`; edit the
  coordinates there to change the layout.
- `_style.html` reuses the print CSS from the TaskOrbit report verbatim, so the
  two reports have the same page design.
