import { createTerminalEnvironmentAtoms } from "@v12code/client-runtime/state/terminal";

import { connectionAtomRuntime } from "../connection/runtime";

export const terminalEnvironment = createTerminalEnvironmentAtoms(connectionAtomRuntime);
