import { create } from "zustand";

export type ConnectionState = "connecting" | "connected" | "disconnected";

export const useConnectionState = create<{
  connectionState: ConnectionState;
  changeConnectionState: (newState: ConnectionState) => void;
}>((set) => ({
  connectionState: "disconnected",
  changeConnectionState: (newState: ConnectionState) =>
    set((state) => ({ ...state, connectionState: newState })),
}));
