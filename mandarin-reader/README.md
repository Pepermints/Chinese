# 读中文 — Mandarin Reader (Expo scaffold)

This is a working Expo Router project implementing the 5 screens from the
prototype: menu, text list, add/edit text, no-pinyin character list, and
the reading view with pinyin + name highlighting + long-press modal.

## at the current stage - how to continue
to know: SDK v54 (not the latest v57 because app Expo Go on android does not have v57)

todo now: make the code of the app work

```bash
cd mandarin-reader/
npx expo start --tunnel
```
(on phone) on Expo go: scan QR code

to build android
```bash
npx expo prebuild --platform android --clean //claude says not to do that after the first one?
eas build --platform android --profile preview
```
it will ask for eas login (which is expo.dev logins): t.boulic@gmail.com and expo.dev password

then go to link provided, download .apk and install on phone



## how to debug
go to folder containing adb.exe
type into adress bar: ``powershell`` -- it will open powershell already in this folder

(the phone should be pre-configured: 1) in developper mode, 2) developer options with USB debugging 3) plug phone in and allow when asked if "Allow USB debugging")

then in powershell, type:
```bash
 .\adb devices
```

Result should be like:
List of devices attached
R58Xxxxxxxxxxx    device

on phone, go to right page of app (right before clicking on app)

in powershell: 
```bash
.\adb logcat *:E 2>$null
```
phone: immediately type on app to open

powershell: immediately CTRL C 

then search for error :
--------- beginning of crash
07-08 22:19:44.219 32573  6545 E AndroidRuntime: FATAL EXCEPTION: pool-2-thread-1
07-08 22:19:44.219 32573  6545 E AndroidRuntime: Process: com.pepermints.mandarinreader, PID: 32573


## how to connect to Claude
```bash
claude
```

use the url and copy paste it. then use the code given in the webaoge and copy paste it back 



## 0. installation and steps to get to production

## 1. Scaffold the project in your Codespace - done

Don't just drop these files into an empty folder — start from a real Expo
template so all the native config (Gradle, Xcode project stubs, Metro
config) is generated correctly, then overlay these files on top.

```bash
npx create-expo-app@latest mandarin-reader
cd mandarin-reader
```

Recent Expo SDKs already scaffold with the `app/` router directory and
`expo-router` wired up — check your generated `package.json` for
`expo-router` in dependencies and an `app/_layout.tsx` file. If it's not
there, follow Expo's "Install expo-router" guide before continuing.

Now copy every file from this scaffold (`app/`, `src/`, `app.json`,
`eas.json`, `tsconfig.json`) into your generated project, overwriting the
defaults.

## 2. Install dependencies -done

```bash
npx expo install expo-sqlite react-native-svg @shopify/flash-list
npx expo install lucide-react-native
npm install pinyin-pro opencc-js
```

`expo install` (rather than plain `npm install`) matters for
native-adjacent packages — it picks the version matched to your installed
Expo SDK.

## 3. Smoke-test the two risky integrations first -done (in test-libs.mjs)

Before wiring everything together, run these in isolation (a scratch
screen or a quick Node script) — they're the two spots called out in
`src/lib/pinyin.ts` and `src/lib/simplify.ts`:

- `getPinyinForText("你好吗")` — confirm the returned array length equals
  `Array.from("你好吗").length` and the tone numbers look right.
- `toSimplified("測試")` — confirm it returns `"测试"` synchronously,
  with no hanging promise or network call (this is the one most likely to
  need a fallback library under Metro — see the comment in that file).

## 4. Run it

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for an Android
emulator if your Codespace has one configured.

## 5. Build an APK to sideload (no store needed yet)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This uses the `preview` profile in `eas.json` (already configured for
`buildType: apk`) and runs entirely on Expo's cloud build servers — no
Android SDK needed in your Codespace. You'll get a download link for a
`.apk` you can install directly on a phone via `adb install` or by
opening the link on the device.

## 6. Build for the Play Store

```bash
eas build --platform android --profile production
```

Produces a signed `.aab` (Android App Bundle) — the format Google Play
requires. `eas submit --platform android` can upload it directly to Play
Console, or you can upload it manually.

You'll need:
- A Google Play Developer account ($25 one-time fee, ID-verified — start
  this early, verification can take 24-48h)
- A privacy policy URL (required even for an app that only stores data
  locally — state clearly that text/data never leaves the device)
- Google Play's Data Safety form filled out

Expo/EAS keeps the app's `targetSdkVersion` current with Play's yearly
requirement automatically as you stay on a recent Expo SDK — you don't
need to hand-edit Gradle files for this.

## 7. iOS, when you're ready

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Runs on Expo's cloud Mac builders — no local Mac required. You will still
need an active Apple Developer Program membership ($99/year) to submit,
which is unavoidable regardless of framework.

## Notes on what's simplified in this scaffold

- **Fonts**: `theme.hanziFont` is left as the OS default. To get the
  serif look from the original mockup, bundle a CJK serif font (e.g. Noto
  Serif SC) via `expo-font` and set that family name there.
- **Performance**: the reading screen virtualizes by paragraph via
  FlashList. If you expect single paragraphs of many hundreds of
  characters, consider chunking a paragraph into smaller flex-wrap groups
  so a single list item doesn't get too heavy.
- **Editing preserves `createdAt`**: the SQL `UPDATE` clause never
  touches `created_at`, so the placeholder passed during edits is
  harmless — just don't rely on that field being meaningful mid-edit.
