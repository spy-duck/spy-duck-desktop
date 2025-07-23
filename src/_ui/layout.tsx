import React, { useEffect } from "react";
import { useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIRoutes } from "@ui/routes";
import { BaseErrorBoundary, NoticeManager } from "@/components/base";
import { SvgSprite } from "@ui/components/svg-sprite";
import { useInitApp } from "@ui/hooks/use-init-app";
import { AuthorizationScreen } from "@ui/screens/authorization";
import { useAuthorizationState } from "@ui/state/authorization";
import styles from "./layout.module.scss";
import { AppHeader } from "@ui/components/app-header";
import { AppFooter } from "@ui/components/app-footer";
import { useConnectionState } from "@ui/state/connection";
import { useVerge } from "@/hooks/use-verge";
import { getVergeConfig } from "@/services/cmds";

const queryClient = new QueryClient();

export function UILayout() {
  const routes = useRoutes(UIRoutes);
  useInitApp();

  const changeConnectionState = useConnectionState(
    (state) => state.changeConnectionState,
  );

  useEffect(() => {
    setTimeout(async () => {
      const config = await getVergeConfig();
      const { enable_system_proxy, enable_tun_mode } = config ?? {};
      changeConnectionState(
        enable_system_proxy || enable_tun_mode ? "connected" : "disconnected",
      );
    }, 2000);
  }, []);

  const isAuthorized = useAuthorizationState((state) => state.isAuthorized);

  return (
    <QueryClientProvider client={queryClient}>
      <NoticeManager />
      <BaseErrorBoundary>
        <div className={styles.layout}>
          <div className={styles.layoutHeader}>
            <AppHeader />
          </div>
          <div className={styles.layoutContent}>
            {isAuthorized &&
              routes &&
              React.cloneElement(routes, { key: location.pathname })}
            {!isAuthorized && <AuthorizationScreen />}
          </div>
          <div className={styles.layoutFooter}>
            <AppFooter />
          </div>
        </div>
        <SvgSprite />
      </BaseErrorBoundary>
    </QueryClientProvider>
  );
}
