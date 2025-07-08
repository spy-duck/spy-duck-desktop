import React, { useEffect, useRef } from "react";
import { useRoutes } from "react-router-dom";
import { UIRoutes } from "@ui/routes";
import { BaseErrorBoundary } from "@/components/base";
import styles from "./layout.module.scss";
import { SvgSprite } from "@ui/components/svg-sprite";
import { useInitApp } from "@ui/hooks/use-init-app";

export function UILayout() {
  const routes = useRoutes(UIRoutes);

  useInitApp();

  return (
    <>
      <div className={styles.layout}>
        <div className={styles.layoutHeader}></div>
        <div className={styles.layoutContent}>
          <BaseErrorBoundary>
            {routes && React.cloneElement(routes, { key: location.pathname })}
          </BaseErrorBoundary>
        </div>
        <div className={styles.layoutFooter}></div>
      </div>
      <SvgSprite />
    </>
  );
}
