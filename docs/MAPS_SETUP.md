# Maps & Location — native setup

The app uses `react-native-maps` (Google Maps) and
`@react-native-community/geolocation` + `react-native-permissions`. These need
native configuration that lives in the (Phase 12) native projects. Documented
here so it isn't forgotten.

## Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<application ...>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="${GOOGLE_MAPS_API_KEY}" />
</application>
```
Provide `GOOGLE_MAPS_API_KEY` via `android/gradle.properties` (git-ignored) or CI
secrets — never commit the key.

## iOS (`ios/<App>/Info.plist`)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We use your location to show transport providers near you.</string>
```
And in `AppDelegate`, provide the Google Maps API key via
`GMSServices.provideAPIKey(...)` (react-native-maps iOS with Google provider).

## Design notes
- Coordinates are handled as `{ latitude, longitude }` (react-native-maps
  convention) in the UI and converted to GeoJSON `[lng, lat]` only at the API
  boundary (`toGeoJson`). This keeps the [lng, lat] footgun in exactly one place.
- The nearby search radius defaults to 15 km (rural distances); the server caps
  it at 100 km. Distances shown are **display only** — there is no fare logic.
- `LocationPicker` uses a fixed centre pin over a moving map (steadier than a
  draggable marker) and is reused for pickup/destination in Phase 5.
