import React from "react";
import { useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIRoutes } from "@ui/routes";
import { BaseErrorBoundary } from "@/components/base";
import { SvgSprite } from "@ui/components/svg-sprite";
import { useInitApp } from "@ui/hooks/use-init-app";
import styles from "./layout.module.scss";
import { AuthorizationScreen } from "@ui/screens/authorization";
import { useAuthorizationState } from "@ui/state/authorization";

const queryClient = new QueryClient();

export function UILayout() {
  const routes = useRoutes(UIRoutes);

  useInitApp();

  const isAuthorized = useAuthorizationState((state) => state.isAuthorized);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.layout}>
        <div className={styles.layoutHeader}></div>
        <div className={styles.layoutContent}>
          <BaseErrorBoundary>
            {isAuthorized &&
              routes &&
              React.cloneElement(routes, { key: location.pathname })}
            {!isAuthorized && <AuthorizationScreen />}
          </BaseErrorBoundary>
        </div>
        <div className={styles.layoutFooter}></div>
      </div>
      <SvgSprite />
    </QueryClientProvider>
  );
}
