import React from "react";
import cn, { ClassValue } from "clsx";
import styles from "./flex.module.scss";

type FlexProps = {
  children: React.ReactNode;
  row?: boolean;
  col?: boolean;
  direction?: React.CSSProperties["flexDirection"];
  alignItems?: React.CSSProperties["alignItems"];
  justifyContent?: React.CSSProperties["justifyContent"];
  className?: ClassValue;
  gap?: number;
};

type PolymorphicProps<E extends React.ElementType, P = object> = Omit<
  React.ComponentPropsWithoutRef<E>,
  keyof P
> &
  P & {
    as?: E;
  };

type PolymorphicComponentProps<E extends React.ElementType = "div"> =
  PolymorphicProps<E, FlexProps>;

export function Flex<E extends React.ElementType = "div">({
  as,
  alignItems,
  className,
  children,
  gap,
  justifyContent,
  direction = "row",
}: PolymorphicComponentProps<E>) {
  const Component = as || "div";
  return (
    <Component
      className={cn(styles.flex, className)}
      style={{
        flexDirection: direction,
        alignItems,
        justifyContent,
        gap,
      }}
    >
      {children}
    </Component>
  );
}
