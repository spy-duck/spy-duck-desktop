import React, {
  ChangeEvent,
  ChangeEventHandler,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, ModalProps } from "@ui/components/modal";
import { UIButton } from "@ui/components/button";
import { List, ListItem } from "@ui/components/list";
import { Flex } from "@ui/components/flex";
import { Switch } from "@ui/components/switch";
import { Input } from "@ui/components/input";
import { useClashInfo } from "@/hooks/use-clash";
import { useVerge } from "@/hooks/use-verge";
import getSystem from "@/utils/get-system";
import { useMutation } from "@tanstack/react-query";
import { useRequest } from "ahooks";
import { showNotice } from "@/services/noticeService";

const OS = getSystem();

type TPortsForm = {
  mixedPort: number;
  socksPort: number;
  socksEnabled: boolean;
  httpPort: number;
  httpEnabled: boolean;
  redirPort: number;
  redirEnabled: boolean;
  tproxyPort: number;
  tproxyEnabled: boolean;
};

type PortSettingsModalProps = ModalProps;

export function PortSettingsModal({
  ...modalProps
}: PortSettingsModalProps): React.ReactElement {
  const { t } = useTranslation();
  const { clashInfo, patchInfo } = useClashInfo();
  const { verge, mutateVerge, patchVerge } = useVerge();

  const form = useForm<TPortsForm>({
    reValidateMode: "onBlur",
    defaultValues: {
      mixedPort: verge?.verge_mixed_port ?? clashInfo?.mixed_port ?? 7897,
      socksPort: verge?.verge_socks_port ?? 7898,
      socksEnabled: verge?.verge_socks_enabled ?? false,
      httpPort: verge?.verge_port ?? 7899,
      httpEnabled: verge?.verge_http_enabled ?? false,
      redirPort: verge?.verge_redir_port ?? 7895,
      redirEnabled: verge?.verge_redir_enabled ?? false,
      tproxyPort: verge?.verge_tproxy_port ?? 7896,
      tproxyEnabled: verge?.verge_tproxy_enabled ?? false,
    },
    resolver: zodResolver(
      z
        .object({
          mixedPort: z.number().min(0).max(65535),
          socksPort: z.number().min(0).max(65535),
          socksEnabled: z.boolean(),
          httpPort: z.number().min(0).max(65535),
          httpEnabled: z.boolean(),
          redirPort: z.number().min(0).max(65535),
          redirEnabled: z.boolean(),
          tproxyPort: z.number().min(0).max(65535),
          tproxyEnabled: z.boolean(),
        })
        .superRefine((val, ctx) => {
          const portList = [
            val.mixedPort,
            val.socksEnabled ? val.socksPort : -1,
            val.httpEnabled ? val.httpPort : -1,
            val.redirEnabled ? val.redirPort : -1,
            val.tproxyEnabled ? val.tproxyPort : -1,
          ];

          const keysMap = [
            "mixedPort",
            "socksPort",
            "httpPort",
            "redirPort",
            "tproxyPort",
          ];

          portList.forEach((port, index, arr) => {
            const i = arr.slice(index + 1).findIndex((p) => p === port);
            if (port != -1 && i !== -1) {
              ctx.addIssue({
                code: "custom",
                path: [keysMap[index]],
                message: "Port must be unique",
              });
              ctx.addIssue({
                code: "custom",
                path: [keysMap[index + i + 1]],
                message: "Port must be unique",
              });
            }
          });
        }),
    ),
  });

  const { loading, run: saveSettings } = useRequest(
    (params: {
      clashConfig: any;
      vergeConfig: Pick<
        IVergeConfig,
        | "verge_mixed_port"
        | "verge_socks_port"
        | "verge_socks_enabled"
        | "verge_port"
        | "verge_http_enabled"
        | "verge_redir_port"
        | "verge_redir_enabled"
        | "verge_tproxy_port"
        | "verge_tproxy_enabled"
      >;
    }) =>
      Promise.all([
        patchInfo(params.clashConfig),
        patchVerge(params.vergeConfig),
      ]),
    {
      manual: true,
      onSuccess: () => {
        modalProps.onClose();
        showNotice("success", t("Port settings saved"));
      },
      onError: () => {
        showNotice("error", t("Failed to save settings"));
      },
    },
  );

  useEffect(() => {
    if (modalProps.open) {
      form.reset();
    }
  }, [modalProps.open]);

  async function handlerSubmit(fields: TPortsForm) {
    const clashConfig = {
      "mixed-port": fields.mixedPort,
      "socks-port": fields.socksPort,
      port: fields.httpPort,
      "redir-port": fields.redirPort,
      "tproxy-port": fields.tproxyPort,
    };
    const vergeConfig = {
      verge_mixed_port: fields.mixedPort,
      verge_socks_port: fields.socksPort,
      verge_socks_enabled: fields.socksEnabled,
      verge_port: fields.httpPort,
      verge_http_enabled: fields.httpEnabled,
      verge_redir_port: fields.redirPort,
      verge_redir_enabled: fields.redirEnabled,
      verge_tproxy_port: fields.tproxyPort,
      verge_tproxy_enabled: fields.tproxyEnabled,
    };
    await saveSettings({ clashConfig, vergeConfig });
  }

  console.log(form.formState.errors);
  const sharedInputProps = {
    style: { maxWidth: 180 },
    min: 0,
    maxLength: 5,
    readOnly: loading,
    required: true,
  };

  function switchChangeHandler(field: any, inputName: keyof TPortsForm) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      if (loading) {
        e.preventDefault();
        return;
      }
      field.onChange(e.target.checked);
      if (e.target.checked) {
        window.requestAnimationFrame(() => {
          form.setFocus(inputName);
        });
      }
    };
  }

  return (
    <Modal {...modalProps} size="normal" closeOnDimmerClick={false}>
      <Modal.Header>Настройки портов</Modal.Header>
      <Modal.Content>
        <form
          id="settings-pots-form"
          onSubmit={form.handleSubmit(handlerSubmit)}
          noValidate
        >
          <List>
            <ListItem>
              <Flex
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={14}
              >
                {t("Mixed Port")}
                <Flex gap={14}>
                  <Input
                    {...form.register("mixedPort", {
                      valueAsNumber: true,
                    })}
                    error={form.formState.errors.mixedPort?.message}
                    {...sharedInputProps}
                  />
                  <Switch checked={true} onChange={() => null} disabled />
                </Flex>
              </Flex>
            </ListItem>
            <ListItem>
              <Flex
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={14}
              >
                {t("Socks Port")}
                <Flex gap={14}>
                  <Input
                    {...form.register("socksPort", {
                      valueAsNumber: true,
                      disabled: !form.watch("socksEnabled"),
                    })}
                    error={form.formState.errors.socksPort?.message}
                    {...sharedInputProps}
                  />
                  <Controller
                    name="socksEnabled"
                    control={form.control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value}
                        onChange={switchChangeHandler(field, "socksPort")}
                      />
                    )}
                  />
                </Flex>
              </Flex>
            </ListItem>
            <ListItem>
              <Flex
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                gap={14}
              >
                {t("Http Port")}
                <Flex gap={14}>
                  <Input
                    {...form.register("httpPort", {
                      valueAsNumber: true,
                      disabled: !form.watch("httpEnabled"),
                    })}
                    error={form.formState.errors.httpPort?.message}
                    {...sharedInputProps}
                  />
                  <Controller
                    name="httpEnabled"
                    control={form.control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value}
                        onChange={switchChangeHandler(field, "httpPort")}
                      />
                    )}
                  />
                </Flex>
              </Flex>
            </ListItem>
            {OS !== "windows" && (
              <ListItem>
                <Flex
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={14}
                >
                  {t("Redir Port")}
                  <Flex gap={14}>
                    <Input
                      {...form.register("redirPort", {
                        valueAsNumber: true,
                        disabled: !form.watch("redirEnabled"),
                      })}
                      error={form.formState.errors.redirPort?.message}
                      {...sharedInputProps}
                    />
                    <Controller
                      name="redirEnabled"
                      control={form.control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Switch
                          {...field}
                          checked={field.value}
                          onChange={switchChangeHandler(field, "redirPort")}
                        />
                      )}
                    />
                  </Flex>
                </Flex>
              </ListItem>
            )}
            {OS === "linux" && (
              <ListItem>
                <Flex
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={14}
                >
                  {t("Tproxy Port")}
                  <Flex gap={14}>
                    <Input
                      {...form.register("tproxyPort", {
                        valueAsNumber: true,
                        disabled: !form.watch("tproxyEnabled"),
                      })}
                      error={form.formState.errors.tproxyPort?.message}
                      {...sharedInputProps}
                    />
                    <Controller
                      name="tproxyEnabled"
                      control={form.control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Switch
                          {...field}
                          checked={field.value}
                          onChange={switchChangeHandler(field, "tproxyPort")}
                        />
                      )}
                    />
                  </Flex>
                </Flex>
              </ListItem>
            )}
          </List>
        </form>
      </Modal.Content>
      <Modal.Actions>
        <UIButton
          onClick={() => modalProps.onClose()}
          disabled={loading}
          secondary
        >
          Отмена
        </UIButton>
        <UIButton type="submit" form="settings-pots-form" loading={loading}>
          Сохранить
        </UIButton>
      </Modal.Actions>
    </Modal>
  );
}
