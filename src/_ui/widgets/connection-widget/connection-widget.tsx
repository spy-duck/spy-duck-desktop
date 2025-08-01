import React, { MouseEvent, ChangeEvent, useEffect } from "react";
import { useSystemState } from "@/hooks/use-system-state";
import styles from "./connection-widget.module.scss";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Icon } from "@ui/components/icon";
import { getRunningMode } from "@/services/cmds";
import { mutate } from "swr";
import { useConnectionState } from "@ui/state/connection";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServiceControls } from "@ui/hooks/use-service-controls";
import { useProxyState } from "@ui/hooks/use-proxy-state";
import {
  getConnectionModeCommand,
  setConnectionModeCommand,
  toggleConnectionCommand,
} from "@ui/commands/duck.commands";
import { EVENT_CHANGE_CONNECTION_MODE } from "@ui/consts";
import { TConnectionMode } from "@ui/types";
import { useBackandEventListener } from "@ui/hooks/use-backand-event-listener";
import { ServerMessageWidget } from "@ui/widgets/server-message-widget";
import { IpInfoWidget } from "@ui/widgets/ip-info-widget";

const LOCAL_STORAGE_TAB_KEY = "clash-verge-proxy-active-tab";

type ConnectionButtonProps = {};

export function ConnectionWidget({}: ConnectionButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const { isAdminMode, isServiceMode } = useSystemState();
  const { installService: installServiceAction } = useServiceControls();
  const {
    updateProxyState,
    isPendingConnecting,
    isEnabledSystemProxy,
    isEnabledTunMode,
  } = useProxyState();

  const connectionState = useConnectionState((state) => state.connectionState);

  const { data: connectionMode, refetch: refetchConnectionMode } = useQuery({
    queryKey: ["connectionMode"],
    queryFn: () => getConnectionModeCommand(),
  });

  const { data: runningMode, refetch: refetchRunningMode } = useQuery({
    queryKey: ["runningMode"],
    queryFn: () => getRunningMode(),
  });

  const { mutate: installService, isPending: isPendingInstallService } =
    useMutation({
      mutationKey: ["runningMode"],
      mutationFn: () => installServiceAction(),
      onSuccess: async (success) => {
        if (success) {
          console.log("Service installed and restarted successfully");
          await refetchRunningMode();
          await toggleConnectionCommand();
        }
      },
    });

  const isTunAvailable = isServiceMode || isAdminMode;

  const updateLocalStatus = async () => {
    try {
      const runningMode = await getRunningMode();
      const serviceStatus = runningMode === "Service";
      await mutate("isServiceAvailable", serviceStatus, false);
    } catch (error) {
      console.error("Failed to update TUN status:", error);
    }
  };

  useEffect(() => {
    updateLocalStatus().then(() => {
      console.debug("TUN status updated");
    });
  }, []);

  /**
   * Update connection mode when connection mode changed using tray
   */
  useBackandEventListener(EVENT_CHANGE_CONNECTION_MODE, async () => {
    await refetchConnectionMode();
  }, []);

  async function toggleConnection(e: MouseEvent) {
    e.preventDefault();
    const isConnecting = !isEnabledSystemProxy && !isEnabledTunMode;

    if (
      isConnecting &&
      (connectionMode === "tun" || connectionMode === "combine") &&
      (isSidecarMode || !isTunAvailable)
    ) {
      installService();
      return;
    }
    await toggleConnectionCommand();
  }

  async function handlerChangeConnectionMode(e: ChangeEvent<HTMLInputElement>) {
    await setConnectionModeCommand(e.target.value as TConnectionMode);
    await refetchConnectionMode();
    localStorage.setItem(LOCAL_STORAGE_TAB_KEY, e.target.value);

    if (isEnabledSystemProxy || isEnabledTunMode) {
      await updateProxyState({
        enable_system_proxy:
          e.target.value === "combine" ||
          (e.target.value === "system" &&
            (isEnabledSystemProxy || isEnabledTunMode)),
        enable_tun_mode:
          (e.target.value === "combine" || e.target.value === "tun") &&
          (isEnabledSystemProxy || isEnabledTunMode),
      });
    }

    if (e.target.value === "tun" || e.target.value === "combine") {
      await updateLocalStatus();
    }
  }

  const isSidecarMode = runningMode === "Sidecar";

  const isConnecting = isPendingConnecting || connectionState == "connecting";

  return (
    <div className={styles.connectionWidget}>
      <ServerMessageWidget />
      <button
        className={clsx(
          styles.connectionWidgetButton,
          connectionState === "connected" &&
            styles.connectionWidgetButtonConnected,
        )}
        onClick={toggleConnection}
        disabled={isConnecting || isPendingInstallService}
      >
        <Icon
          name={isConnecting ? "loader" : "power-off"}
          type={isConnecting ? "light" : "regular"}
          rotate={isConnecting}
        />
      </button>

      {isPendingInstallService && (
        <div className={styles.connectionWidgetInstallationMessage}>
          <div className={styles.connectionWidgetInstallationMessageIcon}>
            <Icon name="gear" rotate />
          </div>
          <div>
            Устанавливается и настраивается системная&nbsp;служба. <br />
            Это может занять некоторое время.
          </div>
        </div>
      )}
      <div className={styles.connectionWidgetProxySwitcher}>
        <div className={styles.connectionWidgetProxySwitcherLabel}>
          Режим работы
          <div className={styles.connectionWidgetProxySwitcherLabelPopup}>
            <Icon name="circle-info" />
            <p style={{ maxWidth: 300 }}>
              {connectionMode === "system"
                ? t("System Proxy Info")
                : t("TUN Mode Intercept Info")}
            </p>
          </div>
        </div>
        <div className={styles.connectionWidgetProxySwitcherVariants}>
          <label>
            VPN сервис
            <input
              type="radio"
              name="system_proxy_type"
              value="tun"
              onChange={handlerChangeConnectionMode}
              checked={connectionMode === "tun"}
              disabled={isConnecting || isPendingInstallService}
            />
          </label>

          <label>
            Прокси
            <input
              type="radio"
              name="system_proxy_type"
              value="system"
              onChange={handlerChangeConnectionMode}
              checked={connectionMode === "system"}
              disabled={isConnecting || isPendingInstallService}
            />
          </label>

          <label>
            Совместный
            <input
              type="radio"
              name="system_proxy_type"
              value="combine"
              onChange={handlerChangeConnectionMode}
              checked={connectionMode === "combine"}
              disabled={isConnecting || isPendingInstallService}
            />
          </label>
        </div>
      </div>
      <IpInfoWidget />
    </div>
  );
}
