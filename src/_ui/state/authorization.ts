import { create } from "zustand";

const storedAuthorizationState =
  localStorage.getItem("isAuthorized") || "false";

export const useAuthorizationState = create<{
  isAuthorized: boolean;
  changeAuthorizationState: (newState: boolean) => void;
}>((set) => ({
  isAuthorized: storedAuthorizationState === "true",
  changeAuthorizationState: (newState: boolean) =>
    set((state) => {
      localStorage.setItem("isAuthorized", newState.toString());
      return { ...state, isAuthorized: newState };
    }),
}));
