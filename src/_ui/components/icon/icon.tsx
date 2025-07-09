import React, { CSSProperties } from "react";
import styles from "./icon.module.scss";
import clsx, { ClassValue } from "clsx";
import { TIconBrandName, TIconName, TIconType } from "@ui/types/icon";
import { TColor, TSize } from "@ui/types/common";

type IconProps = {
  name: TIconName | TIconBrandName;
  type?: TIconType;
  size?: TSize;
  color?: TColor;
  className?: ClassValue;
  style?: CSSProperties | undefined;
  rotate?: boolean;
};

export function Icon(props: IconProps): React.ReactElement {
  return (
    <i
      className={clsx(
        styles.icon,
        props.color,
        props.size,
        props.rotate && styles.iconRotate,
        props.className,
      )}
      style={props.style}
    >
      <svg>
        <use
          href={`#icons-${props.type || "regular"}-${props.name}`}
          style={{ fill: "currentColor" }}
        />
      </svg>
    </i>
  );
}
