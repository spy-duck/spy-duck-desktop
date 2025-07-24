import React, { ChangeEventHandler } from "react";
import styles from "./switch.module.scss";
import clsx, { ClassValue } from "clsx";

type SwitchProps = {
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: ClassValue;
  disabled?: boolean;
};

export function Switch({
  className,
  disabled,
  checked,
  onChange,
}: SwitchProps): React.ReactElement {
  return (
    <label className={clsx(styles.switch, className)}>
      <div className={styles.switchKnob}></div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  );
}
