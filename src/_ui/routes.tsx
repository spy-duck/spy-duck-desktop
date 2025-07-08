import { UIHomeScreen } from "@ui/screens/home";
import { RouteObject } from "react-router-dom";

export const UIRoutes: RouteObject[] = [
  {
    path: "/home",
    element: <UIHomeScreen />,
  },
];
