# Skyora v2 — Recommended Improvements

## Context
Skyora is an Expo / React Native yoga trainer app (v1 built) that uses pose detection, angle-based comparison, and voice feedback. Backend is Firebase-only (Auth + Firestore + Storage). The user wants a prioritized list of improvements for v2, covering both frontend and backend.

Findings from v1 exploration:
- Solid structure: clean services ([src/services/](src/services/)), theme system ([src/config/theme.js](src/config/theme.js)), screen-per-file organization.
- Gaps: no tests, no TypeScript, no linting, hardcoded Firebase keys in [src/config/firebase.js](src/config/firebase.js), no real ML (pose detection simulated in Expo Go), no analytics, no caching, no i18n.

Below is the prioritized v2 plan. P0 = ship-blocker; P1 = high-value; P2 = polish / growth.

---

## Frontend Improvements

### P0 — Correctness & Safety
1. **Adopt TypeScript** incrementally.
   - Start with [src/services/](src/services/) (angleCalculator, poseComparisonService) — these are the highest-risk numeric logic.
   - Then [src/components/](src/components/), then screens.
   - Use `"allowJs": true` so migration is gradual.
2. **Add ESLint + Prettier + Husky pre-commit**.
   - Catches unused vars, React hooks misuse, inconsistent styles.
3. **Form validation** on [LoginScreen](src/screens/LoginScreen.js), [SignupScreen](src/screens/SignupScreen.js), [ForgotPasswordScreen](src/screens/ForgotPasswordScreen.js).
   - Use `react-hook-form` + `zod` for schema-based validation.

### P1 — UX & Performance
4. **Real pose detection** — replace simulation with `react-native-vision-camera` + `vision-camera-plugin-mediapipe` or on-device **TensorFlow Lite** (MoveNet / BlazePose). Requires a custom dev build (exit pure Expo Go).
5. **Skeleton overlay performance**:
   - Move rendering to `react-native-skia` (GPU-backed) instead of SVG on every frame.
   - Throttle via `useFrameProcessor` with `runAtTargetFps(10)`.
6. **Offline-first**:
   - Cache pose library + user progress in AsyncStorage (or MMKV for speed).
   - Queue Firestore writes when offline; flush on reconnect.
7. **Loading / empty / error states** for every screen (currently implicit).
8. **Haptics** on pose-held success (expo-haptics) — ties nicely with voice cues.

### P1 — Accessibility & Reach
9. **i18n** with `i18next` + `react-i18next`. Extract all strings from screens and [theme.js](src/config/theme.js) tone messages.
10. **Accessibility**: add `accessibilityLabel`, `accessibilityRole`, dynamic text scaling, and a high-contrast theme.
11. **Dark / light toggle** — theme is already centralized; just add a mode key in context.

### P2 — Polish
12. **Onboarding flow** — fitness level, goals, injury flags; personalizes pose recommendations.
13. **Session recording & playback** — save a low-res capture of the user with skeleton overlay for self-review.
14. **Gamification** — streaks, badges, weekly challenges (write to Firestore `users/{uid}/achievements`).
15. **Animations with Reanimated 3** — replace any Animated API remnants; smoother transitions.

---

## Backend Improvements

### P0 — Security
1. **Remove hardcoded Firebase keys** from [src/config/firebase.js](src/config/firebase.js). Move to `.env` via `expo-constants` + `app.config.js`. Commit `.env.example` only.
2. **Lock down Firestore security rules**:
   - `users/{uid}` — only owner reads/writes.
   - `poses/*` — public read, admin-only write.
   - `users/{uid}/progress/*` — owner only.
   - Add field-level validation (types, ranges).
3. **App Check** (Firebase App Check with Play Integrity / DeviceCheck) — blocks unauthorized SDK access.

### P1 — Architecture
4. **Cloud Functions** layer for:
   - Aggregating weekly progress stats (avoid client-side `getDocs` scans).
   - Server-side TTS generation & caching (reduce on-device TTS variance).
   - Email notifications on streak milestones.
5. **Firestore data model refinements**:
   - Add `progressSummary` doc per user, updated by a Cloud Function trigger on new session writes — avoids reading all sessions just to render the dashboard.
   - Denormalize pose metadata into progress docs for faster reads.
6. **Analytics** — Firebase Analytics + custom events (`session_started`, `pose_held`, `session_completed`, `accuracy_avg`).
7. **Crash reporting** — Sentry (React Native SDK) with source maps uploaded in EAS build.

### P1 — ML Pipeline Options
8. If on-device ML is too heavy: offload frames to a **Cloud Run / Cloud Functions** endpoint running MediaPipe BlazePose, return landmarks. Stream via WebSocket or chunked HTTP. Cost/latency tradeoff worth evaluating.

### P2 — Scale & Cost
9. **Caching** — enable Firestore offline persistence (`enableIndexedDbPersistence` equivalent for RN is built-in with the native SDK).
10. **Image / video CDN** — move Unsplash/GCS URLs to a signed Firebase Storage CDN path; add `expo-image` for aggressive client caching.
11. **Rate limiting** on Cloud Functions endpoints (Firebase App Check + per-UID quotas).
12. **Admin dashboard** (Next.js + Firebase Admin SDK) for managing the pose library, reviewing reports, broadcasting challenges.

---

## Testing & DX (both tiers)

1. **Unit tests** (Jest):
   - `angleCalculator` — known landmark fixtures → expected angles.
   - `poseComparisonService` — golden accuracy scores.
   - `authService` — error code mapping.
2. **Component tests** (`@testing-library/react-native`) for core screens.
3. **E2E** (Detox or Maestro) for the login → session flow.
4. **CI**: GitHub Actions workflow — lint, typecheck, test, EAS build on tag.
5. **EAS Update** (OTA) for fast hotfixes without app store round-trip.

---

## Suggested Sequence (8–10 weeks)

| Week | Focus |
|------|-------|
| 1 | TS setup on services, ESLint/Prettier, `.env` + Firestore rules, App Check |
| 2 | Unit tests for numeric/auth services, CI wired |
| 3 | Real pose detection via custom dev build (Vision Camera + MediaPipe) |
| 4 | Skia skeleton overlay, offline cache (MMKV) |
| 5 | Cloud Functions (progress summary, streaks), Analytics, Sentry |
| 6 | i18n, accessibility, dark/light toggle |
| 7 | Onboarding + gamification |
| 8 | E2E tests, EAS Update, polish |

---

## Critical Files Referenced

- [src/config/firebase.js](src/config/firebase.js) — secrets fix
- [src/config/theme.js](src/config/theme.js) — dark/light toggle foundation
- [src/services/angleCalculator.js](src/services/angleCalculator.js) — first target for tests + TS
- [src/services/poseComparisonService.js](src/services/poseComparisonService.js) — accuracy tests
- [src/services/poseDetectionService.js](src/services/poseDetectionService.js) — swap simulation for real ML
- [src/services/firestoreService.js](src/services/firestoreService.js) — add offline/caching
- [src/screens/CameraSessionScreen.js](src/screens/CameraSessionScreen.js) — performance gains
- [src/screens/LoginScreen.js](src/screens/LoginScreen.js), [SignupScreen.js](src/screens/SignupScreen.js) — form validation
- [App.js](App.js) — theme/i18n providers
- [CLAUDE.md](CLAUDE.md) — keep updated with each v2 change

---

## Verification

- `npm run typecheck` passes after TS migration batches.
- `npm test` — unit suite covers services with ≥80% line coverage.
- Firestore rules: run `firebase emulators:exec --only firestore "npm test"` with `@firebase/rules-unit-testing`.
- App Check: enable in Firebase Console → run an unauthenticated SDK call → confirm 403.
- Real pose detection: in a custom dev build, start a session → confirm overlay tracks actual body movement.
- Analytics: fire `session_started` from a test device → appears in Firebase Analytics DebugView within minutes.
- Sentry: force a throw in a dev build → event visible in Sentry dashboard with source-mapped stack.
