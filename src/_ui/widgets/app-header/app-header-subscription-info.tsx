import { useProfiles } from "@/hooks/use-profiles";
import React, { MouseEvent, useState } from "react";
import { intervalPromise } from "@ui/utils/interval-promise";
import { updateProfile } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";
import { FORMAT } from "@ui/consts";
import styles from "./app-header.module.scss";
import { Icon } from "@ui/components/icon";
import clsx from "clsx";

export function AppHeaderSubscriptionInfo() {
  const { t } = useTranslation();
  const {
    current,
    mutateProfiles,
  }: {
    current: IProfileItem | undefined;
    mutateProfiles: () => void;
  } = useProfiles();

  const [isPending, setIsPending] = useState(false);

  async function handlerClickUpdateProfile(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!current) {
      return;
    }
    setIsPending(true);
    try {
      await intervalPromise(updateProfile(current.uid, current.option), 2000);
      showNotice("success", t("Update subscription successfully"), 1000);
      mutateProfiles();
    } finally {
      setIsPending(false);
    }
  }
  const expirationDate = current?.extra?.expire
    ? dayjs.unix(current.extra.expire)
    : undefined;

  return (
    <div className={styles.appHeaderSubscription}>
      <div className={styles.appHeaderSubscriptionInner}>
        <div className={styles.appHeaderSubscriptionTitle}>{current?.name}</div>
        <div className={styles.appHeaderSubscriptionParams}>
          <div className={styles.appHeaderSubscriptionExpire}>
            Истекает:{" "}
            <span
              className={clsx(
                expirationDate &&
                  dayjs().isAfter(expirationDate) &&
                  styles.appHeaderSubscriptionExpireExpiried,
              )}
            >
              {expirationDate ? expirationDate.format(FORMAT.DATETIME) : "-"}
            </span>
          </div>
          {/*{isNumber(current?.extra?.total) && (*/}
          {/*  <div>*/}
          {/*    {formatTraffic(current?.extra.download || 0)}/*/}
          {/*    {formatTraffic(current?.extra.total || 0)}*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      </div>
      <button onClick={handlerClickUpdateProfile} disabled={isPending}>
        <Icon name="arrow-rotate-right" rotate={isPending} />
      </button>
    </div>
  );
}
