import React from "react";
import { TColor, TSize } from "@ui/types/common";

export type ModalProps = {
  open: boolean;
  onClose?: () => void;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
  size?: TSize;
  color?: TColor;
  scrollable?: boolean;
  showCloseButton?: boolean;
  hideTemplates?: boolean;
  closeOnDimmerClick?: boolean;
};

export type ModalHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

export type ModalContentProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type ModalActionsProps = {
  children: React.ReactNode;
  className?: string;
};

export type TModal = React.FC<ModalProps & { children: React.ReactNode }>;
export type TModalHeader = React.FC<ModalHeaderProps>;
export type TModalContent = React.FC<ModalContentProps>;
export type TModalActions = React.FC<ModalActionsProps>;

export interface TModalComplex extends TModal {
  Header: TModalHeader;
  Content: TModalContent;
  Actions: TModalActions;
}
