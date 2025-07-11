import React, { useMemo, useState, MouseEvent } from "react";
import { useAppData } from "@/providers/app-data-provider";
import { TProxyGroup } from "@ui/types/proxy";
import { List, ListItem } from "@ui/components/list";
import { deleteConnection, updateProxy } from "@/services/api";
import { useVerge } from "@/hooks/use-verge";
import styles from "./profiles-widget.module.scss";
import { Box } from "@/_ui/components/box";
import { useProfiles } from "@/hooks/use-profiles";
import { FORMAT } from "@ui/consts";
import { formatTraffic } from "@/_ui/utils/format-traffic";
import { isNumber } from "lodash-es";
import { Icon } from "@/_ui/components/icon";
import { updateProfile } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { intervalPromise } from "@ui/utils/interval-promise";

const STORAGE_KEY_GROUP = "clash-verge-selected-proxy-group";
const STORAGE_KEY_PROXY = "clash-verge-selected-proxy";

type ProfilesWidgetProps = {};

export function ProfilesWidget({}: ProfilesWidgetProps): React.ReactElement {
  const { verge } = useVerge();
  const { proxies, connections, refreshProxy } = useAppData();
  const {
    current,
  }: {
    current: IProfileItem | undefined;
  } = useProfiles();

  const [selectedProxyGroup, setSelectedProxyGroup] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_GROUP);
  });
  const [previousProxyGroup, setPreviousProxyGroup] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_GROUP);
  });

  const [selectedProxy, setSelectedProxy] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PROXY);
  });

  const [previousProxy, setPreviousProxy] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PROXY);
  });

  function handlerClickProxy(groupName: string, proxyName: string) {
    return async () => {
      setSelectedProxyGroup(groupName);
      setSelectedProxy(proxyName);
      try {
        await updateProxy(groupName, proxyName);

        await Promise.all(
          connections.data
            .filter((conn: any) => conn.chains.includes(previousProxyGroup))
            .map((conn: any) => {
              return deleteConnection(conn.id);
            }),
        );

        if (verge?.auto_close_connection && previousProxyGroup) {
          connections.data.forEach((conn: any) => {
            if (conn.chains.includes(previousProxyGroup)) {
              deleteConnection(conn.id);
            }
          });
        }

        localStorage.setItem(STORAGE_KEY_GROUP, groupName);
        localStorage.setItem(STORAGE_KEY_PROXY, proxyName);
        setPreviousProxyGroup(groupName);
        setPreviousProxy(groupName);

        setTimeout(async () => {
          await refreshProxy();
        }, 500);
      } catch (err) {
        setSelectedProxyGroup(previousProxyGroup);
        setSelectedProxy(previousProxy);
        if (previousProxyGroup) {
          localStorage.setItem(STORAGE_KEY_GROUP, previousProxyGroup);
        }
        if (previousProxy) {
          localStorage.setItem(STORAGE_KEY_PROXY, previousProxy);
        }
        console.error("Update agent failed", err);
      }
    };
  }

  const groups = useMemo(() => {
    return (proxies?.groups || []).filter(
      (group: TProxyGroup) => !group.hidden,
    );
  }, [proxies?.groups]);

  return (
    <div className={styles.profilesWidget}>
      <Box noPadding>
        <SubscriptionHeader current={current} />
        {groups.map((group: TProxyGroup, i: number) => (
          <div key={i}>
            <List attached>
              {groups.length > 1 && (
                <div
                  style={{
                    paddingLeft: "1em",
                    paddingBottom: "1em",
                    color: "var(--blue)",
                    paddingTop: "1em",
                    background: "var(--grey-100)",
                    borderTop: "1px solid var(--grey-200)",
                    borderBottom: "1px solid var(--grey-200)",
                  }}
                >
                  {group.name}
                </div>
              )}
              {group.all.map((proxy) => (
                <ListItem
                  key={i + proxy.id}
                  current={
                    group.name === selectedProxyGroup &&
                    proxy.name === selectedProxy
                  }
                  onClick={
                    group.name !== selectedProxyGroup ||
                    proxy.name !== selectedProxy
                      ? handlerClickProxy(group.name, proxy.name)
                      : undefined
                  }
                >
                  {proxy.name}
                </ListItem>
              ))}
            </List>
          </div>
        ))}
      </Box>
    </div>
  );
}

function SubscriptionHeader({
  current,
}: {
  current: IProfileItem | undefined;
}) {
  const { t } = useTranslation();
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
    } finally {
      setIsPending(false);
    }
  }

  return (
    <header className={styles.profilesWidgetSubscriptionHeader}>
      <div className={styles.profilesWidgetSubscriptionHeaderInner}>
        <div className={styles.profilesWidgetSubscriptionHeaderTitle}>
          {current?.name}
        </div>
        <div className={styles.profilesWidgetSubscriptionHeaderParams}>
          <div>
            Истекает:{" "}
            {current?.extra?.expire
              ? dayjs.unix(current.extra.expire).format(FORMAT.DATETIME)
              : "-"}
          </div>
          {isNumber(current?.extra?.total) && (
            <div>
              {formatTraffic(current?.extra.download || 0)}/
              {formatTraffic(current?.extra.total || 0)}
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
