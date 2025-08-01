export type TConnectionMode = "system" | "tun" | "combine";
export type ConnectionState = "connecting" | "connected" | "disconnected";

export type TEventPayloadState = {
  state: ConnectionState;
};

export type TEventPayloadChangeProxy = {
  group: string;
  proxy: string;
};
