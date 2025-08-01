import React, { useEffect, useState } from "react";
import styles from "./server-message-widget.module.scss";
import { Box } from "@ui/components/box";
import { axiosClient } from "@ui/utils/api-fetch";
import { SERVER_MESSAGE_SOURCES, STORAGE_HIDDEN_MESSAGE_ID } from "@ui/consts";
import { Icon } from "@ui/components/icon";

type TMessage = {
  msgId: string;
  title: string;
  msg: string;
};

type ServerMessageWidgetProps = {};

export function ServerMessageWidget({}: ServerMessageWidgetProps): React.ReactElement | null {
  const [hiddenMessageId, setHiddenMessageId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_HIDDEN_MESSAGE_ID);
  });
  const [message, setMessage] = useState<TMessage | null>(null);

  useEffect(() => {
    setTimeout(async () => {
      const response = await Promise.race(
        SERVER_MESSAGE_SOURCES.map((url) => axiosClient.get<TMessage>(url)),
      );
      if (response.data?.msgId && response.data.msgId !== hiddenMessageId) {
        setMessage(response.data);
      }
    }, 5000);
  }, []);

  if (!message) {
    return null;
  }

  function handlerClickHide(e: React.MouseEvent<HTMLButtonElement>) {
    setHiddenMessageId(message!.msgId);
    localStorage.setItem(STORAGE_HIDDEN_MESSAGE_ID, message!.msgId);
    setMessage(null);
  }

  return (
    <Box className={styles.serverMessageWidget}>
      <button onClick={handlerClickHide}>
        <Icon name="xmark" />
      </button>
      {message.title && <b>{message.title}</b>}
      <p> {message.msg}</p>
    </Box>
  );
}
