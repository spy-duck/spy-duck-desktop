import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import cn from "clsx";
import {
  TModalComplex,
  ModalActionsProps,
  ModalContentProps,
  ModalHeaderProps,
} from "./modal.types";
import { ModalProvider, useModalContext } from "./modal.ctx";
import styles from "./modal.module.scss";
import { Icon } from "@ui/components/icon";

const Modal: TModalComplex = ({
  children,
  open,
  onClose,
  className,
  size,
  color,
  scrollable,
  showCloseButton,
  closeOnDimmerClick = true,
  index = 0,
  style = {},
}) => {
  const [showed, setShowed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setShowed(true);
      setTimeout(() => setVisible(true), 50);
    } else {
      setVisible(false);
      setTimeout(() => setShowed(false), 200);
    }
  }, [open]);

  const handlerClickClose = () => {
    if (onClose) {
      onClose();
    }
  };
  if (!showed) {
    return null;
  }
  return ReactDOM.createPortal(
    <ModalProvider onClose={onClose}>
      <div
        className={cn(styles.modal, {
          [styles.modalOpen]: visible,
          [styles.modalScrollable]: scrollable,
          [styles.modalShowClose]: showCloseButton,
          [`-${size}`]: size,
          [`-${color}`]: color,
        })}
        style={{ zIndex: 99 + index, ...style }}
      >
        <div
          className={styles.modalOverlay}
          onClick={closeOnDimmerClick ? handlerClickClose : undefined}
        />
        <div className={cn(styles.modalContentWrapper, className)}>
          {children}
        </div>
      </div>
    </ModalProvider>,
    document.getElementById("overlay-modal-portal")!,
  );
};

const ModalHeader = ({ children, className }: ModalHeaderProps) => {
  const { onClose } = useModalContext();
  return (
    <div className={cn(styles.modalHeader, className)}>
      <div className={styles.modalHeaderContent}>{children}</div>
      <button
        type="button"
        className={styles.modalCloseButton}
        onClick={onClose ? onClose : undefined}
      >
        <Icon name="xmark" color="white" size="big" />
      </button>
    </div>
  );
};

const ModalContent = ({
  children,
  className,
  style = {},
}: ModalContentProps) => (
  <div className={cn(styles.modalContent, className)} style={style}>
    {children}
  </div>
);

const ModalActions = ({ children, className }: ModalActionsProps) => (
  <div className={cn(styles.modalActions, className)}>{children}</div>
);

Modal.Header = ModalHeader;
Modal.Content = ModalContent;
Modal.Actions = ModalActions;

export { Modal };
