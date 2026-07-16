import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";

import * as DesktopEnvironment from "./DesktopEnvironment.ts";
import * as DesktopConfig from "./DesktopConfig.ts";

const defaultInput = {
  dirname: "/repo/apps/desktop/dist-electron",
  homeDirectory: "/Users/alice",
  platform: "darwin",
  processArch: "arm64",
  appVersion: "0.0.22",
  appPath: "/Applications/V12.app/Contents/Resources/app.asar",
  isPackaged: false,
  resourcesPath: "/Applications/V12.app/Contents/Resources",
  runningUnderArm64Translation: false,
} satisfies DesktopEnvironment.MakeDesktopEnvironmentInput;

const makeEnvironmentLayer = (
  overrides: Partial<DesktopEnvironment.MakeDesktopEnvironmentInput> = {},
  env: Record<string, string | undefined> = {},
) =>
  DesktopEnvironment.layer({
    ...defaultInput,
    ...overrides,
  }).pipe(Layer.provide(Layer.mergeAll(NodeServices.layer, DesktopConfig.layerTest(env))));

const makeEnvironment = (
  overrides: Partial<DesktopEnvironment.MakeDesktopEnvironmentInput> = {},
  env: Record<string, string | undefined> = {},
) =>
  DesktopEnvironment.DesktopEnvironment.pipe(Effect.provide(makeEnvironmentLayer(overrides, env)));

describe("DesktopEnvironment", () => {
  it.effect("derives state paths and development identity inside Effect", () =>
    Effect.gen(function* () {
      const environment = yield* makeEnvironment(
        {},
        {
          V12_HOME: " /tmp/v12 ",
          V12_COMMIT_HASH: " 0123456789abcdef ",
          V12_PORT: "4949",
          VITE_DEV_SERVER_URL: "http://localhost:5173",
          V12_DEV_REMOTE_V12_SERVER_ENTRY_PATH: " /remote/server.mjs ",
          V12_OTLP_TRACES_URL: " http://127.0.0.1:4318/v1/traces ",
          V12_OTLP_EXPORT_INTERVAL_MS: "2500",
        },
      );

      assert.equal(environment.isDevelopment, true);
      assert.equal(environment.appDataDirectory, "/Users/alice/Library/Application Support");
      assert.equal(environment.baseDir, "/tmp/v12");
      assert.equal(environment.stateDir, "/tmp/v12/dev");
      assert.equal(environment.desktopSettingsPath, "/tmp/v12/dev/desktop-settings.json");
      assert.equal(environment.clientSettingsPath, "/tmp/v12/dev/client-settings.json");
      assert.equal(
        environment.savedEnvironmentRegistryPath,
        "/tmp/v12/dev/saved-environments.json",
      );
      assert.equal(environment.serverSettingsPath, "/tmp/v12/dev/settings.json");
      assert.equal(environment.logDir, "/tmp/v12/dev/logs");
      assert.equal(environment.browserArtifactsDir, "/tmp/v12/dev/browser-artifacts");
      assert.equal(environment.rootDir, "/repo");
      assert.equal(environment.appRoot, "/repo");
      assert.equal(environment.backendEntryPath, "/repo/apps/server/dist/bin.mjs");
      assert.equal(environment.backendCwd, "/repo");
      assert.equal(environment.appUserModelId, "com.v12.v12.dev");
      assert.equal(environment.linuxWmClass, "v12-dev");
      assert.deepEqual(
        Option.map(environment.devServerUrl, (url) => url.href),
        Option.some("http://localhost:5173/"),
      );
      assert.deepEqual(environment.devRemoteV12ServerEntryPath, Option.some("/remote/server.mjs"));
      assert.deepEqual(environment.configuredBackendPort, Option.some(4949));
      assert.deepEqual(environment.commitHashOverride, Option.some("0123456789abcdef"));
      assert.deepEqual(environment.otlpTracesUrl, Option.some("http://127.0.0.1:4318/v1/traces"));
      assert.equal(environment.otlpExportIntervalMs, 2500);
    }),
  );

  it.effect("derives production state paths under userdata", () =>
    Effect.gen(function* () {
      const environment = yield* makeEnvironment(
        {},
        {
          V12_HOME: "/tmp/v12",
        },
      );

      assert.equal(environment.isDevelopment, false);
      assert.equal(environment.stateDir, "/tmp/v12/userdata");
      assert.equal(environment.logDir, "/tmp/v12/userdata/logs");
      assert.equal(environment.browserArtifactsDir, "/tmp/v12/userdata/browser-artifacts");
      assert.equal(environment.serverSettingsPath, "/tmp/v12/userdata/settings.json");
    }),
  );

  it.effect("uses a configured app user model id override", () =>
    Effect.gen(function* () {
      const environment = yield* makeEnvironment(
        {},
        {
          V12_DESKTOP_APP_USER_MODEL_ID: " com.v12.v12.dev.local ",
          VITE_DEV_SERVER_URL: "http://localhost:5173",
        },
      );

      assert.equal(environment.appUserModelId, "com.v12.v12.dev.local");
    }),
  );

  it.effect("resolves picker defaults without nullish sentinels", () =>
    Effect.gen(function* () {
      const environment = yield* makeEnvironment();

      assert.deepEqual(environment.resolvePickFolderDefaultPath(null), Option.none());
      assert.deepEqual(
        environment.resolvePickFolderDefaultPath({ initialPath: " " }),
        Option.none(),
      );
      assert.deepEqual(
        environment.resolvePickFolderDefaultPath({ initialPath: "~" }),
        Option.some("/Users/alice"),
      );
      assert.deepEqual(
        environment.resolvePickFolderDefaultPath({ initialPath: "~/project" }),
        Option.some("/Users/alice/project"),
      );
    }),
  );
});
