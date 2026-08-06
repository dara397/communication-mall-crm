# Communication Mall CRM — deploy

This is the original app (quotes, orders, invoices, leads, pipeline, board,
purchase orders, catalog). The only change from your local copy: the folders
`src/lib` and `src/components` were renamed to `src/applib` and `src/appui`
(and imports updated) so GitHub stops filtering them out on upload. The app,
UX, and layout are otherwise identical.

## Upload (GitHub Desktop — reliable)
1. Put ALL the files in this folder at the ROOT of your GitHub repo.
2. Commit and push. Confirm `src/applib` and `src/appui` appear in the changes.

## Vercel settings (Environment Variables)
Set these to the values from your local .env file:
- DATABASE_URL  (your Neon database — the one with your data)
- AUTH_SECRET
- AUTH_TRUST_HOST = true
- ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
- RESEND_API_KEY, EMAIL_FROM (optional)
Root Directory: leave as default (the app is at the repo root).
Then Redeploy.

The database already exists and holds your data, so there is no DB setup to redo —
just point DATABASE_URL at it.
