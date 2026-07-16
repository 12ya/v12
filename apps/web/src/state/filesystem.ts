import { createFilesystemEnvironmentAtoms } from "@v12code/client-runtime/state/filesystem";

import { connectionAtomRuntime } from "../connection/runtime";

export const filesystemEnvironment = createFilesystemEnvironmentAtoms(connectionAtomRuntime);
