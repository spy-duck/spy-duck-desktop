import React, { useEffect, useRef, useState } from "react";
import styles from "./ip-info-widget.module.scss";
import { getIpInfo } from "@/services/api";
import { Box } from "@/_ui/components/box";
import { Icon } from "@/_ui/components/icon";
import { useConnectionState } from "@ui/state/connection";
import { useMutation } from "@tanstack/react-query";
import { intervalPromise } from "@ui/utils/interval-promise";
import * as Flags from "country-flag-icons/react/1x1";
import { useBackandEventListener } from "@ui/hooks/use-backand-event-listener";
import { TEventPayloadChangeProxy } from "@ui/types";
import { EVENT_CHANGE_PROXY } from "@ui/consts";

type IpInfo = Awaited<ReturnType<typeof getIpInfo>>;

type IpInfoWidgetProps = {};

export function IpInfoWidget({}: IpInfoWidgetProps): React.ReactElement {
  const ref = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectionState = useConnectionState((state) => state.connectionState);
  const [ipInfo, setIpInfo] = useState<IpInfo>({} as any);

  const { isPending, mutate } = useMutation({
    mutationFn: () => {
      clearTimeout(ref.current);
      return intervalPromise(getIpInfo(), 2000);
    },
    onSuccess: (data) => {
      setIpInfo(data);
      ref.current = setTimeout(mutate, 3 * 60 * 1000);
    },
    gcTime: 0,
    retry: 3,
    retryDelay: 1000,
  });

  useBackandEventListener<TEventPayloadChangeProxy>(EVENT_CHANGE_PROXY, async () => {
    setTimeout(() => mutate(), 1000);
  }, []);

  useEffect(() => {
    if (["connected", "disconnected"].includes(connectionState)) {
      setTimeout(() => mutate(), 5000);
    }
  }, [connectionState, mutate]);

  const Flag = Flags[ipInfo?.country_code?.toUpperCase() as keyof typeof Flags];

  return (
    <Box noPadding>
      <div className={styles.ipInfoWidget}>
        {Flag && (
          <div className={styles.ipInfoWidgetFlag}>
            <div className={styles.ipInfoWidgetFlagInset}>
              <Flag title={ipInfo?.country} className="" />
            </div>
          </div>
        )}
        {ipInfo?.ip && (
          <div className={styles.ipInfoWidgetRows}>
            <div>{ipInfo?.ip || "-"}</div>
            <small>{ipInfo?.country || "-"}</small>
          </div>
        )}
        <div>
          <button
            className={styles.ipInfoWidgetRefresh}
            onClick={async () => {
              mutate();
            }}
            disabled={isPending}
          >
            <Icon name="arrow-rotate-right" type="regular" rotate={isPending} />
          </button>
        </div>
      </div>
    </Box>
  );
}
