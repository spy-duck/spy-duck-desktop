import React, { useState, MouseEvent, ChangeEvent, useEffect } from "react";
import { useVerge } from "@/hooks/use-verge";
import { useSystemState } from "@/hooks/use-system-state";
import styles from "./connection-widget.module.scss";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Icon } from "@ui/components/icon";
import { getRunningMode } from "@/services/cmds";
import { mutate } from "swr";

const LOCAL_STORAGE_TAB_KEY = "clash-verge-proxy-active-tab";

type TSystemProxy = "system" | "tun";

type ConnectionButtonProps = {};

export function ConnectionWidget({}: ConnectionButtonProps): React.ReactElement {
  const { verge, patchVerge, mutateVerge } = useVerge();
  const { isAdminMode } = useSystemState();
  const { t } = useTranslation();

  const { enable_system_proxy, enable_tun_mode } = verge ?? {};
  const [localServiceOk, setLocalServiceOk] = useState(false);
  const [systemProxyType, setSystemProxyType] = useState<TSystemProxy>(
    () =>
      (localStorage.getItem(LOCAL_STORAGE_TAB_KEY) as TSystemProxy | null) ||
      "system",
  );

  const isTunAvailable = localServiceOk || isAdminMode;

  const updateLocalStatus = async () => {
    try {
      const runningMode = await getRunningMode();
      const serviceStatus = runningMode === "Service";
      setLocalServiceOk(serviceStatus);
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

  async function updateProxyState(
    proxyState: Pick<IVergeConfig, "enable_system_proxy" | "enable_tun_mode">,
  ) {
    await mutateVerge({ ...verge, ...proxyState }, false);

    await patchVerge(proxyState);
  }

  async function toggleConnection(e: MouseEvent) {
    e.preventDefault();
    await updateProxyState({
      enable_system_proxy: systemProxyType === "system" && !enable_system_proxy,
      enable_tun_mode: systemProxyType === "tun" && !enable_tun_mode,
    });
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

  return (
    <div className={styles.connectionWidget}>
      <button
        className={clsx(
          styles.connectionWidgetButton,
          (enable_system_proxy || enable_tun_mode) &&
            styles.connectionWidgetButtonConnected,
        )}
        onClick={toggleConnection}
      >
        <Icon name="power-off" />
      </button>
      <div>
        <label>
          {t("System Proxy")}
          <input
            type="radio"
            name="system_proxy_type"
            value="system"
            onChange={toggleSystemProxyType}
            checked={systemProxyType === "system"}
          />
        </label>

        <br />
        <br />

        <label>
          {t("Tun Mode")}
          <input
            type="radio"
            name="system_proxy_type"
            value="tun"
            onChange={toggleSystemProxyType}
            checked={systemProxyType === "tun"}
          />
        </label>
        <p style={{ maxWidth: 300 }}>
          {systemProxyType === "system"
            ? t("System Proxy Info")
            : t("TUN Mode Intercept Info")}
        </p>
      </div>
    </div>
  );
}
