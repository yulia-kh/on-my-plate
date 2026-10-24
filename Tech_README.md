# On My Plate — MVP

A tiny mobile-friendly food journal. Photo capture, optional AI food identification, editable food name, and local meal history. No accounts or database.

## Requirements
Node.js 20+.

## Run locally
```bash
cd on-my-plate
npm start
```
Open http://localhost:3000. No dependencies to install.

## Enable Gemini image recognition
Get a Gemini API key from https://aistudio.google.com/apikey (check quota/billing for your model).
Run locally: `GEMINI_API_KEY='YOUR_KEY' npm start`.
The browser calls `/api/identify`; only the backend calls Gemini. Never place the key in frontend code.

For Cloud Run, store the key in Secret Manager and grant the Cloud Run runtime service account Secret Manager Secret Accessor. Then deploy from this directory with:

```bash
gcloud run deploy on-my-plate --source . --region us-west1 --project on-my-plate-511920 --set-secrets=GEMINI_API_KEY=on-my-plate-gemini-key:latest
```

Create the Secret Manager secret `on-my-plate-gemini-key` first and grant the runtime identity access. For a public app, add authentication, abuse protection and request limits before enabling a paid API; this prototype has no rate limiting.

## Test checklist
1. Open on a computer; enter `Apple` and click Save meal. Refresh and confirm it remains.
2. Upload a photo; check preview; manually enter a food name and save.
3. Configure the API key; upload a photo and click Identify food with AI. Check the returned name and edit it if wrong.
4. Delete a meal and refresh; confirm it stays deleted.
5. Test multiple meals and an unsupported/poor-quality image. Verify errors are understandable.
6. On a phone, visit the app over an HTTPS deployment to test the camera. A localhost server on your computer is not automatically accessible from a phone.

## Testing with a teenager
Ask the tester to log 5–10 ordinary meals. Measure time from opening app to saved meal, AI errors, manual corrections, and any confusing steps. Use non-sensitive test photos and obtain appropriate consent. Don't collect glucose or insulin data in this prototype.

## Deployment
This is a Node HTTP server. Deploy to a hosting service supporting a persistent Node process, or adapt the `/api/identify` route to your chosen serverless provider before deploying on Vercel/Netlify. Use HTTPS, store API keys only in server-side environment variables, and add authentication, rate limits, quotas, and stronger privacy controls before sharing a public AI endpoint. The app has **not** been deployed by this project.

## Limitations
Meal history is stored in localStorage, including compressed photos, on one device. It can be erased by clearing browser data and is subject to storage limits. No syncing, account, carbohydrate calculations, or insulin recommendations. Image AI can be wrong. Not a medical device.

## License
AGPL-3.0 (project owner's chosen license; include the full license text before publishing the repository).
