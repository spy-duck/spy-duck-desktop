import React, { ReactNode } from "react";

type TModalContext = {
  onClose?: () => void;
};

const ModalContext = React.createContext<TModalContext>({});

export function useModalContext() {
  return React.useContext(ModalContext);
}

type TModalProps = {
  children?: ReactNode;
  onClose?: () => void;
};
export const ModalProvider = ({ children, onClose }: TModalProps) => (
  <ModalContext.Provider
    value={{
      onClose,
    }}
  >
    {children}
  </ModalContext.Provider>
);
