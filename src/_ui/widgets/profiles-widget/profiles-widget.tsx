import React, { useMemo, useState } from "react";
import { useAppData } from "@/providers/app-data-provider";
import { TProxyGroup } from "@ui/types/proxy";
import { List, ListItem } from "@ui/components/list";
import { deleteConnection, updateProxy } from "@/services/api";
import { useVerge } from "@/hooks/use-verge";
import styles from "./profiles-widget.module.scss";
import { Box } from "@/_ui/components/box";
import { useProfiles } from "@/hooks/use-profiles";
import { ProfilesWidgetHeader } from "@ui/widgets/profiles-widget/profiles-widget-header";
import { ProfilesWidgetItem } from "@ui/widgets/profiles-widget/profiles-widget-item";

const STORAGE_KEY_GROUP = "clash-verge-selected-proxy-group";
const STORAGE_KEY_PROXY = "clash-verge-selected-proxy";

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

  return (
    <div className={styles.profilesWidget}>
      <ProfilesWidgetContext.Provider
        value={{
          selectedProxyGroup,
          selectedProxy,
        }}
      >
        <Box noPadding>
          <ProfilesWidgetHeader subscription={current} />
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
                  <ProfilesWidgetItem
                    group={group}
                    proxy={proxy}
                    onClick={handlerClickProxy}
                  />
                ))}
              </List>
            </div>
          ))}
        </Box>
      </ProfilesWidgetContext.Provider>
    </div>
  );
}
