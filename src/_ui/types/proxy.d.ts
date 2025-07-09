export type TProxyGroup = {
  alive: boolean;
  all: TProxy[];
  "dialer-proxy": string;
  extra: Record<any, any>;
  hidden: boolean;
  history: any[];
  icon: string;
  interface: string;
  mptcp: boolean;
  name: string;
  now: string;
  "routing-mark": number;
  smux: boolean;
  testUrl: string;
  tfo: boolean;
  type: string;
  udp: boolean;
  uot: boolean;
  xudp: boolean;
};

export type TProxy = {
  alive: boolean;
  "dialer-proxy": string;
  extra: Record<any, any>;
  history: any[];
  id: string;
  interface: string;
  mptcp: boolean;
  name: string;
  "routing-mark": number;
  smux: boolean;
  tfo: boolean;
  type: "Vless";
  udp: boolean;
  uot: boolean;
  xudp: boolean;
};
