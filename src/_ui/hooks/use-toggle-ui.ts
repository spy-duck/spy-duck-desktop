import { useEffect, useState } from "react";

const LOCAL_STORAGE_UI_TOGGLE_KEY = "is-new-ui";

export function useToggleUi() {
  const [isNewUI, setIsNewUI] = useState(() => {
    const storedValue = localStorage.getItem(LOCAL_STORAGE_UI_TOGGLE_KEY);
    if (!storedValue || !["true", "false"].includes(storedValue)) {
      return true;
    }
    return storedValue === "true";
  });

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      console.log(
        event,
        event.shiftKey &&
          event.ctrlKey &&
          (event.key === "t" || event.key === "T"),
      );
      if (
        event.shiftKey &&
        event.ctrlKey &&
        (event.key === "t" || event.key === "T")
      ) {
        event.preventDefault();
        setIsNewUI((prev) => {
          localStorage.setItem(LOCAL_STORAGE_UI_TOGGLE_KEY, String(!prev));
          return !prev;
        });
      }
    }

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return {
    isNewUI,
  };
}
