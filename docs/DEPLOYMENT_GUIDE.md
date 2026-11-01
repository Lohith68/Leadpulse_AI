# LEADPULSE AI – Production Deployment & Operations Guide

## 1. System Requirements & Prerequisites
- **Node.js:** Runtime version `v20.x` or `v22.x` (LTS recommended)
- **Package Manager:** `npm` (v10+) or `bun`
- **Firebase Project:** Google Cloud Firestore enabled in production mode
- **Cloud Environment:** Google Cloud Run, Firebase Hosting, or dedicated Node.js Linux instance

---

## 2. Environment Variables Configuration

Create a `.env` file in the project root based on `.env.example`:

```bash
# GEMINI_API_KEY: Optional Gemini API Key for AI narrative generation
GEMINI_API_KEY="your-gemini-api-key"

# APP_URL: Production URL of the hosted application
APP_URL="https://leadpulse-crm.aistudio-preview.run"

# VITE_FIREBASE_PROJECT_ID: Firebase project identifier
VITE_FIREBASE_PROJECT_ID="ai-studio-1791f9ed-f999-4a0b-a411-b32893a64c15"
```

*Security Note:* Never commit `.env` or service account credentials into version control.

---

## 3. Production Build Process

### Install Dependencies:
```bash
npm install
```

### Validate TypeScript & Linting:
```bash
npm run lint
```

### Run Full Test Suite:
```bash
npx vitest run
```

### Compile Production Assets:
```bash
npm run build
```
Compiled static assets are generated in `/dist`.

---

## 4. Firebase Cloud Firestore Deployment

### Deploy Security Rules:
Ensure Firestore security rules from `/firestore.rules` are deployed:
```bash
firebase deploy --only firestore:rules
```

### Compound Indexes:
Deploy required compound indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## 5. Database Initialization (Seeding)

Once the application is deployed, access the **Data Management Hub** (`/dataManagement`) to initialize the database:

1. **Benchmark Mode (Recommended for testing):**
   - Click **"Initialize Benchmark (200 Leads)"**.
   - Generates 50 Companies, 100 Contacts, 200 Leads, 60 Opportunities, and all 5 test anomalies.
   - Completes in ~3 seconds.

2. **Full Dataset Mode (Full Enterprise Scale):**
   - Click **"Generate Full Dataset (20,000 Leads)"**.
   - The resumable batch seeder will write in chunks of 300 records with exponential backoff.
   - Real-time progress is displayed on the UI.
   - Includes pause, resume, and cancel controls.

3. **Verify Persisted Records:**
   - Click **"Verify Server Counts (getCountFromServer)"**.
   - Validates that persisted document counts in Firestore match the expected configuration.

---

## 6. Troubleshooting Common Production Issues

### Issue A: Firestore Write Rate Limit (RESOURCE_EXHAUSTED / Quota)
- **Cause:** Exceeding 500 writes/sec burst limit on default tier.
- **Solution:** The batch seeder automatically batches &le; 300 writes and injects a 60ms delay. If encountering quota limits, the automatic exponential retry mechanism will back off for up to 3 retries.

### Issue B: Missing Module / Vite Build Failure
- **Cause:** Unresolved dynamic imports or circular references.
- **Solution:** Run `npm run build` locally to inspect rollup bundle output. All module routes are statically registered in `App.tsx`.

### Issue C: Unhandled Permission Denied in Firestore
- **Cause:** Security rules requiring authentication for write operations.
- **Solution:** Verify the user is authenticated via Google Auth or anonymous session before executing write batches.
