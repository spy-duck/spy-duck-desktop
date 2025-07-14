import { deleteProfile, getRuntimeLogs } from "@/services/cmds";
import { useProfiles } from "@/hooks/use-profiles";
import useSWR from "swr";
import { useAuthorizationState } from "@ui/state/authorization";
import { useVerge } from "@/hooks/use-verge";
import { useConnectionState } from "@ui/state/connection";

export function useLogout() {
  const { current }: { current: IProfileItem | undefined } = useProfiles();
  const { mutateProfiles } = useProfiles();
  const { verge, patchVerge, mutateVerge } = useVerge();
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
    await deleteProfile(current.uid);
    await mutateProfiles();
    await mutateLogs();
    localStorage.removeItem("accessToken");
    changeAuthorizationState(false);
  };
}
