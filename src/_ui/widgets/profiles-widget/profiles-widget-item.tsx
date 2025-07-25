import { ListItem } from "@ui/components/list";
import delayManager from "@/services/delay";
import { TProxy, TProxyGroup } from "@/_ui/types/proxy";
import { ProfilesWidgetContext } from "@ui/widgets/profiles-widget/profiles-widget";
import { useContext } from "react";
import styles from "./profiles-widget.module.scss";
import { useQuery } from "@tanstack/react-query";

function convertDelayColor(delayValue: number) {
  const colorStr = delayManager.formatDelayColor(delayValue);
  if (!colorStr) return "default";

  const mainColor = colorStr.split(".")[0];

  switch (mainColor) {
    case "success":
      return "green";
    case "warning":
      return "orange";
    case "error":
      return "red";
    case "primary":
      return "blue";
    default:
      return "grey";
  }
}

type ProfilesWidgetItemProps = {
  proxy: TProxy;
  group: TProxyGroup;
  index: number;
  onClick(groupName: string, itemName: string): void;
};

export function ProfilesWidgetItem({
  group,
  proxy,
  index,
  onClick,
}: ProfilesWidgetItemProps) {
  const { selectedProxyGroup, selectedProxy } = useContext(
    ProfilesWidgetContext,
  );

  const isCurrent =
    (index === 0 && !selectedProxy && !selectedProxyGroup) ||
    (group.name === selectedProxyGroup && proxy.name === selectedProxy);

  function handlerClickProxy() {
    if (!isCurrent) {
      onClick(group.name, proxy.name);
    }
  }

  const { data: delay, refetch: refetchDelay } = useQuery({
    queryKey: ["delay", proxy.id],
    queryFn: () => delayManager.checkDelay(proxy.name, group.name, 10000),
    placeholderData: 0,
  });

  return (
    <ListItem
      key={group.name + proxy.id}
      current={isCurrent}
      onClick={handlerClickProxy}
    >
      <div className={styles.profilesWidgetProxy}>
        <div className={styles.profilesWidgetProxyName}>{proxy.name}</div>
        <div
          role="button"
          className={styles.profilesWidgetProxyDelay}
          onClick={async (e) => {
            e.stopPropagation();
            await refetchDelay();
          }}
          style={{
            color: `var(--${convertDelayColor(delay!)})`,
          }}
        >
          {delayManager.formatDelay(delay!)}
        </div>
      </div>
    </ListItem>
  );
}
