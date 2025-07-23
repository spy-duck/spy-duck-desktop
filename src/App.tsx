import { useState } from "react";
import { UILayout } from "@ui/layout";
import Layout from "./pages/_layout";
import { useNotificationPermission } from "./hooks/useNotificationPermission";

const LOCAL_STORAGE_UI_TOGGLE_KEY = "is-new-ui";

function App() {
  useNotificationPermission();
  const [isNewUI, setIsNewUI] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_UI_TOGGLE_KEY) === "true",
  );

  return (
    <>
      <button
        onClick={() =>
          setIsNewUI((p) => {
            localStorage.setItem(LOCAL_STORAGE_UI_TOGGLE_KEY, String(!p));
            return !p;
          })
        }
        style={{ position: "fixed", bottom: 10, right: 10, zIndex: 1000 }}
      >
        Toggle UI
      </button>
      {isNewUI ? <UILayout /> : <Layout />}
    </>
  );
}

export default App;
