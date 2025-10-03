import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";

import "../../tableStyles.css";
import { useSelector, useDispatch } from "react-redux";
import ResultRow from "./ResultRow";
import LoadingComponent from "../LoadingComponent";
import {
  setCheckedAccessions,
  setCheckedAccessionNames,
} from "../../redux/passport/passportActions";
import { genesysApi } from "../../pages/Home";
import { genolinkInternalApi } from "../../pages/Home";
import country2Region from "../../../shared-data/Country2Region.json";
import { batch } from "react-redux";

const sampStatMapping = {
  100: "Wild",
  110: "Natural",
  120: "Semi-natural/wild",
  130: "Semi-natural/sown",
  200: "Weedy",
  300: "Traditional cultivar/Landrace",
  400: "Breeding/Research Material",
  410: "Breeders Line",
  411: "Synthetic population",
  412: "Hybrid",
  413: "Founder stock/base population",
  414: "Inbred line",
  415: "Segregating population",
  416: "Clonal selection",
  420: "Genetic stock",
  421: "Mutant",
  422: "Cytogenetic stocks",
  423: "Other genetic stocks",
  500: "Advanced/improved cultivar",
  600: "GMO",
  999: "Other",
};

function getSampleStatus(number) {
  const key = String(number);
  return sampStatMapping[key] || "Unknown status";
}

function formatDate(dateStr) {
  if (dateStr && dateStr.length === 8) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}-${month}-${year}`;
  }
  return dateStr || "";
}

const MetadataSearchResultTable = ({ filterCode, hasGenotype, filterBody }) => {
  const searchResults = useSelector((state) => state.passport.searchResults);
  const totalAccessions = useSelector(
    (state) => state.passport.totalAccessions
  );
  const totalPreGenotypedAccessions = useSelector(
    (state) => state.passport.totalPreGenotypedAccessions
  );
  const passportCurrentPage = useSelector(
    (state) => state.passport.passportCurrentPage
  );

  const [isPaginating, setIsPaginating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [remainingPages, setRemainingPages] = useState(
    Math.floor(
      (hasGenotype ? totalPreGenotypedAccessions : totalAccessions) / 500
    )
  );
  const [figMapping, setFigMapping] = useState({});
  const [isPending, startTransition] = useTransition();
  const dispatch = useDispatch();
  const checkedAccessions = useSelector(
    (state) => state.passport.checkedAccessions
  );
  const checkedAccessionNames = useSelector(
    (state) => state.passport.checkedAccessionNames
  );
  const isLoadingGenotypedAccessions = useSelector(
    (state) => state.genotype.isLoadingGenotypedAccessions
  );

  const statusByAcc = useMemo(() => {
    const arr = Array.isArray(genesysApi.genotypeStatus)
      ? genesysApi.genotypeStatus
      : [];
    const m = new Map();
    for (const r of arr) m.set(r.Accession, r.Status);
    return m;
  }, [genesysApi.genotypeStatus]);

  const genotypedIndexByAcc = useMemo(() => {
    const accs = Array.isArray(genesysApi.genotypedAccessions)
      ? genesysApi.genotypedAccessions
      : [];
    const m = new Map();
    accs.forEach((acc, i) => m.set(acc, i));
    return m;
  }, [genesysApi.genotypedAccessions]);

  const countryByCode = useMemo(() => {
    const m = new Map();
    for (const c of country2Region) {
      m.set(String(c["country-code"]), {
        region: c["region"],
        subRegion: c["sub-region"],
      });
    }
    return m;
  }, []);

  const genotypedSamples = genesysApi.genotypedSamples || [];

  useEffect(() => {
    if (!searchResults || searchResults.length === 0) {
      setSelectAll(false);
      return;
    }
    const selectedCount = Object.keys(checkedAccessions || {}).length;
    // mark as selected when all currently-rendered rows are checked
    setSelectAll(selectedCount > 0 && selectedCount >= searchResults.length);
  }, [checkedAccessions, searchResults]);

  useEffect(() => {
    if (!searchResults || searchResults.length === 0) return;

    const accessionIds = searchResults.map((item) => item.accessionNumber);

    const fetchFigs = async () => {
      try {
        const mapping = await genolinkInternalApi.getFigsByAccessions(
          accessionIds
        );
        setFigMapping(mapping); // mapping = { acc1: ["fig1", "fig2"], acc2: ["fig3"] }
      } catch (error) {
        console.error("Failed to fetch figs by accessions:", error);
      }
    };

    fetchFigs();
  }, [searchResults]);

  const handleCheckboxToggle = useCallback(
    (item, currentlyChecked) => {
      const newCheckedAccessions = { ...checkedAccessions };
      const newCheckedAccessionNames = { ...checkedAccessionNames };

      if (currentlyChecked) {
        delete newCheckedAccessions[item.accessionNumber];
        delete newCheckedAccessionNames[item.accessionNumber];
      } else {
        newCheckedAccessions[item.accessionNumber] = true;
        newCheckedAccessionNames[item.accessionNumber] = item.accessionName;
      }
      // Keep UI responsive while Redux updates
      startTransition(() => {
        batch(() => {
          dispatch(setCheckedAccessions(newCheckedAccessions));
          dispatch(setCheckedAccessionNames(newCheckedAccessionNames));
        });
      });
    },
    [dispatch, checkedAccessions, checkedAccessionNames, startTransition]
  );

  const handleSelectAllChange = useCallback(() => {
    const newCheckedAccessions = {};
    const newCheckedAccessionNames = {};

    if (selectAll) {
      startTransition(() => {
        batch(() => {
          dispatch(setCheckedAccessions({}));
          dispatch(setCheckedAccessionNames({}));
        });
      });
    } else {
      searchResults?.forEach((item) => {
        newCheckedAccessions[item.accessionNumber] = true;
        newCheckedAccessionNames[item.accessionNumber] = item.accessionName;
      });
      startTransition(() => {
        batch(() => {
          dispatch(setCheckedAccessions(newCheckedAccessions));
          dispatch(setCheckedAccessionNames(newCheckedAccessionNames));
        });
      });
    }

    setSelectAll(!selectAll);
  }, [dispatch, selectAll, searchResults, startTransition]);

  const fetchMore = async () => {
    try {
      setIsPaginating(true);
      await genesysApi.fetchMoreResults({
        filterCode,
        passportCurrentPage,
        // pageSize: hasGenotype ? 10000 : 500,
        pageSize: 500,
        dispatch,
        searchResults,
        hasGenotype,
      });
      setRemainingPages((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Error fetching more results:", error);
    } finally {
      setIsPaginating(false);
    }
  };

  const handleRowClick = useCallback((index) => {
    setExpandedRow((prev) => (prev === index ? null : index));
  }, []);

  const handleExportPassportData = async () => {
    try {
      setIsDownloading(true);
      if (Object.keys(filterBody).length === 0) {
        alert("Please apply filters before exporting data.");
        return;
      }
      await genesysApi.downloadFilteredData(filterBody, hasGenotype);
      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      console.error("Error exporting passport data:", error);
      alert("Failed to export passport data. Please try again.");
    }
  };

  return (
    <>
      <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse" }}
          className="table table-bordered table-hover"
        >
          <thead
            style={{
              backgroundColor: "lightblue",
              position: "sticky",
              top: "0",
              zIndex: 2,
            }}
          >
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllChange}
                />
              </th>
              <th>#</th>
              <th scope="col">Institute Code</th>
              <th scope="col">Holding Institute</th>
              <th scope="col">Accession Number</th>
              <th scope="col">Accession Name</th>
              <th scope="col">Aliases</th>
              <th scope="col">Remarks</th>
              <th scope="col">Taxonomy</th>
              <th scope="col">Crop Name</th>
              <th scope="col">Genus</th>
              <th scope="col">Species</th>
              <th scope="col">Biological status of accession</th>
              <th scope="col">Donor Institute</th>
              <th scope="col">Provenance of Material</th>
              <th scope="col">Region</th>
              <th scope="col">Sub-Region</th>
              <th scope="col">Acquisition Date</th>
              <th scope="col">DOI</th>
              <th scope="col">Last Updated</th>
              <th scope="col">Genotype Status</th>
              <th scope="col">GenotypeID</th>
              <th scope="col">FIGS set</th>
            </tr>
          </thead>
          <tbody>
            {searchResults?.map((item, index) => {
              const acc = item.accessionNumber;
              const status =
                statusByAcc.get(acc) ??
                (acc?.startsWith("AGG") ? "TBC" : "N/A");
              const gIdx = genotypedIndexByAcc.get(acc) ?? -1;
              const genotypeID =
                gIdx !== -1 && Array.isArray(genotypedSamples)
                  ? genotypedSamples[gIdx]
                  : "N/A";
              const isExpanded = expandedRow === index;

              return (
                <ResultRow
                  key={item.accessionNumber}
                  item={item}
                  index={index}
                  isExpanded={isExpanded}
                  onToggleCheckbox={handleCheckboxToggle}
                  onRowClick={handleRowClick}
                  status={status}
                  genotypeID={genotypeID}
                  figsForAcc={figMapping[acc]}
                  formatDate={formatDate}
                  getSampleStatus={getSampleStatus}
                  countryByCode={countryByCode}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {!isPaginating &&
        !isLoadingGenotypedAccessions &&
        (remainingPages > 0 ? (
          <button type="button" className="btn btn-primary" onClick={fetchMore}>
            More Results ({remainingPages})
          </button>
        ) : null)}
      {isDownloading ? (
        <LoadingComponent />
      ) : (
        <button
          onClick={handleExportPassportData}
          className="btn btn-primary"
          style={{ marginLeft: "10px" }}
        >
          Export All Passport Data
        </button>
      )}
    </>
  );
};

export default MetadataSearchResultTable;
