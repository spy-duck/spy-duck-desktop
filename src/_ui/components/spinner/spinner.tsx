import React from "react";
import styles from "./spinner.module.scss";
import { Icon } from "@ui/components/icon";

type SpinnerProps = {};

export function Spinner({}: SpinnerProps): React.ReactElement {
  return <Icon name="loader" type="light" rotate></Icon>;
}
