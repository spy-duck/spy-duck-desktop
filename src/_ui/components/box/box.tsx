import { ReactElement, ReactNode } from "react";
import clsx, { ClassValue } from "clsx";
import styles from "./box.module.scss";

type BoxProps = {
  className?: ClassValue;
  noPadding?: boolean;
  children: ReactNode;
};

export function Box({
  children,
  className,
  noPadding,
}: BoxProps): ReactElement {
  return (
    <div
      className={clsx(styles.box, className, noPadding && styles.boxNoPadding)}
    >
      {children}
    </div>
  );
}
