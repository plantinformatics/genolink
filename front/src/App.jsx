import { AuthProvider as OIDCAuthProvider } from "react-oidc-context";
import Home from "./pages/Home";
import Institute from "./pages/HoldingInstitute";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import oidcConfig from "./config/oidcConfig";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/institute",
      element: <Institute />,
    },
  ],
);

  return (
    <OIDCAuthProvider {...oidcConfig}>
      <RouterProvider router={router} />
    </OIDCAuthProvider>
  );
}

export default App;
