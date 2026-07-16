import { createAuthEnvironmentAtoms } from "@v12code/client-runtime/state/auth";

import { connectionAtomRuntime } from "../connection/runtime";

export const authEnvironment = createAuthEnvironmentAtoms(connectionAtomRuntime);
