import { useEffect } from "react";
import GenolinkApi from "../api/GenolinkApi";
import GenesysApi from "../api/GenesysApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";

export const genesysApi = new GenesysApi();

const Home = () => {
  let genesysToken;
  const genolinkApi = new GenolinkApi();

  useEffect(() => {
    const initialize = async () => {
      try {
        await genesysApi.fetchAndSetToken();
        genesysToken = genesysApi.getToken();
        genolinkApi.setToken(genesysToken);
        passTokenToServer(genesysToken);
      } catch (error) {
        console.error("Error in setting Genesys Token:", error);
      }
    };
    initialize();
  }, [genesysToken]);

  const passTokenToServer = async (token) => {
    if (token) {
      await genolinkApi.sendTokenToAppServer(token);
    }
  };

  return (

    <SearchFilters />
  );
}

export default Home;
