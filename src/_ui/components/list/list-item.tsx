import { ComponentProps, MouseEventHandler, ReactNode } from "react";
import { ContextMenuItem } from "@ui/components/list/list-item-context.menu";
import clsx, { ClassValue } from "clsx";
import styles from "./list.module.scss";

type ListItemProps = {
  children: ReactNode;
  subTitle?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  onClickContextButton?: MouseEventHandler<HTMLButtonElement>;
  current?: boolean;
  contextMenuItems?: ContextMenuItem[];
  color?: undefined | "red";
  className?: ClassValue;
};

export function ListItem({
  children,
  className,
  current,
  color,
  onClick,
  subTitle,
}: ListItemProps) {
  const InnerTag = onClick ? "button" : "div";
  const innerProps: Partial<ComponentProps<any>> = onClick ? { onClick } : {};
  return (
    <li
      className={clsx(
        styles.listItem,
        className,
        current && styles.listItemCurrent,
        color,
        !!onClick && styles.listItemClickable,
      )}
    >
      <InnerTag className={styles.listItemInner} {...innerProps}>
        <div className={styles.listItemTitle}>{children}</div>
        {subTitle && <div className={styles.listItemSubtitle}>{subTitle}</div>}
      </InnerTag>
    </li>
  );
}
