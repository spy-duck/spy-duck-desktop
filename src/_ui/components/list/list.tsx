import { CSSProperties, ReactElement, ReactNode } from "react";
import clsx from "clsx";
import styles from "./list.module.scss";

type ListProps = {
  children: ReactNode;
  style?: CSSProperties;
  attached?: boolean;
};

export function List({ attached, children, style }: ListProps): ReactElement {
  return (
    <ul
      className={clsx(styles.list, attached && styles.listAttached)}
      style={style}
    >
      {children}
    </ul>
  );
}
