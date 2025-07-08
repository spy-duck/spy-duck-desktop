import { useState } from "react";
import { UILayout } from "@ui/layout";
import Layout from "./pages/_layout";

const LOCAL_STORAGE_UI_TOGGLE_KEY = "is-new-ui";

function App() {
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
        style={{ position: "fixed", top: 10, right: 10, zIndex: 1000 }}
      >
        Toggle UI
      </button>
      {isNewUI ? <UILayout /> : <Layout />}
    </>
  );
}

export default App;
