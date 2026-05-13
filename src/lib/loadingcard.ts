/** No-op shim.

    The entrance flourish (spin + decaying bounce, then `card-landed` dispatch)
    now lives inside `card3d.ts` since three.js owns the card's transform.
    This file remains so main.ts's import keeps resolving; the function is a
    no-op. Remove the export and its callsite once main.ts is updated. */

export function initLoadingCard(): void {
  // intentionally empty — entrance handled by card3d.ts
}
