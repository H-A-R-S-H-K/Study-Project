# Push Notifications — setup

Durable in-app notifications work with no configuration (records + Socket.IO
`notification:new`). OS-level **push** additionally needs Firebase Cloud
Messaging on both ends.

## Backend
1. Create a Firebase project and a service account; download its JSON key.
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH` to the key's path (the file is
   git-ignored — never commit it).
3. On boot the server logs `Firebase Admin initialised`. If the var is unset or
   the file is unreadable, push is disabled and the app logs a warning but keeps
   working (in-app + socket only).

The six triggers all route through `notificationService.notify()`, which (1)
records the notification, (2) emits it over the socket, and (3) pushes via FCM.

## Mobile (`@react-native-firebase/*`)
- **Android**: place `google-services.json` in `android/app/` (git-ignored) and
  apply the Google Services Gradle plugin.
- **iOS**: place `GoogleService-Info.plist` in the iOS project, enable Push
  Notifications + Background Modes (Remote notifications) capabilities, and
  upload the APNs key to Firebase.
- The app calls `registerDeviceToken()` after login (`usePushRegistration`),
  keeps the token fresh via `onTokenRefresh`, and deregisters on logout.

## Triggers
`new_nearby_request`, `new_offer`, `offer_accepted`, `new_message`,
`booking_cancelled`, `ride_completed` (and `document_verified` from the admin
dashboard in Phase 10). Each carries a small `data` payload (`requestId`,
`chatId`, …) the client uses to deep-link.
