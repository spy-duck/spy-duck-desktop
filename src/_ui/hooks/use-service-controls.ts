import { showNotice } from "@/services/noticeService";
import {
  restartCore,
  stopCore,
  uninstallService as uninstallServiceCmd,
  installService as installServiceCmd,
  isServiceAvailable,
} from "@/services/cmds";
import { useTranslation } from "react-i18next";
import { useSystemState } from "@/hooks/use-system-state";

export function useServiceControls() {
  const { t } = useTranslation();
  const { mutateRunningMode } = useSystemState();

  const uninstallService = async () => {
    try {
      showNotice("info", t("Stopping Core..."));
      await stopCore();
      showNotice("info", t("Uninstalling Service..."));
      await uninstallServiceCmd();
      showNotice("success", t("Service Uninstalled Successfully"));
      showNotice("info", t("Restarting Core..."));
      await restartCore();
      await mutateRunningMode();
    } catch (err: any) {
      showNotice("error", err.message || err.toString());
      try {
        showNotice("info", t("Try running core as Sidecar..."));
        await restartCore();
        await mutateRunningMode();
      } catch (e: any) {
        showNotice("error", e?.message || e?.toString());
      }
    }
  };

  const _waitForServiceReady = async () => {
    const isAvailable = await isServiceAvailable();
    if (!isAvailable) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(_waitForServiceReady());
        }, 1000);
      });
    }
  };

  const installService = async () => {
    await installServiceCmd();

    await _waitForServiceReady();

    await restartCore();

    await mutateRunningMode();

    return true;
  };

  return {
    uninstallService,
    installService,
  };
}
