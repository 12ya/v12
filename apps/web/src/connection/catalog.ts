import { createEnvironmentCatalogAtoms } from "@v12code/client-runtime/state/connections";

import { connectionAtomRuntime } from "./runtime";

export const environmentCatalog = createEnvironmentCatalogAtoms(connectionAtomRuntime);
