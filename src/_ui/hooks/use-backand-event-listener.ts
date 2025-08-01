import { DependencyList, useCallback, useEffect } from "react";
import { EventCallback, listen, UnlistenFn } from "@tauri-apps/api/event";

export function useBackandEventListener<Payload>(
  event: string,
  handler: EventCallback<Payload>,
  deps: DependencyList,
) {
  const callback = useCallback(handler, deps);

  useEffect(() => {
    let unlisten: UnlistenFn;
    listen<Payload>(event, callback)
      .then((unlistenFn) => (unlisten = unlistenFn))
      .catch(console.error);
    return () => unlisten?.();
  }, [callback]);
}
