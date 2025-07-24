import React, { useRef } from "react";
import { Modal, ModalProps } from "@ui/components/modal";
import { Flex } from "@ui/components/flex";
import { Switch } from "@ui/components/switch";
import { useVerge } from "@/hooks/use-verge";
import { List, ListItem } from "@/_ui/components/list";
import { showNotice } from "@/services/noticeService";
import { mutate } from "swr";
import { useSystemState } from "@/hooks/use-system-state";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useLogout } from "@ui/hooks/use-logout";
import { exitApp } from "@/services/cmds";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { DialogRef } from "@/components/base";
import { UpdateViewer } from "@/components/setting/mods/update-viewer";
import { useTranslation } from "react-i18next";

type SettingsModalWidgetProps = ModalProps;

export function SettingsModalWidget({
  ...modalProps
}: SettingsModalWidgetProps): React.ReactElement {
  const { t } = useTranslation();
  const { verge, mutateVerge, patchVerge } = useVerge();
  const { isAdminMode } = useSystemState();
  const logout = useLogout();
  const { enable_auto_launch } = verge ?? {};
  const updateRef = useRef<DialogRef>(null);

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
      console.log("HERE", e.target.checked);
      return Promise.resolve();
    } catch (error) {
      console.error(error);
      // If an error occurs, restore the original state
      mutateVerge({ ...verge, enable_auto_launch: !e.target.checked }, false);
      return Promise.reject(error);
    }
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
          <ListItem onClick={handlerClickCheckUpdates}>
            Проверить обновление
          </ListItem>
          <ListItem onClick={handlerClickLogout}>Удалить подписку</ListItem>
          <ListItem onClick={handlerClickExit}>Остановить приложение</ListItem>
        </List>
      </Modal.Content>
      <UpdateViewer ref={updateRef} />
    </Modal>
  );
}
