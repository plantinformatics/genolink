import Home from "./pages/Home";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { BASE_PATH } from "./config/basePath";

const App = () => {
  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: <Home />,
      },
    ],
    { basename: BASE_PATH || "/" }
  );

  return <RouterProvider router={router} />;
};

export default App;
