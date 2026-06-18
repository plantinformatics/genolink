import { useEffect, useState } from "react";
import GenesysApi from "../api/GenesysApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";
import GenolinkInternalApi from "../api/GenolinkInternalApi";
import { useDispatch } from "react-redux";
import { setMetadataSelectedColumns } from "../redux/passport/passportActions";
import { loadSelectedColumnsFromStorage } from "../components/metadata/MetadataColumns";

export const genesysApi = new GenesysApi();
export const genolinkInternalApi = new GenolinkInternalApi();

const normaliseGenotypeStatusRows = (rows = []) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      Accession: row.Accession ?? row.accession ?? row.acceNumb ?? null,
      Sample: row.Sample ?? row.sample ?? row.genotypeId ?? null,
      Status: row.Status ?? row.status ?? null,
      doi: row.doi ?? null,
      serverUrl: row.ServerUrl ?? row.serverUrl ?? null,
      source: row.source ?? "internal",
    }))
    .filter((row) => row.Accession);
};

const isCompletedGenotypeRow = (row) => {
  return row.Status === "Completed" && row.Sample;
};

const Home = () => {
  const [initialDataReady, setInitialDataReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const initialiseAppData = async () => {
      try {
        const { rows } = await genolinkInternalApi.getAllGenotypeStatus();

        if (cancelled) return;

        const normalisedRows = normaliseGenotypeStatusRows(rows);
        const completedRows = normalisedRows.filter(isCompletedGenotypeRow);

        genesysApi.setGenotypeStatus(normalisedRows);
        genesysApi.setGenotypedAccessions(
          completedRows.map((row) => row.Accession),
        );
        genesysApi.setGenotypedSamples(completedRows.map((row) => row.Sample));

        setInitialDataReady(true);
      } catch (e) {
        console.error("Init error:", e);

        if (!cancelled) {
          genesysApi.setGenotypeStatus([]);
          genesysApi.setGenotypedAccessions([]);
          genesysApi.setGenotypedSamples([]);
          setInitialDataReady(true);
        }
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
