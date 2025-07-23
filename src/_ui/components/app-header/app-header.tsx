import React from "react";
import { confirm } from "@tauri-apps/plugin-dialog";
import { useLogout } from "@ui/hooks/use-logout";
import LogoPNG from "@ui/assets/images/icon-512.png";
import styles from "./app-header.module.scss";
import { Link } from "react-router-dom";
import { openWebUrl } from "@/services/cmds";
import { AppHeaderSubscriptionInfo } from "@ui/components/app-header/app-header-subscription-info";

type AppHeaderProps = {};

export function AppHeader({}: AppHeaderProps): React.ReactElement {
  const logout = useLogout();

  async function handlerClickLogout(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const confirmation = await confirm(
      "Ваша подписка будет удалена из приложения на этом ПК",
      { title: "Подтвердите выход из аккаунта", kind: "warning" },
    );
    if (confirmation) {
      await logout();
    }
  }

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
              <Link to="/settings">Настройки</Link>
            </li>
            <li>
              <a href="/logout" onClick={handlerClickLogout}>
                Выход
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
