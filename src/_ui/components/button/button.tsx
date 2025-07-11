import React, { ComponentProps } from "react";
import styles from "./button.module.scss";
import clsx from "clsx";

type ButtonProps = ComponentProps<"button"> & {
  primary?: boolean;
  secondary?: boolean;
  light?: boolean;
  empty?: boolean;
  content?: string | undefined;
};

export function UIButton({
  content,
  primary,
  secondary,
  light,
  empty,
  children,
  ...rest
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={clsx(
        styles.button,
        (primary || (!secondary && !light && !empty)) && styles.buttonPrimary,
        secondary && styles.buttonSecondary,
        empty && styles.buttonEmpty,
      )}
      role="button"
      {...rest}
    >
      <span>{children || content}</span>
    </button>
  );
}
