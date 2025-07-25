import React, { ComponentProps, ReactNode } from "react";
import styles from "./input.module.scss";
import clsx from "clsx";

type InputProps = ComponentProps<"input"> & {
  label?: string;
  errors?: any[];
  error?: ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, style, ...rest }, ref): React.ReactElement {
    return (
      <div
        className={clsx(styles.input, label && styles.inputWithLabel)}
        style={style}
      >
        {label && <label>{label}:</label>}

        <div className={styles.inputWrapper}>
          <input ref={ref} {...rest} />
        </div>
        {error && (
          <em className={styles.inputError} role="alert">
            {error}
          </em>
        )}
      </div>
    );
  },
);
