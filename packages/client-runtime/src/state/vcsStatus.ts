import type { EnvironmentId } from "@v12code/contracts";

export interface VcsStatusTarget {
  readonly environmentId: EnvironmentId | null;
  readonly cwd: string | null;
}
