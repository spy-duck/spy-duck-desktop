import React, { useEffect } from "react";
import { useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIRoutes } from "@ui/routes";
import { BaseErrorBoundary, NoticeManager } from "@/components/base";
import { useInitApp } from "@ui/hooks/use-init-app";
import { AuthorizationScreen } from "@ui/screens/authorization";
import { useAuthorizationState } from "@ui/state/authorization";
import styles from "./layout.module.scss";
import { AppHeader } from "@ui/widgets/app-header";
import { AppFooter } from "@ui/widgets/app-footer";
import { useConnectionState } from "@ui/state/connection";
import { getVergeConfig } from "@/services/cmds";
import { ModalsProvider } from "@ui/components/modal/modals-global.ctx";

const SvgSprite = React.lazy(() => import("@ui/components/svg-sprite"));

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
        <ModalsProvider>
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
          <div id="overlay-modal-portal" />
        </ModalsProvider>
      </BaseErrorBoundary>
    </QueryClientProvider>
  );
}
