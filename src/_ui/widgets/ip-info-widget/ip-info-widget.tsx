import React, { useEffect, useState } from "react";
import styles from "./ip-info-widget.module.scss";
import { getIpInfo } from "@/services/api";
import { Box } from "@/_ui/components/box";
import { Icon } from "@/_ui/components/icon";
import { useConnectionState } from "@ui/state/connection";
import { useMutation, keepPreviousData } from "@tanstack/react-query";

const IP_REFRESH_SECONDS = 300;

type IpInfo = Awaited<ReturnType<typeof getIpInfo>>;

type IpInfoWidgetProps = {};

export function IpInfoWidget({}: IpInfoWidgetProps): React.ReactElement {
  const connectionState = useConnectionState((state) => state.connectionState);
  const [ ipInfo, setIpInfo ] = useState<IpInfo>({} as any);
  const { isPending, mutate } = useMutation({
    mutationFn: () => getIpInfo(),
    onSuccess: (data) => {
      setIpInfo(data);
      setTimeout(mutate, 5 * 1000);
    },
  });

  useEffect(() => {
    mutate();
  }, [mutate]);

  useEffect(() => {
    if (["connected", "disconnected"].includes(connectionState)) {
      setTimeout(() => mutate(), 2000);
    }
  }, [connectionState, mutate]);

  return (
    <Box noPadding>
      <div className={styles.ipInfoWidget}>
        <div className={styles.ipInfoWidgetRows}>
          <div>{ipInfo?.ip || "-"}</div>
          <small>{ipInfo?.country || "-"}</small>
        </div>
        <div>
          <button
            className={styles.ipInfoWidgetRefresh}
            onClick={async () => {
              mutate();
            }}
          >
            <Icon
              name="arrow-rotate-right"
              type="regular"
              rotate={isPending}
            />
          </button>
        </div>
      </div>
    </Box>
  );
}
