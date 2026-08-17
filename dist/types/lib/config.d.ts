/** Stores all build-related configuration values used across fastlane runners. */
export declare class Config {
    isMac: boolean;
    appId: string;
    versionName: string;
    buildNumber: string;
    releaseNote: string;
    releaseNoteLanguage: string;
    matchRepository: string;
    matchPassword: string;
    matchKeychainPassword: string;
    appstoreConnectIssuerId: string;
    appstoreConnectKeyId: string;
    appstoreConnectKey: string;
    appstoreTeamId: string;
    serviceAccountPath: string;
    serviceAccountJson: string;
    skipWaitProcessing: string;
    flutterDir: string;
    androidDir: string;
    iosDir: string;
    buildExtra: string | null;
    aabDestPath: string;
    ipaDestPath: string;
    draft: string;
    platform: string;
    /** Main github action workspace absolute path. */
    workspaceDir: string;
    /** Flutter project absolute path. */
    pubspecDir: string;
    /** Bundle identifier for Android (defaults to appId) */
    androidAppId: string;
    /** Bundle identifier for iOS (defaults to appId) */
    iosAppId: string;
    /** Absolute path to the project's pubspec.yaml */
    pubspecPath: string;
    /** Flutter project name parsed from pubspec.yaml */
    pubspecName: any;
    /** Shared fastlane parameters applied to both Android and iOS builds. */
    baseOptions: Record<string, string | number>;
    /** Asserts that the specified input exists and is not empty. */
    static assertInput(name: string): void;
}
