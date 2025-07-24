import React from "react";
import { useLogout } from "@ui/hooks/use-logout";
import LogoPNG from "@ui/assets/images/icon-512.png";
import styles from "./app-header.module.scss";
import { Link } from "react-router-dom";
import { openWebUrl } from "@/services/cmds";
import { AppHeaderSubscriptionInfo } from "@ui/widgets/app-header/app-header-subscription-info";
import { useModal } from "@ui/components/modal";
import { SettingsModalWidget } from "@ui/widgets/settings-modal-widget";

type AppHeaderProps = {};

export function AppHeader({}: AppHeaderProps): React.ReactElement {
  const { show: showSettings, props: settingsModalProps } = useModal();

  async function handlerClickSubscription(
    e: React.MouseEvent<HTMLAnchorElement>,
  ) {
    e.preventDefault();
    await openWebUrl("https://t.me/spy_duck_vpn_bot?startapp=subscription");
  }

  async function handlerClickPayment(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    await openWebUrl("https://t.me/spy_duck_vpn_bot?startapp=payment");
  }

  async function handlerClickSettings(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    showSettings();
  }

  return (
    <header className={styles.appHeader}>
      <div className={styles.appHeaderInner}>
        <div className={styles.appHeaderLogo}>
          <img src={LogoPNG} alt="logo" />
        </div>
        <AppHeaderSubscriptionInfo />
        <nav>
          <ul>
            <li>
              <a href="/subscription" onClick={handlerClickSubscription}>
                Моя подписка
              </a>
            </li>
            <li>
              <a href="/payment" onClick={handlerClickPayment}>
                Оплата
              </a>
            </li>
            <li>
              <Link to="/settings" onClick={handlerClickSettings}>
                Настройки
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <SettingsModalWidget {...settingsModalProps} />
    </header>
  );
}
