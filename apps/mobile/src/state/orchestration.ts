import { createOrchestrationEnvironmentAtoms } from "@v12code/client-runtime/state/orchestration";

import { connectionAtomRuntime } from "../connection/runtime";

export const orchestrationEnvironment = createOrchestrationEnvironmentAtoms(connectionAtomRuntime);
