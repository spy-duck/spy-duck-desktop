import React, { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/providers/app-data-provider";
import { TProxyGroup } from "@ui/types/proxy";
import { List } from "@ui/components/list";
import { deleteConnection, updateProxy } from "@/services/api";
import { useVerge } from "@/hooks/use-verge";
import styles from "./profiles-widget.module.scss";
import { Box } from "@/_ui/components/box";
import { ProfilesWidgetItem } from "@ui/widgets/profiles-widget/profiles-widget-item";
import { UIButton } from "@ui/components/button";
import { Icon } from "@ui/components/icon";
import {
  STORAGE_IS_PROXIES_INIT,
  STORAGE_KEY_GROUP,
  STORAGE_KEY_PROXY,
} from "@ui/consts";

export const ProfilesWidgetContext = React.createContext<{
  selectedProxyGroup: string | null;
  selectedProxy: string | null;
}>({
  selectedProxyGroup: null,
  selectedProxy: null,
});

type ProfilesWidgetProps = {};

export function ProfilesWidget({}: ProfilesWidgetProps): React.ReactElement {
  const { verge } = useVerge();
  const { proxies, connections, refreshProxy } = useAppData();

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

  const [isProxiesInitialized, setIsProxiesInitialized] = useState<boolean>(
    () => {
      return localStorage.getItem(STORAGE_IS_PROXIES_INIT) === "true";
    },
  );

  async function handlerClickProxy(groupName: string, proxyName: string) {
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
        window.dispatchEvent(new CustomEvent("changed-proxy"));
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
  }

  const groups = useMemo(() => {
    return (proxies?.groups || []).filter(
      (group: TProxyGroup) => !group.hidden,
    );
  }, [proxies?.groups]);

  useEffect(() => {
    if (groups.length > 0) {
      setIsProxiesInitialized(true);
      localStorage.setItem(STORAGE_IS_PROXIES_INIT, "true");
    }
  }, [groups]);

  useEffect(() => {
    // Fallback timeout on authorization
    setTimeout(() => {
      setIsProxiesInitialized(true);
      localStorage.setItem(STORAGE_IS_PROXIES_INIT, "true");
    }, 60000);
  }, []);

  return (
    <div className={styles.profilesWidget}>
      <ProfilesWidgetContext.Provider
        value={{
          selectedProxyGroup,
          selectedProxy,
        }}
      >
        <Box noPadding>
          {groups.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                padding: 14,
              }}
            >
              {!isProxiesInitialized && (
                <>
                  <div>Загрузка подключений</div>
                  <Icon name="loader" type="light" size="huge" rotate />
                  <div>Это может занять некоторое времени...</div>
                </>
              )}
              {isProxiesInitialized && (
                <>
                  <div>Нет доступных подключений</div>
                  <UIButton onClick={() => refreshProxy()}>Обновить</UIButton>
                </>
              )}
            </div>
          )}
          {groups.map((group: TProxyGroup, i: number) => (
            <List key={i}>
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
              {group.all.map((proxy, index) => (
                <ProfilesWidgetItem
                  group={group}
                  proxy={proxy}
                  index={index}
                  onClick={handlerClickProxy}
                />
              ))}
            </List>
          ))}
        </Box>
      </ProfilesWidgetContext.Provider>
    </div>
  );
}
