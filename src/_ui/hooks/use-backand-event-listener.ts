import { DependencyList, useEffect } from "react";
import { EventCallback, listen, UnlistenFn } from "@tauri-apps/api/event";

export function useBackandEventListener<Payload>(
  event: string,
  handler: EventCallback<Payload>,
  deps: DependencyList,
) {
  useEffect(() => {
    let unlisten: UnlistenFn;
    listen<Payload>(event, handler)
      .then((unlistenFn) => (unlisten = unlistenFn))
      .catch(console.error);
    return () => unlisten?.();
  }, deps);
}
