import { deleteProfile, getRuntimeLogs } from "@/services/cmds";
import { useProfiles } from "@/hooks/use-profiles";
import useSWR from "swr";
import { useAuthorizationState } from "@ui/state/authorization";
import { useVerge } from "@/hooks/use-verge";
import { useConnectionState } from "@ui/state/connection";
import {
  STORAGE_ACCESS_TOKEN,
  STORAGE_IS_PROXIES_INIT,
  STORAGE_KEY_GROUP,
  STORAGE_KEY_PROXY,
} from "@ui/consts";
import { useProxyState } from "@ui/hooks/use-proxy-state";

export function useLogout() {
  const { current }: { current: IProfileItem | undefined } = useProfiles();
  const { mutateProfiles } = useProfiles();
  const { verge, patchVerge, mutateVerge } = useVerge();
  const { updateProxyState } = useProxyState();
  const { mutate: mutateLogs } = useSWR("getRuntimeLogs", getRuntimeLogs);
  const changeAuthorizationState = useAuthorizationState(
    (state) => state.changeAuthorizationState,
  );
  const changeConnectionState = useConnectionState(
    (state) => state.changeConnectionState,
  );

  return async () => {
    if (!current) {
      return;
    }

    await mutateVerge(
      {
        ...verge,
        enable_system_proxy: false,
        enable_tun_mode: false,
      },
      false,
    );

    await patchVerge({
      enable_system_proxy: false,
      enable_tun_mode: false,
    });

    changeConnectionState("disconnected");
    await updateProxyState({
      enable_system_proxy: false,
      enable_tun_mode: false,
    });
    await deleteProfile(current.uid);
    await mutateProfiles();
    await mutateLogs();
    localStorage.removeItem(STORAGE_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_IS_PROXIES_INIT);
    localStorage.removeItem(STORAGE_KEY_GROUP);
    localStorage.removeItem(STORAGE_KEY_PROXY);
    changeAuthorizationState(false);
  };
}
