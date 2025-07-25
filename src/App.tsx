import { UILayout } from "@ui/layout";
import Layout from "./pages/_layout";
import { useNotificationPermission } from "./hooks/useNotificationPermission";
import { useToggleUI } from "@ui/hooks/useToggleUI";

function App() {
  useNotificationPermission();
  const { isNewUI } = useToggleUI();

  return isNewUI ? <UILayout /> : <Layout />;
}

export default App;
