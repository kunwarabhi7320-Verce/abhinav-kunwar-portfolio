# Portfolio CMS (Sanity Studio)

The editor where projects for the portfolio are created, published and unpublished.
Full setup steps are in the main README → "Portfolio CMS (Sanity + Wistia)".

```bash
cp .env.example .env   # paste your Sanity Project ID
npm install
npm run dev            # http://localhost:3333
npm run deploy         # hosted Studio at https://<name>.sanity.studio
```

- `schemaTypes/project.js`: the Project fields, help text and validation
- `structure.js`: the left-hand menu (lists by gallery and format)
- `sanity.config.js` / `sanity.cli.js`: project settings, read from `.env`

Publishing uses Sanity's standard workflow: edits are drafts until you press **Publish**;
**Unpublish** takes a project off the website but keeps it as a draft.
