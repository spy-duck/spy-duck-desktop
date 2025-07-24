import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useModalsContext } from "@ui/components/modal/modals-global.ctx";

type useModalProps = {
  initialState?: boolean;
  hideScroll?: boolean;
  onClose?: () => void;
  clearAdditionalPropsOnClose?: boolean;
};
type useModalReturn<
  AdditionalProps extends Record<string, unknown> = Record<string, unknown>,
> = {
  show: (additionalProps?: AdditionalProps) => void;
  hide: () => void;
  props: {
    open: boolean;
    onClose: () => void;
    index: number;
  } & AdditionalProps;
};
export function useModal<
  AdditionalProps extends Record<string, unknown> = Record<string, unknown>,
>({
  initialState,
  onClose,
  hideScroll = true,
  clearAdditionalPropsOnClose,
}: useModalProps = {}): useModalReturn<AdditionalProps> {
  const { getModalId, register, unregister } = useModalsContext();
  const modalRef = useRef<{ id: string }>({
    id: getModalId(),
  });

  const [open, setOpen] = useState<boolean>(initialState || false);
  const [index, setIndex] = useState(0);
  const [modalAdditionalProps, setModalAdditionalProps] =
    useState<AdditionalProps>({} as AdditionalProps);

  const handlerOpen = useCallback(
    (additionalProps: AdditionalProps = {} as AdditionalProps) => {
      setModalAdditionalProps(additionalProps);
      setOpen(true);
    },
    [],
  );

  const handlerClose = useCallback(() => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
    if (clearAdditionalPropsOnClose) {
      setModalAdditionalProps({} as AdditionalProps);
    }
  }, [clearAdditionalPropsOnClose]);

  const props = useMemo(
    () => ({
      open,
      onClose: handlerClose,
      isUpperWindow: false,
      index,
      ...modalAdditionalProps,
    }),
    [handlerClose, index, modalAdditionalProps, open],
  );

  useEffect(() => {
    const modalId = modalRef.current.id;

    if (open) {
      setIndex(register(modalId, handlerClose, hideScroll));
    } else {
      unregister(modalId);
    }
    return () => {
      unregister(modalId);
    };
  }, [open, handlerClose, register, unregister, hideScroll]);

  return {
    show: handlerOpen,
    hide: handlerClose,
    props,
  };
}
