import React, { useMemo, useState } from "react";
import { useAppData } from "@/providers/app-data-provider";
import { TProxyGroup } from "@ui/types/proxy";
import { List, ListItem } from "@ui/components/list";
import { deleteConnection, updateProxy } from "@/services/api";
import { useVerge } from "@/hooks/use-verge";

const STORAGE_KEY_GROUP = "clash-verge-selected-proxy-group";
const STORAGE_KEY_PROXY = "clash-verge-selected-proxy";

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
    return proxies?.groups || [];
  }, [proxies?.groups]);

  return (
    <>
      <div>
        {groups.map((group: TProxyGroup, i: number) => (
          <div key={i}>
            {groups.length > 1 && (
              <div
                style={{
                  marginLeft: "1em",
                  marginBottom: "0.5em",
                  color: "var(--blue)",
                }}
              >
                {group.name}
              </div>
            )}
            <List>
              {group.all.map((proxy) => (
                <ListItem
                  key={proxy.id}
                  current={
                    group.name === selectedProxyGroup &&
                    proxy.name === selectedProxy
                  }
                  onClick={
                    proxy.name !== group.now
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
      </div>
    </>
  );
}
