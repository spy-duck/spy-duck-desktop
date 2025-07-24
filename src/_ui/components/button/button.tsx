import React, { ComponentProps } from "react";
import styles from "./button.module.scss";
import clsx from "clsx";
import { Icon } from "@ui/components/icon";

type ButtonProps = ComponentProps<"button"> & {
  primary?: boolean;
  secondary?: boolean;
  light?: boolean;
  empty?: boolean;
  loading?: boolean;
  content?: string | undefined;
};

export function UIButton({
  content,
  primary,
  secondary,
  light,
  empty,
  children,
  loading,
  ...rest
}: ButtonProps): React.ReactElement {
  const isPrimary = primary || (!secondary && !light && !empty);
  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (loading) {
      e.preventDefault();
      return;
    }
    rest.onClick?.(e);
  }
  return (
    <button
      className={clsx(
        styles.button,
        isPrimary && styles.buttonPrimary,
        secondary && styles.buttonSecondary,
        empty && styles.buttonEmpty,
      )}
      role="button"
      {...rest}
      onClick={onClick}
    >
      <span>{children || content}</span>
      {loading && (
        <Icon
          type="light"
          name="loader"
          color={isPrimary ? "white" : "black"}
          rotate
        />
      )}
    </button>
  );
}
