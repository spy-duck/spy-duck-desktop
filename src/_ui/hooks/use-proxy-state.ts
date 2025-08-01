import { useMutation } from "@tanstack/react-query";
import { intervalPromise } from "@ui/utils/interval-promise";
import { useVerge } from "@/hooks/use-verge";
import { EVENT_CHANGE_CONNECTION_STATE } from "@ui/consts";
import { useBackandEventListener } from "@ui/hooks/use-backand-event-listener";

export function useProxyState() {
  const { verge, patchVerge, mutateVerge } = useVerge();

  const { mutateAsync: updateProxyState, isPending: isPendingConnecting } =
    useMutation({
      mutationFn: async (
        proxyState: Pick<
          IVergeConfig,
          "enable_system_proxy" | "enable_tun_mode"
        >,
      ) => {
        await intervalPromise(
          (async () => {
            await mutateVerge({ ...verge, ...proxyState }, false);
            await patchVerge(proxyState);
          })(),
          2000,
        );
      },
    });
  useBackandEventListener(EVENT_CHANGE_CONNECTION_STATE, async () => {
    await mutateVerge();
  }, []);

  const { enable_system_proxy, enable_tun_mode } = verge ?? {};

  return {
    updateProxyState,
    isPendingConnecting,
    isEnabledSystemProxy: enable_system_proxy,
    isEnabledTunMode: enable_tun_mode,
  };
}
