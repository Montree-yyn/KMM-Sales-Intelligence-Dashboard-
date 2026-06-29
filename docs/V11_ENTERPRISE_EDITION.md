# V11 Enterprise Edition

## Summary

V11 Enterprise Edition is a controlled polish sprint on top of V10.1 Stable. It improves Thai UX, executive usability, settings/admin foundations, report center wording, export placeholder clarity, and mobile/tablet behavior while preserving the static dashboard architecture.

## Architecture Boundaries

- Static HTML, CSS, and JavaScript only.
- No backend.
- No npm workflow.
- No build step.
- No data contract change.
- `dashboard/data/dashboard_data.json` remains unchanged.
- `tools/update_dashboard.py` remains unchanged.

## Delivered Scope

- Thai remains the default language with improved static and JS-generated text coverage.
- Executive dashboard adds KPI help text and a "How to read this dashboard" panel.
- AI Summary and management recommendations use clearer Thai business wording.
- Settings page shows current user, role, company, version, and session timeout.
- Settings page includes user-management placeholder, About, Release Notes, and Help Center sections.
- Static credential warning remains visible and clear.
- Report Center buttons produce Thai static report previews for weekly, monthly, executive, and dealer review use cases.
- Export Center keeps CSV/PNG browser-safe foundations and Thai placeholders for PDF/PowerPoint.
- Shared CSS improves Thai font rendering, line height, wrapping, sidebar readability, button wrapping, and horizontal overflow protection.

## Security Limitation

V11 still uses static credentials delivered in browser JavaScript. This is temporary internal-use protection only. It protects casual access but is not real authentication because users can inspect delivered source code.

Future production authentication must use a real identity provider or server-side authentication with secure session/token validation, audit logs, password policy, and role claims.

## Report And Export Limitation

Reports are static browser previews generated from filtered local rows. PDF and PowerPoint exports are placeholders. CSV and PNG are browser-side foundations only and do not use a backend file service.

## Recommended Next Step

V12 should replace static credentials with real authentication before broader rollout, then define the export architecture for production PDF and PowerPoint board packs.
