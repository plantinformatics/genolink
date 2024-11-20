import { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import GenolinkApi from "../api/GenolinkApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";

const Home = () => {
  const auth = useAuth();
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const genolinkApi = new GenolinkApi(auth.user?.access_token);

  // Monitor for iframe insertions, specifically those used for silent token renewal
  const monitorIframes = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "IFRAME") {
            console.log("Iframe added for silent token renewal", node);

            retryCountRef.current += 1;

            if (retryCountRef.current >= maxRetries) {
              console.warn("Max retry limit reached for silent renewals. Taking action.");
              alert("Max retries for silent renewals reached. Please refresh the page.");

              window.close(); 
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  useEffect(() => {
    console.log("Monitoring iframes for silent token renewals using MutationObserver");
    monitorIframes();
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) {
      console.log("Token received, sending to app server.");
      handleLogin(auth.user?.access_token);
    }
  }, [auth.isAuthenticated]);

  const handleLogin = async (token) => {
    if (token) {
      await genolinkApi.sendTokenToAppServer(token);
    }
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Oops... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div style={{ position: "relative", height: "100vh" }}>
        <button
          onClick={() => void auth.removeUser()}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            backgroundColor: "lightgreen",
            zIndex: 1,
          }}
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
