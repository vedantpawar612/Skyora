# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Skyora — an Expo-managed React Native app (Expo 54, RN 0.81, React 19) providing a real-time AI yoga pose trainer. Firebase (Auth + Firestore + Storage) is the backend; navigation is React Navigation (native-stack + bottom-tabs).

## Commands

```bash
npm install           # install deps (postinstall stages the MediaPipe runtime into public/)
npm start             # expo start (dev server, QR for Expo Go)
npm run android       # launch on Android
npm run ios           # launch on iOS
npm run web           # launch in browser
npm run build:web     # expo export -p web → dist/
npm run electron:dev  # Metro web dev server + Electron pointed at it
npm run electron:preview  # build:web, then Electron against dist/
npm run dist:win      # build:web, then electron-builder NSIS installer → release/
npm run serve:dist    # build:web, then Firebase Hosting emulator on :5000 (validates firebase.json)
npm run deploy        # build:web, then firebase deploy --only hosting
npm run deploy:rules  # firebase deploy --only firestore:rules
```

Deploying needs `npx firebase login` once. Hosting serves the static `dist/` export from `firebase.json`; `firestore.rules` restricts every path to the owning `request.auth.uid`.

There is no test runner, linter, or typecheck configured — do not invent commands.

## Architecture

**Entry flow:** `index.js` → `App.js` (holds `onAuthStateChanged` listener) → either `AuthStack` (Login/Signup/ForgotPassword) or the authenticated app (`TabNavigator` with Home / PoseLibrary / Pranayam / Progress, plus modal stacks for PoseDetail, VideoPlayer, CameraSession, BreathingSession).

**State:** No Redux/MobX. Local component state + Firebase auth listener in `App.js`; session data persists through AsyncStorage and Firestore.

**Source layout (`src/`):**
- `config/` — `theme.js` (colors/spacing/fonts/shadows/animation — use these, don't hardcode), `firebase.js` (Firebase init with hardcoded keys for project `ai-yoga-trainer-b6cad`), navigation constants.
- `screens/` — one file per screen; `CameraSessionScreen.js` is the core feature.
- `components/` — reusable UI incl. `CameraSurface`, `FeedbackOverlay`, `SkeletonOverlay`, `GhostOverlay`, `StatCard`, `GradientButton`, `PoseCard`.
- `services/` — business logic lives here: `authService`, `firestoreService`, `poseEngine`, `poseDetectionService`, `poseComparisonService`, `angleCalculator`, `ttsService`, `targetPoseRenderer`. Prefer extending these over adding logic in screens.
- `data/` — static seed data (18+ yoga poses with target joint angles, pranayam exercises).
- `utils/helpers.js` — small shared helpers.

**Pose-detection pipeline:** camera frame → `poseEngine` (landmarks + joint angles) → `poseComparisonService` (vs target angles in `data/`) → dual overlay + `ttsService` voice cues. Skeleton uses the 33-point MediaPipe format.

**Platform-forked modules.** Metro picks `*.web.js` over `*.js` on web, so two pairs of files exist:
- `components/CameraSurface{,.web}.js` — native wraps expo-camera's `CameraView`; web owns its own `getUserMedia` `<video>` (expo-camera hides its element) and hands it to the engine via `onVideoReady`.
- `services/poseEngine{,.web}.js` — web runs **real MediaPipe detection**; native returns `poseDetectionService.generateDemoLandmarks()`. Both expose `init / attachVideo / setViewport / start / read / stop / dispose`, so `CameraSessionScreen` never branches on platform.

**Dual camera overlay system (`CameraSessionScreen`):**
- `SkeletonOverlay` — draws the *user's detected* skeleton (green/amber/red joints based on deviation).
- `GhostOverlay` — draws a translucent *target-pose silhouette* the user aligns into; joints color by deviation when in `matching` phase, all-green when `holding`.
- `targetPoseRenderer` (`buildTargetLandmarks` + `alignToUserBody`) — converts `pose.targetAngles` into 33 MediaPipe landmarks via 2D forward kinematics, then scales/translates them to match the user's detected torso position each frame.

**`targetPoseRenderer` has a round-trip invariant worth preserving:** `calculateAllAngles(buildTargetLandmarks(A))` must equal `A` for every pose in `data/poses.js` — currently exact (0° error on all 10). Each segment is placed by rotating the *same direction the joint angle is measured against* (`buildArm` rotates the shoulder→hip vector; `buildLeg` rotates the hip→shoulder vector), which is what makes it hold. Measuring a limb from absolute vertical instead silently reintroduces error, because the shoulder→hip line leans ~11°. If you touch this file, re-check the invariant — a broken ghost silhouette is easy to miss by eye but makes every pose unachievable.

Caveat: 8 unsigned angles cannot determine which way a joint folds, so deeply-bent poses (Chair, Bridge, Downward Dog) render an anatomically odd silhouette even though their angles are exact. Scoring is unaffected — it's angle-based.

**CameraSessionScreen state machine:** `positioning` (camera preview + ghost, no detection) → `matching` (live detection starts; must hold all-good joints for `GOOD_MS_TO_HOLD`) → `holding` (fill hold-progress bar for `pose.duration` seconds; drops back to `matching` after `BAD_MS_TO_BREAK` off-form) → `sessionComplete` (results screen). `phaseRef` is a ref that mirrors `phase` state, used inside `setInterval` callbacks to avoid stale closure.

Streak thresholds are **milliseconds, not frame counts**, because `DETECTION_INTERVAL_MS` differs by platform (100ms on web with real detection, 500ms for the native demo engine). Keep new thresholds time-based so both tick rates behave identically. When `poseEngine.read()` returns null (nobody in frame) the loop freezes scoring rather than feeding noise into the accuracy history, and shows a "step back" banner after `LOST_MS_TO_WARN`.

**Services are singletons:** `poseEngine`, `poseDetectionService`, `ttsService`, and `authService` are all exported as `new ClassName()` — one instance shared across the app. `ttsService` has a 5s same-message cooldown and 2.5s inter-message interval to prevent speech overlap.

**`poseComparisonService.comparePose`** scores each joint independently (deviation vs `pose.targetAngles`), status is `good` (≤15°), `close` (≤25°), or `bad` (>25°). Overall accuracy is the mean of per-joint accuracies. `ANGLE_THRESHOLD` / `CLOSE_THRESHOLD` constants are in that file.

## Non-Obvious Things

- **Pose detection is real on web/desktop, simulated on native.** `poseEngine.web.js` runs MediaPipe Tasks Vision against the live `<video>`. On native, `poseEngine.js` falls back to `poseDetectionService.generateDemoLandmarks()` because on-device ML needs a custom dev build (not Expo Go). Don't assume detection is "broken" in Expo Go — that fallback is intentional.
- **`public/pose-selftest.html` is a dev harness**, not part of the app. Open `/pose-selftest.html` on the web dev server (or `app://skyora/pose-selftest.html` in Electron) to exercise camera → MediaPipe → landmarks → joint angles with a live skeleton and an angle readout, without logging in. It duplicates the projection and angle math from `poseEngine.web.js` on purpose, so it stays useful when the app itself is broken. Safe to delete.
- **MediaPipe cannot be imported normally.** Its bundle contains a dynamic `import(expr)` that Metro refuses to bundle (`SyntaxError: Invalid call ... import(t.toString())`). Instead `scripts/copy-mediapipe-wasm.js` (run by `postinstall`) stages the WASM runtime *and* `vision_module.js` into `public/mediapipe/`, and `services/mediapipeLoader.web.js` pulls it in at runtime via a module `<script>` tag — outside the Metro graph. Everything is served locally so the desktop app works offline. Don't "fix" this by adding `@mediapipe/tasks-vision` to an import statement.
- **Two coordinate spaces in `poseEngine.web.js`.** Landmarks are returned in *viewport-normalized* space (projected through the same `object-fit: cover` transform the preview uses, so overlays line up), while joint angles are computed in *aspect-corrected* video space so they stay physically meaningful on any window shape. Overlays apply the selfie mirror themselves (`mirrorX`); the engine does not.
- **`ELECTRON_RUN_AS_NODE` breaks `electron`.** VS Code's integrated terminal exports it, which makes the Electron binary boot as plain Node and abort. Electron tests for the variable's *presence*, so it must be deleted, not blanked — hence `scripts/run-electron.js` instead of calling `electron` directly. `cross-env ELECTRON_RUN_AS_NODE=` does not work.
- **Electron serves the built app from `app://skyora/`** (see `electron/main.js`), registered as a privileged scheme so Firebase auth persistence (localStorage/IndexedDB) and MediaPipe's `fetch` of the WASM both work. Dev mode instead loads `ELECTRON_START_URL`.
- **`react-native-reanimated` is installed** but all current screens use RN's built-in `Animated` API. Don't mix the two in the same component.
- **Firebase keys are committed** in `src/config/firebase.js`. There is no `.env` — don't introduce one without asking.
- **Guest sign-in (`authService.signInAsGuest`)** uses Firebase anonymous auth so shared demo links work without an account. It fails with `auth/admin-restricted-operation` unless the Anonymous provider is enabled in Firebase Console → Authentication → Sign-in method. Anonymous users get a real `uid`, so `firestore.rules` and all progress writes work unchanged — but the account is per-browser and lost when site data is cleared.
- **Camera needs a secure context.** `navigator.mediaDevices` is undefined over plain HTTP on a LAN IP, so `http://192.168.x.x:8081` fails with a *TypeError*, which `CameraSurface.web.js` reports as the misleading "No camera available." Only `localhost`, `127.0.0.1`, or HTTPS work — Firebase Hosting is HTTPS, so deployed links are fine.
- **Video tutorials reference public URLs** (Unsplash thumbnails, Google Cloud Storage sample videos), not bundled assets.
- **Dark glassmorphic theme** throughout: primary `#6C63FF`, accent `#00D9A6`, background `#0A0E21`. Pull all styling tokens from `src/config/theme.js` (includes `COLORS`, `SPACING`, `BORDER_RADIUS`, `FONT_SIZES`, `FONTS`, `SHADOWS`, `ANIMATION`).
- **Permissions** are declared in `app.json`: iOS camera + speech recognition, Android CAMERA + RECORD_AUDIO.
- **`GhostOverlay` joints are colored via `jointResults`** from `comparePose`, keyed by joint name (`leftElbow`, `rightKnee`, etc.) not by landmark index. The component has its own `JOINT_TO_LANDMARK` map to translate.
