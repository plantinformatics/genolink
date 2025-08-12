import { useEffect, useState } from "react";
import GenesysApi from "../api/GenesysApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";
import GenolinkGigwaApi from "../api/GenolinkGigwaApi";
import GenolinkInternalApi from "../api/GenolinkInternalApi";

export const genesysApi = new GenesysApi();
export const genolinkGigwaApi = new GenolinkGigwaApi();
export const genolinkInternalApi = new GenolinkInternalApi();

const Home = () => {
  const [tokenReady, setTokenReady] = useState(false);
  let genesysToken;

  useEffect(() => {
    const initialize = async () => {
      try {
        await genesysApi.fetchAndSetToken();
        setTokenReady(true);
        genesysToken = genesysApi.getToken();

        const accessionResult =
          await genolinkInternalApi.getAllGenotypeStatus();
        genesysApi.setGenotypeStatus(accessionResult.rows);
        genesysApi.setGenotypedAccessions(
          accessionResult.rows
            .filter((row) => row.Status === "Completed")
            .map((row) => row.Accession)
        );
        genesysApi.setGenotypedSamples(
          accessionResult.rows
            .filter((row) => row.Status === "Completed")
            .map((row) => row.Sample)
        );
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

  return <SearchFilters tokenReady={tokenReady} />;
};

export default Home;
