import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
  useRef,
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
import { genotypeMappingSource } from "../../config/apiConfig";
import country2Region from "shared-data/Country2Region.json";

import { batch } from "react-redux";
import ExportFieldsModal from "./ExportFieldsModal";
import { METADATA_COLUMNS, sanitizeSelectedColumns } from "./MetadataColumns";
import styles from "./MetadataSearchResultTable.module.css";

function formatDate(dateStr) {
  if (dateStr && dateStr.length === 8) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}-${month}-${year}`;
  }
  return dateStr || "";
}

function combineGenotypeIds(internalIds = [], genesysIds = []) {
  let orderedIds;

  switch (genotypeMappingSource) {
    case "internal":
      orderedIds = internalIds;
      break;

    case "genesys":
      orderedIds = genesysIds;
      break;

    case "hybrid_genesys_first":
      orderedIds = [...genesysIds, ...internalIds];
      break;

    case "hybrid_internal_first":
    default:
      orderedIds = [...internalIds, ...genesysIds];
      break;
  }

  return [
    ...new Set(orderedIds.map((id) => String(id ?? "").trim()).filter(Boolean)),
  ];
}

const MetadataSearchResultTable = ({ filterCode, hasGenotype, filterBody }) => {
  const searchResults = useSelector((state) => state.passport.searchResults);
  const totalAccessions = useSelector(
    (state) => state.passport.totalAccessions,
  );
  const totalPreGenotypedAccessions = useSelector(
    (state) => state.passport.totalPreGenotypedAccessions,
  );
  const passportCurrentPage = useSelector(
    (state) => state.passport.passportCurrentPage,
  );

  const selectedColumnIds = useSelector(
    (s) => s.passport.metadataSelectedColumns,
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [remainingPages, setRemainingPages] = useState(
    Math.floor(
      (hasGenotype ? totalPreGenotypedAccessions : totalAccessions) / 500,
    ),
  );
  const [figMapping, setFigMapping] = useState({});
  const [genesysGenotypeIdsByAccession, setGenesysGenotypeIdsByAccession] =
    useState({});

  const [isPending, startTransition] = useTransition();
  const [columnWidths, setColumnWidths] = useState({});
  const resizeStateRef = useRef(null);
  const dispatch = useDispatch();
  const checkedAccessions = useSelector(
    (state) => state.passport.checkedAccessions,
  );
  const checkedAccessionNames = useSelector(
    (state) => state.passport.checkedAccessionNames,
  );

  const statusByAcc = useMemo(() => {
    const arr = Array.isArray(genesysApi.genotypeStatus)
      ? genesysApi.genotypeStatus
      : [];
    const m = new Map();
    for (const r of arr) m.set(r.Accession, r.Status);
    return m;
  }, [genesysApi.genotypeStatus]);

  const internalGenotypeIdsByAcc = useMemo(() => {
    const accessions = Array.isArray(genesysApi.genotypedAccessions)
      ? genesysApi.genotypedAccessions
      : [];

    const samples = Array.isArray(genesysApi.genotypedSamples)
      ? genesysApi.genotypedSamples
      : [];

    const map = new Map();

    accessions.forEach((accession, index) => {
      const genotypeId = samples[index];

      if (!accession || !genotypeId) {
        return;
      }

      const currentIds = map.get(accession) || [];

      if (!currentIds.includes(genotypeId)) {
        currentIds.push(genotypeId);
      }

      map.set(accession, currentIds);
    });

    return map;
  }, [genesysApi.genotypedAccessions, genesysApi.genotypedSamples]);

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

  const visibleColumnIds = useMemo(() => {
    const ids = sanitizeSelectedColumns(selectedColumnIds);
    return ids;
  }, [selectedColumnIds]);

  const shouldFetchGenesysGenotypeIds = useMemo(() => {
    return (
      genotypeMappingSource === "genesys" ||
      genotypeMappingSource === "hybrid_internal_first" ||
      genotypeMappingSource === "hybrid_genesys_first"
    );
  }, []);

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
        const mapping =
          await genolinkInternalApi.getFigsByAccessions(accessionIds);
        setFigMapping(mapping); // mapping = { acc1: ["fig1", "fig2"], acc2: ["fig3"] }
      } catch (error) {
        console.error("Failed to fetch figs by accessions:", error);
      }
    };

    fetchFigs();
  }, [searchResults]);

  useEffect(() => {
    if (!shouldFetchGenesysGenotypeIds) return;
    if (!searchResults || searchResults.length === 0) return;

    let cancelled = false;

    const fetchGenesysGenotypeIdsForVisibleRows = async () => {
      try {
        const accessionsToCheck = searchResults
          .map((item) => item.accessionNumber)
          .filter(Boolean)
          .filter(
            (accession) =>
              !Object.prototype.hasOwnProperty.call(
                genesysGenotypeIdsByAccession,
                accession,
              ),
          );

        const uniqueAccessionsToCheck = [...new Set(accessionsToCheck)];

        if (uniqueAccessionsToCheck.length === 0) return;

        const response = await genesysApi.genotypeInfo(uniqueAccessionsToCheck);

        const samples = Array.isArray(response?.Samples)
          ? response.Samples
          : [];

        if (cancelled) return;

        setGenesysGenotypeIdsByAccession((previous) => {
          const next = { ...previous };

          // Mark all requested accessions as checked, including those
          // for which Genesys returned no genotype IDs.
          uniqueAccessionsToCheck.forEach((accession) => {
            if (!Object.prototype.hasOwnProperty.call(next, accession)) {
              next[accession] = [];
            }
          });

          samples.forEach((sample) => {
            if (!sample.Accession || !sample.Sample) {
              return;
            }

            const genotypeId = String(sample.Sample).trim();

            if (!genotypeId) {
              return;
            }

            const currentIds = next[sample.Accession] || [];

            if (!currentIds.includes(genotypeId)) {
              next[sample.Accession] = [...currentIds, genotypeId];
            }
          });

          return next;
        });
      } catch (error) {
        console.error("Failed to fetch Genesys genotype IDs:", error);
      }
    };

    fetchGenesysGenotypeIdsForVisibleRows();

    return () => {
      cancelled = true;
    };
  }, [
    searchResults,
    shouldFetchGenesysGenotypeIds,
    genesysGenotypeIdsByAccession,
  ]);

  const getColumnWidth = useCallback(
    (id) => {
      if (id === "__checkbox__") return 42;
      if (id === "__rowNumber__") return 60;
      return columnWidths[id] || 180;
    },
    [columnWidths],
  );

  const handleMouseMove = useCallback((e) => {
    const state = resizeStateRef.current;
    if (!state) return;

    const delta = e.clientX - state.startX;
    const nextWidth = Math.max(state.minWidth, state.startWidth + delta);

    setColumnWidths((prev) => ({
      ...prev,
      [state.columnId]: nextWidth,
    }));
  }, []);

  const stopResize = useCallback(() => {
    resizeStateRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", stopResize);
  }, [handleMouseMove]);

  const startResize = useCallback(
    (e, columnId) => {
      e.preventDefault();
      e.stopPropagation();

      resizeStateRef.current = {
        columnId,
        startX: e.clientX,
        startWidth: getColumnWidth(columnId),
        minWidth: 80,
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopResize);
    },
    [getColumnWidth, handleMouseMove, stopResize],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleMouseMove, stopResize]);

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const handleExport = (selectedFields) => {
    handleExportPassportData(selectedFields);
  };

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
    [dispatch, checkedAccessions, checkedAccessionNames, startTransition],
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
        pageSize: 500,
        dispatch,
        searchResults,
        selectedColumnIds: visibleColumnIds,
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

  const handleExportPassportData = async (selectedMappings) => {
    try {
      setIsDownloading(true);
      if (Object.keys(filterBody).length === 0) {
        alert("Please apply filters before exporting data.");
        return;
      }
      await genesysApi.downloadFilteredData(
        filterBody,
        selectedMappings,
        hasGenotype,
      );
      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      console.error("Error exporting passport data:", error);
      alert("Failed to export passport data. Please try again.");
    }
  };

  return (
    <>
      <div className={styles.tableWrapper}>
        <table
          className={`table table-bordered table-hover ${styles.metadataTable}`}
        >
          <colgroup>
            <col
              style={{
                width: `${getColumnWidth("__checkbox__")}px`,
                minWidth: `${getColumnWidth("__checkbox__")}px`,
                maxWidth: `${getColumnWidth("__checkbox__")}px`,
              }}
            />
            <col
              style={{
                width: `${getColumnWidth("__rowNumber__")}px`,
                minWidth: `${getColumnWidth("__rowNumber__")}px`,
                maxWidth: `${getColumnWidth("__rowNumber__")}px`,
              }}
            />

            {visibleColumnIds.map((id) => (
              <col
                key={id}
                style={{
                  width: `${getColumnWidth(id)}px`,
                  minWidth: `${getColumnWidth(id)}px`,
                  maxWidth: `${getColumnWidth(id)}px`,
                }}
              />
            ))}
          </colgroup>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.fixedCheckboxHeader}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllChange}
                />
              </th>
              <th className={styles.fixedRowNumberHeader}>#</th>
              {visibleColumnIds.map((id) => {
                const col = METADATA_COLUMNS.find((c) => c.id === id);
                return (
                  <th key={id} scope="col" className={styles.resizableHeader}>
                    <span className={styles.headerLabel}>
                      {col?.label || id}
                    </span>

                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onMouseDown={(e) => startResize(e, id)}
                      className={styles.resizeHandle}
                      title="Drag to resize"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {searchResults?.map((item, index) => {
              const acc = item.accessionNumber;

              const internalGenotypeIds =
                internalGenotypeIdsByAcc.get(acc) || [];

              const genesysGenotypeIds =
                genesysGenotypeIdsByAccession[acc] || [];

              const combinedGenotypeIds = combineGenotypeIds(
                internalGenotypeIds,
                genesysGenotypeIds,
              );

              const genotypeID =
                combinedGenotypeIds.length > 0
                  ? combinedGenotypeIds.join(", ")
                  : "N/A";

              const status =
                statusByAcc.get(acc) ??
                (genesysGenotypeIds.length > 0
                  ? "Completed"
                  : acc?.startsWith("AGG")
                    ? "TBC"
                    : "N/A");
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
                  visibleColumnIds={visibleColumnIds}
                  formatDate={formatDate}
                  countryByCode={countryByCode}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {!isPaginating &&
        (remainingPages > 0 ? (
          <button type="button" className="btn btn-primary" onClick={fetchMore}>
            More Results ({remainingPages})
          </button>
        ) : null)}
      {isDownloading ? (
        <LoadingComponent />
      ) : (
        <button
          onClick={openModal}
          className="btn btn-primary"
          style={{ marginLeft: "10px" }}
        >
          Export All Passport Data
        </button>
      )}
      <ExportFieldsModal
        isVisible={isModalVisible}
        onClose={closeModal}
        onExport={handleExport}
      />
    </>
  );
};

export default MetadataSearchResultTable;
