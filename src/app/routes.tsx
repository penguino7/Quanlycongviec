import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Tasks } from "./pages/Tasks";
import { AddTask } from "./pages/AddTask";
import { Calendar } from "./pages/Calendar";
import { Notifications } from "./pages/Notifications";
import { SheetManager } from "./pages/SheetManager";
import { Finance } from "./pages/Finance";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "tasks", Component: Tasks },
      { path: "add", Component: AddTask },
      { path: "calendar", Component: Calendar },
      { path: "notifications", Component: Notifications },
      { path: "sheets", Component: SheetManager },
      { path: "finance", Component: Finance },
    ],
  },
]);