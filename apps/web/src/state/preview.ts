import { createPreviewEnvironmentAtoms } from "@v12code/client-runtime/state/preview";

import { connectionAtomRuntime } from "../connection/runtime";

export const previewEnvironment = createPreviewEnvironmentAtoms(connectionAtomRuntime);
