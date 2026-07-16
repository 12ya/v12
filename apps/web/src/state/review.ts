import { createReviewEnvironmentAtoms } from "@v12code/client-runtime/state/review";

import { connectionAtomRuntime } from "../connection/runtime";

export const reviewEnvironment = createReviewEnvironmentAtoms(connectionAtomRuntime);
