import type { ModelSelection } from "@v12code/contracts";
import {
  getModelSelectionBooleanOptionValue,
  getModelSelectionStringOptionValue,
} from "@v12code/shared/model";

export function getCodexServiceTierOptionValue(
  modelSelection: ModelSelection | null | undefined,
): string | undefined {
  return (
    getModelSelectionStringOptionValue(modelSelection, "serviceTier") ??
    (getModelSelectionBooleanOptionValue(modelSelection, "fastMode") === true ? "fast" : undefined)
  );
}
