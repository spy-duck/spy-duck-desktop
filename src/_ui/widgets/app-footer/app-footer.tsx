import React, { useRef } from "react";
import clsx from "clsx";
import { version } from "@root/package.json";
import { useClashInfo } from "@/hooks/use-clash";
import useSWRSubscription from "swr/subscription";
import { createAuthSockette } from "@/utils/websocket";
import { TrafficGraph, TrafficRef } from "@/components/layout/traffic-graph";
import parseTraffic from "@/utils/parse-traffic";
import { Icon } from "@ui/components/icon";
import { useConnectionState } from "@ui/state/connection";
import styles from "./app-footer.module.scss";

type AppFooterProps = {};

export function AppFooter({}: AppFooterProps): React.ReactElement {
  return (
    <footer className={styles.appFooter}>
      <div className={styles.appFooterInner}>
        <Traffic></Traffic>
        <div className={styles.appFooterVersion}>v{version}</div>
      </div>
    </footer>
  );
}

function Traffic() {
  const { clashInfo } = useClashInfo();
  const connectionState = useConnectionState((state) => state.connectionState);
  const trafficRef = useRef<TrafficRef>(null);

  const { data: traffic = { up: 0, down: 0 } } = useSWRSubscription<
    ITrafficItem,
    any,
    "getRealtimeTraffic" | null
  >(
    clashInfo ? "getRealtimeTraffic" : null,
    (_key, { next }) => {
      const { server = "", secret = "" } = clashInfo!;

      if (!server) {
        console.warn(
          "[Traffic] The server address is empty and the connection cannot be established.",
        );
        next(null, { up: 0, down: 0 });
        return () => {};
      }

      console.log(`[Traffic] Connecting: ${server}/traffic`);

      const s = createAuthSockette(`${server}/traffic`, secret, {
        timeout: 8000, // 8 seconds timeout
        onmessage(event) {
          const data = JSON.parse(event.data) as ITrafficItem;
          trafficRef.current?.appendData(data);
          next(null, data);
        },
        onerror(event) {
          console.error("[Traffic] WebSocket Connection Error", event);
          this.close();
          next(null, { up: 0, down: 0 });
        },
        onclose(event) {
          console.log("[Traffic] WebSocket Connection closed", event);
        },
        onopen(event) {
          console.log("[Traffic] WebSocket Connection established");
        },
      });

      return () => {
        console.log("[Traffic] Cleaning up WebSocket connections");
        try {
          s.close();
        } catch (e) {
          console.error("[Traffic] Error closing connection", e);
        }
      };
    },
    {
      fallbackData: { up: 0, down: 0 },
      keepPreviousData: true,
    },
  );

  const [up, upUnit] = parseTraffic(traffic.up);
  const [down, downUnit] = parseTraffic(traffic.down);

  return (
    <div className={styles.traffic}>
      <div className={styles.trafficStats}>
        <Icon name="arrow-up" />
        <div className={styles.trafficStatsDigit}>{up}</div>
        <div className={styles.trafficStatsUnit}>{upUnit}/s</div>

        <Icon name="arrow-down" />
        <div className={styles.trafficStatsDigit}>{down}</div>
        <div className={styles.trafficStatsUnit}>{downUnit}/s</div>
      </div>
      <div
        className={clsx(
          styles.trafficChart,
          connectionState === "connected" && styles.trafficChartVisible,
        )}
      >
        <TrafficGraph
          ref={trafficRef}
          upTrafficColor="#ff9500"
          downTrafficColor="#30b0c7"
        />
      </div>
    </div>
  );
}
