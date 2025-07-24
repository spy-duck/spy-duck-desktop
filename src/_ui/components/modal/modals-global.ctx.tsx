import React, { ReactNode, useCallback } from "react";
import { uid } from "@ui/utils/uid";
import { useEventListener } from "ahooks";

type TModalsContext = {
  register: (
    modalId: string,
    closeHandler: () => void,
    hideScroll: boolean,
  ) => number;
  unregister: (modalId: string) => void;
  getModalId: () => string;
};

const ModalsContext = React.createContext<TModalsContext>({
  getModalId: () => "",
  register: () => -1,
  unregister: () => null,
});

export function useModalsContext() {
  return React.useContext(ModalsContext);
}

const modals = new Set();
const modalsProps: Record<string, () => void> = {};

type ModalsProviderProps = {
  children?: ReactNode;
  onClose?: () => void;
};
export const ModalsProvider = ({ children }: ModalsProviderProps) => {
  const handlerKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (modals.size) {
        const upperWindowID = Array.from(modals).pop() as string;
        modalsProps[upperWindowID]();
      }
    }
  }, []);

  useEventListener("keydown", handlerKeydown);

  const register = useCallback(function register(
    modalId: string,
    modalProps: () => void,
    hideScroll: boolean,
  ) {
    if (hideScroll && !modals.size) {
      document.body.style.overflow = "hidden";
    }
    modals.add(modalId);
    modalsProps[modalId] = modalProps;
    return modals.size;
  }, []);

  const unregister = useCallback(function unregister(modalId: string) {
    modals.delete(modalId);
    delete modalsProps[modalId];
    if (!modals.size) {
      document.body.style.overflow = "initial";
    }
  }, []);

  const getModalId = useCallback(function getModalId() {
    return uid();
  }, []);

  return (
    <ModalsContext.Provider
      value={{
        getModalId,
        register,
        unregister,
      }}
    >
      {children}
    </ModalsContext.Provider>
  );
};
