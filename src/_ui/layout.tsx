import React from "react";
import { useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { confirm } from "@tauri-apps/plugin-dialog";
import { UIRoutes } from "@ui/routes";
import { BaseErrorBoundary, NoticeManager } from "@/components/base";
import { SvgSprite } from "@ui/components/svg-sprite";
import { useInitApp } from "@ui/hooks/use-init-app";
import { AuthorizationScreen } from "@ui/screens/authorization";
import { useAuthorizationState } from "@ui/state/authorization";
import { useLogout } from "@ui/hooks/use-logout";
import styles from "./layout.module.scss";

const queryClient = new QueryClient();

export function UILayout() {
  const routes = useRoutes(UIRoutes);
  const logout = useLogout();
  useInitApp();

  const isAuthorized = useAuthorizationState((state) => state.isAuthorized);

  return (
    <QueryClientProvider client={queryClient}>
      <NoticeManager />
      <BaseErrorBoundary>
        <div className={styles.layout}>
          <div className={styles.layoutHeader}>
            <button
              onClick={async () => {
                const confirmation = await confirm(
                  "Ваша подписка будет удалена из приложения на этом ПК",
                  { title: "Подтвердите выход из аккаунта", kind: "warning" },
                );
                if (confirmation) {
                  await logout();
                }
              }}
            >
              logout
            </button>
          </div>
          <div className={styles.layoutContent}>
            {isAuthorized &&
              routes &&
              React.cloneElement(routes, { key: location.pathname })}
            {!isAuthorized && <AuthorizationScreen />}
          </div>
          <div className={styles.layoutFooter}></div>
        </div>
        <SvgSprite />
      </BaseErrorBoundary>
    </QueryClientProvider>
  );
}
