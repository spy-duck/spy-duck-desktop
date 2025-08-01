import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { EVENT_CHANGE_CONNECTION_STATE } from "@ui/consts";
import { ConnectionState, TEventPayloadState } from "../types";

export const useConnectionState = create<{
  connectionState: ConnectionState;
  changeConnectionState: (newState: ConnectionState) => void;
}>((set) => ({
  connectionState: "disconnected",
  changeConnectionState: (newState: ConnectionState) =>
    set((state) => ({ ...state, connectionState: newState })),
}));

listen<TEventPayloadState>(EVENT_CHANGE_CONNECTION_STATE, (event) => {
  useConnectionState.setState((state) => ({
    ...state,
    connectionState: event.payload.state,
  }));
}).then(() => console.log("[Duck] Listening to change connection state"));
