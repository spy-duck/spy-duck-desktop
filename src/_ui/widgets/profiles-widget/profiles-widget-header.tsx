import styles from "@ui/widgets/profiles-widget/profiles-widget.module.scss";
import dayjs from "dayjs";
import { FORMAT } from "@ui/consts";
import { isNumber } from "lodash-es";
import { formatTraffic } from "@ui/utils/format-traffic";
import { Icon } from "@ui/components/icon";
import React, { MouseEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { intervalPromise } from "@ui/utils/interval-promise";
import { updateProfile } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import Twemoji from "react-twemoji";

type ProfilesWidgetHeaderProps = {
  subscription: IProfileItem | undefined;
};

export function ProfilesWidgetHeader({
  subscription,
}: ProfilesWidgetHeaderProps) {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);

  async function handlerClickUpdateProfile(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!subscription) {
      return;
    }
    setIsPending(true);
    try {
      await intervalPromise(
        updateProfile(subscription.uid, subscription.option),
        2000,
      );
      showNotice("success", t("Update subscription successfully"), 1000);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <header className={styles.profilesWidgetSubscriptionHeader}>
      <div className={styles.profilesWidgetSubscriptionHeaderInner}>
        <div className={styles.profilesWidgetSubscriptionHeaderTitle}>
          <Twemoji options={{ className: "twemoji" }}>
            {subscription?.name}
          </Twemoji>
        </div>
        <div className={styles.profilesWidgetSubscriptionHeaderParams}>
          <div>
            Истекает:{" "}
            {subscription?.extra?.expire
              ? dayjs.unix(subscription.extra.expire).format(FORMAT.DATETIME)
              : "-"}
          </div>
          {isNumber(subscription?.extra?.total) && (
            <div>
              {formatTraffic(subscription?.extra.download || 0)}/
              {formatTraffic(subscription?.extra.total || 0)}
            </div>
          )}
        </div>
      </div>
      <button onClick={handlerClickUpdateProfile} disabled={isPending}>
        <Icon name="arrow-rotate-right" rotate={isPending} />
      </button>
      <button
        className="last-child"
        onClick={() => {
          alert("Menu");
        }}
      >
        <Icon name="chevron-right" />
      </button>
    </header>
  );
}
