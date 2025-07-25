import React, { useEffect, useRef } from "react";
import styles from "./auth-by-key-widget.module.scss";
import { Modal, ModalProps } from "@ui/components/modal";
import { UIButton } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { ApiFetchError, axiosClient } from "@ui/utils/api-fetch";

type TAuthByKeyForm = { subscriptionKey: string };

type AuthByKeyWidgetProps = ModalProps & {
  makeAuthData(): Promise<Record<string, string | undefined>>;
  onSuccess(data: { accessToken: string; subscription: string }): void;
};

export function AuthByKeyWidget({
  makeAuthData,
  onSuccess,
  ...modalProps
}: AuthByKeyWidgetProps): React.ReactElement {
  const form = useForm<TAuthByKeyForm>({
    resolver: zodResolver(
      z.object({
        subscriptionKey: z.url(),
      }),
    ),
    defaultValues: {
      subscriptionKey: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (authData: any) => {
      const response = await axiosClient.post<{
        accessToken: string;
        subscription: string;
      }>("/auth/by-key", authData);
      return response.data;
    },
    onSuccess,
    onError: (err: ApiFetchError) => {
      if (err.details) {
        form.setError("subscriptionKey", {
          message: `Ошибка[${err.details?.code}]: ${err.details?.error}`,
        });
      } else {
        form.setError("subscriptionKey", {
          message: `Ошибка: ${err.message}`,
        });
      }
    },
  });

  useEffect(() => {
    if (modalProps.open) {
      form.reset();
    }
  }, [modalProps.open]);

  async function handlerSubmit(fields: TAuthByKeyForm) {
    mutate({
      key: fields.subscriptionKey,
      ...(await makeAuthData()),
    });
  }

  return (
    <Modal {...modalProps} size="small">
      <Modal.Header>Вход по ключу</Modal.Header>
      <Modal.Content>
        <form
          id="auth-by-key-form"
          className={styles.authByKeyWidget}
          onSubmit={form.handleSubmit(handlerSubmit)}
          noValidate
        >
          <label htmlFor="subscription-key" style={{ marginRight: 14 }}>
            Введите ключ подписки:
          </label>
          <Input
            id="subscription-key"
            placeholder="https://spy-duck.com/key/..."
            {...form.register("subscriptionKey")}
            error={form.formState.errors.subscriptionKey?.message}
            readOnly={isPending}
            autoFocus
            required
          />
        </form>
      </Modal.Content>
      <Modal.Actions>
        <UIButton
          onClick={() => modalProps.onClose()}
          disabled={isPending}
          secondary
        >
          Отмена
        </UIButton>
        <UIButton type="submit" form="auth-by-key-form" loading={isPending}>
          Войти
        </UIButton>
      </Modal.Actions>
    </Modal>
  );
}
