import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { confirm } from "@tauri-apps/plugin-dialog";
import { Modal, ModalProps, useModal } from "@ui/components/modal";
import { Flex } from "@ui/components/flex";
import { Switch } from "@ui/components/switch";
import { useVerge } from "@/hooks/use-verge";
import { List, ListItem } from "@/_ui/components/list";
import { showNotice } from "@/services/noticeService";
import { useSystemState } from "@/hooks/use-system-state";
import { useLogout } from "@ui/hooks/use-logout";
import {
  exitApp,
  isServiceAvailable as isServiceAvailableCommand,
  restartCore as restartCoreCommand,
  uninstallService as uninstallServiceCommand,
} from "@/services/cmds";
import { DialogRef } from "@/components/base";
import { UpdateViewer } from "@/components/setting/mods/update-viewer";
import { useClashInfo } from "@/hooks/use-clash";
import { PortSettingsModal } from "@ui/widgets/settings-modal-widget/port-settings-modal";
import { updateGeoData } from "@/services/api";
import { disconnectCommand } from "@ui/commands/duck.commands";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Spinner } from "@ui/components/spinner";

type SettingsModalWidgetProps = ModalProps;

export function SettingsModalWidget({
  ...modalProps
}: SettingsModalWidgetProps): React.ReactElement {
  const { t } = useTranslation();
  const { verge, mutateVerge, patchVerge } = useVerge();
  const { isAdminMode } = useSystemState();
  const logout = useLogout();
  const { clashInfo } = useClashInfo();
  const { enable_auto_launch } = verge ?? {};
  const updateRef = useRef<DialogRef>(null);
  const { show: showPortSettings, props: portSettingsProps } = useModal();

  const { data: isServiceAvailable, refetch: refetchIsServiceAvailable } =
    useQuery({
      queryKey: ["isServiceAvailable"],
      queryFn: () => isServiceAvailableCommand(),
    });

  useEffect(() => {
    if (modalProps.open) {
      refetchIsServiceAvailable();
    }
  }, [modalProps.open]);

  const { mutate: restartCore, isPending: isPendingRestartCore } = useMutation({
    mutationFn: () => {
      return restartCoreCommand();
    },
    onSuccess: () => {
      showNotice("success", t("Clash Core Restarted"));
    },
    onError: (err: any) => {
      showNotice("error", err?.response.data.message || err.toString());
    },
  });

  const { mutate: uninstallService, isPending: isPendingUninstallService } =
    useMutation({
      mutationFn: () => {
        return uninstallServiceCommand();
      },
      onSuccess: () => {
        showNotice("success", t("Service Uninstalled Successfully"));
      },
      onError: (err: any) => {
        showNotice("error", err?.response.data.message || err.toString());
      },
    });

  async function handlerClickLogout(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const confirmation = await confirm(
      "Ваша подписка будет удалена из приложения на этом ПК",
      { title: "Подтвердите выход из аккаунта", kind: "warning" },
    );
    if (confirmation) {
      await logout();
    }
  }

  async function handlerClickExit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    await exitApp();
  }

  async function handlerClickCheckUpdates(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();
    try {
      const info = await checkUpdate();
      if (!info?.available) {
        showNotice("success", t("Currently on the Latest Version"));
      } else {
        updateRef.current?.open();
      }
    } catch (err: any) {
      showNotice("error", err.message || err.toString());
    }
  }

  async function handlerChangeAutostart(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    if (isAdminMode) {
      showNotice(
        "info",
        "Автоматический запуск может не поддерживаться в режиме администратора  .",
      );
    }
    try {
      // Trigger UI update first to see feedback immediately
      mutateVerge({ ...verge, enable_auto_launch: e.target.checked }, false);
      await patchVerge({ enable_auto_launch: e.target.checked });
      await mutate("getAutoLaunchStatus");
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      // If an error occurs, restore the original state
      mutateVerge({ ...verge, enable_auto_launch: !e.target.checked }, false);
      return Promise.reject(error);
    }
  }

  async function handlerClickUpdateGeo(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    try {
      await updateGeoData();
      showNotice("success", t("GeoData Updated"));
    } catch (err: any) {
      showNotice("error", err?.response.data.message || err.toString());
    }
  }

  async function handlerClickUninstallService(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();
    if (
      await confirm("Удаление системной службы", {
        title: "Подтвердите удаление",
        kind: "warning",
      })
    ) {
      try {
        await disconnectCommand();
        uninstallService();
      } catch (err: any) {
        showNotice("error", err?.response.data.message || err.toString());
      }
    }
  }

  async function handlerClickRestartService(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();
    restartCore();
  }

  return (
    <Modal {...modalProps} size="small" showCloseButton>
      <Modal.Header>Настройки</Modal.Header>
      <Modal.Content>
        <List>
          <ListItem>
            <Flex
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={14}
            >
              Запуск при включении
              <Switch
                checked={enable_auto_launch || false}
                onChange={handlerChangeAutostart}
              />
            </Flex>
          </ListItem>
          <ListItem onClick={() => showPortSettings()}>
            <Flex
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={14}
            >
              Порт
              <div>
                {verge?.verge_mixed_port ?? clashInfo?.mixed_port ?? 7897}
              </div>
            </Flex>
          </ListItem>
          <ListItem onClick={handlerClickUpdateGeo}>Обновить GeoData</ListItem>
          <ListItem onClick={handlerClickCheckUpdates}>
            Проверить обновление
          </ListItem>
          <ListItem
            onClick={handlerClickRestartService}
            disabled={
              !isServiceAvailable ||
              isPendingRestartCore ||
              isPendingUninstallService
            }
          >
            <Flex
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={14}
            >
              Перезапустить системную службу
              {isPendingRestartCore && <Spinner />}
            </Flex>
          </ListItem>
          <ListItem
            onClick={handlerClickUninstallService}
            disabled={!isServiceAvailable || isPendingUninstallService}
          >
            <Flex
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={14}
            >
              Удалить системную службу
              {isPendingUninstallService && <Spinner />}
            </Flex>
          </ListItem>
          <ListItem onClick={handlerClickLogout}>Удалить подписку</ListItem>
          <ListItem onClick={handlerClickExit}>Остановить приложение</ListItem>
        </List>
      </Modal.Content>
      <UpdateViewer ref={updateRef} />
      <PortSettingsModal {...portSettingsProps} />
    </Modal>
  );
}
