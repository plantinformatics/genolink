import { useEffect, useState } from "react";
import GenesysApi from "../api/GenesysApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";
import GenolinkGigwaApi from "../api/GenolinkGigwaApi";
import GenolinkInternalApi from "../api/GenolinkInternalApi";
import { useDispatch } from "react-redux";
import { setMetadataSelectedColumns } from "../redux/passport/passportActions";
import { loadSelectedColumnsFromStorage } from "../components/metadata/MetadataColumns";

export const genesysApi = new GenesysApi();
export const genolinkGigwaApi = new GenolinkGigwaApi();
export const genolinkInternalApi = new GenolinkInternalApi();

const Home = () => {
  const [initialDataReady, setInitialDataReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const initialiseAppData = async () => {
      try {
        const { rows } = await genolinkInternalApi.getAllGenotypeStatus();

        if (cancelled) return;

        const completedRows = rows.filter((r) => r.Status === "Completed");

        genesysApi.setGenotypeStatus(rows);
        genesysApi.setGenotypedAccessions(
          completedRows.map((r) => r.Accession),
        );
        genesysApi.setGenotypedSamples(completedRows.map((r) => r.Sample));

        setInitialDataReady(true);
      } catch (e) {
        console.error("Init error:", e);
      }
    };

    initialiseAppData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const saved = loadSelectedColumnsFromStorage();
    dispatch(setMetadataSelectedColumns(saved));
  }, [dispatch]);

  return <SearchFilters initialDataReady={initialDataReady} />;
};

export default Home;
