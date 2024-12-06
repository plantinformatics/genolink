import { useEffect } from "react";
import GenolinkApi from "../api/GenolinkApi";
import GenesysApi from "../api/GenesysApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";
import GenolinkGigwaApi from "../api/GenolinkGigwaApi";
import GenolinkInternalApi from "../api/GenolinkInternalApi";


export const genesysApi = new GenesysApi();
export const genolinkGigwaApi = new GenolinkGigwaApi();
export const genolinkInternalApi = new GenolinkInternalApi();


const Home = () => {
  let genesysToken;
  const genolinkApi = new GenolinkApi();

  useEffect(() => {
    const initialize = async () => {
      try {
        await genesysApi.fetchAndSetToken();
        genesysToken = genesysApi.getToken();
        // genolinkApi.setToken(genesysToken);
        passTokenToServer(genesysToken);

        const accessionResult = await genolinkInternalApi.getAllAccessions();
        genesysApi.setGenotypedAccessions(accessionResult.genotypedAccessions);
        genesysApi.setGenotypedSamples(accessionResult.samples);
        // await genolinkGigwaApi.getGigwaToken(
        //   "",
        //   ""
        // );
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
