import { useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLockFn } from "ahooks";
import {
  enhanceProfiles,
  getSystemHostname,
  getSystemInfo,
  importProfile,
  openWebUrl,
} from "@/services/cmds";
import { UIButton } from "@ui/components/button";
import { useAuthorizationState } from "@ui/state/authorization";
import { useProfiles } from "@/hooks/use-profiles";
import { sha256 } from "@ui/utils/sha256";
import { axiosClient } from "@ui/utils/api-fetch";
import { Icon } from "@ui/components/icon";
import LogoPNG from "@ui/assets/images/icon-512.png";
import styles from "./authorization.module.scss";
import { AuthByKeyWidget } from "@ui/widgets/auth-by-key-widget";
import { useModal } from "@ui/components/modal";
import { showNotice } from "@/services/noticeService";
import { STORAGE_ACCESS_TOKEN } from "@ui/consts";

const BOT_URL =
  import.meta.env.MODE === "development"
    ? "https://t.me/vpn_share_online_bot"
    : "https://t.me/spy_duck_vpn_bot";

export function AuthorizationScreen() {
  const ref = useRef({
    authToken: crypto.randomUUID(),
  });

  const changeAuthorizationState = useAuthorizationState(
    (state) => state.changeAuthorizationState,
  );

  const { mutateProfiles, activateSelected } = useProfiles();

  const { data: sysInfoData } = useQuery({
    queryKey: ["sysInfo"],
    queryFn: async () => {
      return await getSystemInfo();
    },
  });

  const { show: showAuthByKey, props: authByKeyProps } = useModal();

  const onEnhance = async (notifySuccess: boolean) => {
    try {
      await enhanceProfiles();
    } catch (err: any) {
      showNotice("error", err.message || err.toString(), 3000);
      return;
    }
    if (notifySuccess) {
      showNotice("success", "Профиль успешно импортирован", 1000);
    }
  };

  const importSubscription = async (subscription: string) => {
    try {
      await importProfile(subscription);
      await mutateProfiles();
      await onEnhance(true);
    } catch (e) {
      console.error(e);
      await importProfile(subscription, {
        with_proxy: false,
        self_proxy: true,
      });
      await mutateProfiles();
      await onEnhance(true);
    }
  };

  async function onSuccessAuth(data: {
    accessToken: string;
    subscription: string;
  }) {
    localStorage.setItem(STORAGE_ACCESS_TOKEN, data.accessToken);
    await importSubscription(data.subscription);
    await activateSelected();
    changeAuthorizationState(true);
  }

  const { mutate: mutateCheckAuth, isPending: isPendingCheckAuth } =
    useMutation({
      mutationKey: ["auth"],
      mutationFn: async (
        authData: any,
      ): Promise<{ accessToken: string; subscription: string }> => {
        const response = await axiosClient.post("/auth", authData);
        return response.data;
      },
      onSuccess: onSuccessAuth,
      onError(error: any) {
        console.log(error.details);
      },
      retry: 90,
      retryDelay: 2000,
    });

  const { data: systemHostname } = useQuery({
    queryKey: ["systemHostname"],
    queryFn: async () => {
      return await getSystemHostname();
    },
  });

  const sysInfo = useMemo(() => {
    if (!sysInfoData) {
      return null;
    }

    const platform = sysInfoData.match(/System Name:(.*)\n/)?.pop();
    const systemVersion = sysInfoData.match(/System Version:(.*)\n/)?.pop();
    const kernelVersion = sysInfoData
      .match(/System kernel Version:(.*)\n/)
      ?.pop();
    const arch = sysInfoData.match(/System Arch:(.*)\n/)?.pop();
    const vergeVersion = sysInfoData.match(/Verge Version:(.*)\n/)?.pop();

    return {
      platform,
      systemVersion,
      kernelVersion,
      arch,
      vergeVersion,
    };
  }, []);

  const makeAuthData = useCallback(async (): Promise<
    Record<string, string | undefined>
  > => {
    return {
      platform: sysInfo?.platform,
      systemVersion: sysInfo?.systemVersion,
      kernelVersion: sysInfo?.kernelVersion,
      arch: sysInfo?.arch,
      vergeVersion: sysInfo?.vergeVersion,
      hwid: await sha256(
        [
          sysInfo?.platform,
          sysInfo?.systemVersion,
          sysInfo?.kernelVersion,
          sysInfo?.arch,
          systemHostname,
        ].join(":"),
      ),
    };
  }, [sysInfo, systemHostname]);

  async function handlerClickAuth() {
    await openWebUrl(`${BOT_URL}?start=desktop-auth-${ref.current.authToken}`);
    mutateCheckAuth({
      authToken: ref.current.authToken,
      ...(await makeAuthData()),
    });
  }

  return (
    <div className={styles.authorization}>
      <img className={styles.authorizationLogo} src={LogoPNG} alt="Logo" />

      <UIButton onClick={handlerClickAuth} loading={isPendingCheckAuth}>
        <Icon name="paper-plane" type="solid" style={{ marginRight: 14 }} />
        Авторизоваться через Telegram
      </UIButton>

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          showAuthByKey();
        }}
      >
        Войти по ключу
      </a>
      <AuthByKeyWidget
        {...authByKeyProps}
        makeAuthData={makeAuthData}
        onSuccess={onSuccessAuth}
      />
    </div>
  );
}
