import React, { useState, MouseEvent, ChangeEvent, useEffect } from "react";
import { useVerge } from "@/hooks/use-verge";
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
import { intervalPromise } from "@ui/utils/interval-promise";

const LOCAL_STORAGE_TAB_KEY = "clash-verge-proxy-active-tab";

type TSystemProxy = "system" | "tun";

type ConnectionButtonProps = {};

export function ConnectionWidget({}: ConnectionButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const { verge, patchVerge, mutateVerge } = useVerge();
  const { isAdminMode, isServiceMode } = useSystemState();
  const { installService: installServiceAction } = useServiceControls();

  const changeConnectionState = useConnectionState(
    (state) => state.changeConnectionState,
  );

  const { enable_system_proxy, enable_tun_mode } = verge ?? {};

  const [systemProxyType, setSystemProxyType] = useState<TSystemProxy>(
    () =>
      (localStorage.getItem(LOCAL_STORAGE_TAB_KEY) as TSystemProxy | null) ||
      "system",
  );

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
          await updateProxyState({
            enable_system_proxy: false,
            enable_tun_mode: true,
          });
          changeConnectionState("connected");
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
    changeConnectionState(
      enable_system_proxy || enable_tun_mode ? "connected" : "disconnected",
    );
  }, []);

  const { mutateAsync: updateProxyState, isPending: isPendingConnecting } =
    useMutation({
      mutationFn: async (
        proxyState: Pick<
          IVergeConfig,
          "enable_system_proxy" | "enable_tun_mode"
        >,
      ) => {
        await intervalPromise(
          (async () => {
            await mutateVerge({ ...verge, ...proxyState }, false);
            await patchVerge(proxyState);
          })(),
          4000,
        );
      },
    });

  async function toggleConnection(e: MouseEvent) {
    e.preventDefault();
    const isConnecting = !enable_system_proxy && !enable_tun_mode;

    if (isConnecting) {
      changeConnectionState("connecting");
    }

    if (
      isConnecting &&
      systemProxyType === "tun" &&
      (isSidecarMode || !isTunAvailable)
    ) {
      installService();
    } else {
      await updateProxyState({
        enable_system_proxy:
          systemProxyType === "system" && !enable_system_proxy,
        enable_tun_mode: systemProxyType === "tun" && !enable_tun_mode,
      });
      changeConnectionState(isConnecting ? "connected" : "disconnected");
    }
  }

  async function toggleSystemProxyType(e: ChangeEvent<HTMLInputElement>) {
    setSystemProxyType(e.target.value as TSystemProxy);
    localStorage.setItem(LOCAL_STORAGE_TAB_KEY, e.target.value);

    if (enable_system_proxy || enable_tun_mode) {
      await updateProxyState({
        enable_system_proxy:
          e.target.value === "system" &&
          (enable_system_proxy || enable_tun_mode),
        enable_tun_mode:
          e.target.value === "tun" && (enable_system_proxy || enable_tun_mode),
      });
    }

    if (e.target.value === "tun") {
      await updateLocalStatus();
    }
  }

  const isSidecarMode = runningMode === "Sidecar";

  return (
    <div className={styles.connectionWidget}>
      <button
        className={clsx(
          styles.connectionWidgetButton,
          (enable_system_proxy || enable_tun_mode) &&
            styles.connectionWidgetButtonConnected,
        )}
        onClick={toggleConnection}
        disabled={isPendingConnecting || isPendingInstallService}
      >
        <Icon name="power-off" rotate={isPendingConnecting} />
      </button>

      {isPendingInstallService && (
        <div className={styles.connectionWidgetInstallationMessage}>
          <div className={styles.connectionWidgetInstallationMessageIcon}>
            <Icon name="gear" rotate />
          </div>
          <div>
            Устанавливается и настраивается системный сервис. <br />
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
              {systemProxyType === "system"
                ? t("System Proxy Info")
                : t("TUN Mode Intercept Info")}
            </p>
          </div>
        </div>
        <div className={styles.connectionWidgetProxySwitcherVariants}>
          <label>
            {t("System Proxy")}
            <input
              type="radio"
              name="system_proxy_type"
              value="system"
              onChange={toggleSystemProxyType}
              checked={systemProxyType === "system"}
              disabled={isPendingConnecting || isPendingInstallService}
            />
          </label>

          <label>
            VPN сервис
            <input
              type="radio"
              name="system_proxy_type"
              value="tun"
              onChange={toggleSystemProxyType}
              checked={systemProxyType === "tun"}
              disabled={isPendingConnecting || isPendingInstallService}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
