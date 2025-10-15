# Introduction
This Flutter package provides a one-step CI/CD solution for Flutter apps. For a project without any Fastlane setup, it automatically configures all necessary **Fastlane settings**, builds your **Android** and **iOS** apps, and deploys them to **Google Play** and the **App Store** with zero manual setup. Developers only need to provide **six essential configuration values** in GitHub Secrets.

> [!TIP]
> If you are new to Fastlane or CI/CD, use [GitHub Wiki - Basic-Settings](https://github.com/MTtankkeo/flutter-fastlane-action/wiki/Basic-Settings) to learn the basic concepts and usage, and follow along to apply them to your project.

### Tested And Supported Runners

| 🍎 OS Type        | ⚡ Status | ⏳ Average     |
| ----------------- | -------- | --------------- |
| macos-14          | 🟡       | Testing...      |
| macos-15 (latest) | 🟢       | 15 - 30 Minutes |
| macos-26          | 🟡       | Testing...      |

## Useage
Before using this action, the GitHub Actions runner must have the following setup:
- A Flutter SDK compatible with your app is installed and configured<br>[subosito/flutter-action](https://github.com/subosito/flutter-action)
- Java is installed for Android builds<br>[actions/setup-java](https://github.com/actions/setup-java)
- Android SDK is installed and properly configured<br>[android-actions/setup-android](https://github.com/android-actions/setup-android)
- SSH keys are configured to access your Fastlane match repository<br>[webfactory/ssh-agent](https://github.com/webfactory/ssh-agent)

### Example
> If you want to see an example or reference a template, check the [templates/deploy.yml](templates/deploy.yml) file.

```yml
- name: Deploy Android and iOS
  uses: MTtankkeo/flutter-fastlane-action@v1.0
  with:
    version-name: ${{ github.event.inputs.VERSION_NAME }}
    build-number: ${{ github.event.inputs.BUILD_NUMBER }}
    release-note: ${{ github.event.inputs.RELEASE_NOTE }}
    match-repository: {...}
    match-password: ${{ secrets.MATCH_PASSWORD }}
    appstore-connect-issuer-id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
    appstore-connect-key-id: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
    appstore-connect-key: ${{ secrets.APP_STORE_CONNECT_KEY }}
    appstore-team-id: ${{ secrets.APP_STORE_TEAM_ID }}
```

## GitHub Actions Inputs
These are the input parameters for the GitHub Actions workflow.

`🔹Required`

| Name | Description | Type |
| ---- | ----------- | ---- |
| app-id | Common app identifier for both platforms (optional if platform-specific IDs are provided) | String? |
| android-app-id | Application ID for Android | String? |
| ios-app-id | Application bundle identifier for iOS | String? |
| version-name🔹 | Version name for the build | String |
| build-number🔹 | Build number for the build | Number |
| release-note | Release note for the build | String? |
| release-note-language | Language code for the release note (e.g., 'en-US', 'ko-KR') | String? |
| match-repository🔹 | Repository for Fastlane match certificates | String  |
| match-password🔹 | Password for Fastlane match | String |
| match-keychain-password | Optional keychain password for Fastlane match | String? |
| appstore-connect-issuer-id🔹 | Issuer ID for App Store Connect API key | String  |
| appstore-connect-key-id🔹 | Key ID for App Store Connect API key | String  |
| appstore-connect-key🔹 | API key content for App Store Connect | String  |
| appstore-team-id🔹 | Team ID for the Apple Developer account | String  |
| service-account-path | File path to store the Google service account JSON | String? |
| service-account-json | Google service account JSON content for Play Store (Base64-encoded) | Base64? |
| skip-wait-processing | Skip waiting for build processing after upload (true/false). And corresponds to Fastlane skip_waiting_for_build_processing option | String? |
| flutter-dir | Directory of the Flutter project | String? |
| android-dir | Directory of the Android project | String? |
| ios-dir | Directory of the iOS project | String? |
