import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { sendTokenToAppServer } from "../api/genolinkGenesysApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";

const Home = () => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated) {
      handleLogin(auth.user?.access_token);
    }
  }, [auth.isAuthenticated]);

  const handleLogin = async (token) => {
    if (token) {
      await sendTokenToAppServer(token);
    }
  };

  switch (auth.activeNavigator) {
    case "signinSilent":
      return <div>Signing you in...</div>;
    case "signoutRedirect":
      return <div>Signing you out...</div>;
  }

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <br />
        <button
          onClick={() => void auth.removeUser()}
          style={{ float: "right", margin: "50px 20px 0 0", backgroundColor:"lightgreen"}}
        >
          Log out
        </button>
        <SearchFilters />
      </div>
    );
  }

  return (
    <button
      onClick={() => void auth.signinRedirect()}
      style={{ float: "right", backgroundColor: "lightgreen" }}
    >
      Log in
    </button>
  );
};

export default Home;