import { useMemo, useRef } from "react";
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
  const { mutateProfiles } = useProfiles();

  const { data: sysInfoData } = useQuery({
    queryKey: ["sysInfo"],
    queryFn: async () => {
      return await getSystemInfo();
    },
  });

  const onEnhance = useLockFn(async (notifySuccess: boolean) => {
    try {
      await enhanceProfiles();
    } catch (err: any) {
      alert(err.message || err.toString());
    }
  });

  const importSubscription = async (subscription: string) => {
    try {
      await importProfile(subscription);
      await mutateProfiles();
      await onEnhance(false);
    } catch (e) {
      console.error(e);
      await importProfile(subscription, {
        with_proxy: false,
        self_proxy: true,
      });
      await mutateProfiles();
      await onEnhance(false);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationKey: ["auth"],
    mutationFn: async (
      authData: any,
    ): Promise<{ accessToken: string; subscription: string }> => {
      const response = await axiosClient.post("/auth", authData);
      return response.data;
    },
    async onSuccess(data: { accessToken: string; subscription: string }) {
      console.log("SUCCESS");
      console.log(data);
      localStorage.setItem("accessToken", data.accessToken);
      await importSubscription(data.subscription);
      changeAuthorizationState(true);
    },
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

  async function handlerClickAuth() {
    await openWebUrl(`${BOT_URL}?start=desktop-auth-${ref.current.authToken}`);
    mutate({
      authToken: ref.current.authToken,
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
    });
  }

  return (
    <div className={styles.authorization}>
      <img className={styles.authorizationLogo} src={LogoPNG} alt="Logo" />
      <h1>Нужно авторизоваться</h1>
      <UIButton onClick={handlerClickAuth} disabled={isPending}>
        <Icon name="paper-plane" type="solid" style={{ marginRight: 14 }} />
        Авторизоваться
      </UIButton>
    </div>
  );
}
