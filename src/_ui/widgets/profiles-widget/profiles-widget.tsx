import React, { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/providers/app-data-provider";
import { TProxyGroup } from "@ui/types/proxy";
import { List } from "@ui/components/list";
import styles from "./profiles-widget.module.scss";
import { Box } from "@/_ui/components/box";
import { ProfilesWidgetItem } from "@ui/widgets/profiles-widget/profiles-widget-item";
import { UIButton } from "@ui/components/button";
import { Icon } from "@ui/components/icon";
import {
  EVENT_CHANGE_PROXY,
  STORAGE_IS_PROXIES_INIT,
  STORAGE_KEY_GROUP,
  STORAGE_KEY_PROXY,
} from "@ui/consts";
import { forceUpdateProxiesCommand } from "@ui/commands/clash.commands";
import { setCurrentProxyCommand } from "@ui/commands/duck.commands";
import { showNotice } from "@/services/noticeService";
import { useBackandEventListener } from "@ui/hooks/use-backand-event-listener";
import { TEventPayloadChangeProxy } from "@ui/types";

export const ProfilesWidgetContext = React.createContext<{
  selectedProxyGroup: string | null;
  selectedProxy: string | null;
}>({
  selectedProxyGroup: null,
  selectedProxy: null,
});

type ProfilesWidgetProps = {};

export function ProfilesWidget({}: ProfilesWidgetProps): React.ReactElement {
  const { proxies, refreshProxy } = useAppData();

  const [selectedProxyGroup, setSelectedProxyGroup] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_GROUP);
  });
  const [selectedProxy, setSelectedProxy] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PROXY);
  });

  const [previousProxyGroup, setPreviousProxyGroup] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_GROUP);
  });
  const [previousProxy, setPreviousProxy] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PROXY);
  });

  const [isProxiesInitialized, setIsProxiesInitialized] = useState<boolean>(
    () => {
      return localStorage.getItem(STORAGE_IS_PROXIES_INIT) === "true";
    },
  );
  useBackandEventListener<TEventPayloadChangeProxy>(
    EVENT_CHANGE_PROXY,
    async (event) => {
      console.log(`Proxy changed event: `, event.payload);
      const { group, proxy } = event.payload;
      localStorage.setItem(STORAGE_KEY_GROUP, group);
      localStorage.setItem(STORAGE_KEY_PROXY, proxy);
      setPreviousProxyGroup(selectedProxyGroup);
      setPreviousProxy(selectedProxy);
      setSelectedProxyGroup(group);
      setSelectedProxy(proxy);
    },
    [],
  );

  async function handlerClickProxy(groupName: string, proxyName: string) {
    setSelectedProxyGroup(groupName);
    setSelectedProxy(proxyName);
    try {
      await setCurrentProxyCommand(groupName, proxyName);
    } catch (err: any) {
      setSelectedProxyGroup(previousProxyGroup);
      setSelectedProxy(previousProxy);
      showNotice("error", `Ошибка при переключении прокси: ${err.message}`);
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
    if (!isProxiesInitialized) {
      setTimeout(async () => {
        await forceUpdateProxiesCommand();
      }, 5000);

      // Fallback timeout on authorization
      setTimeout(() => {
        setIsProxiesInitialized(true);
        localStorage.setItem(STORAGE_IS_PROXIES_INIT, "true");
      }, 60000);
    }
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
