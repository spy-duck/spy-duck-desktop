import { UILayout } from "@ui/layout";
import Layout from "./pages/_layout";
import { useNotificationPermission } from "./hooks/useNotificationPermission";
import { useToggleUi } from "@ui/hooks/use-toggle-ui";

function App() {
  useNotificationPermission();
  const { isNewUI } = useToggleUi();

  return isNewUI ? <UILayout /> : <Layout />;
}

export default App;
