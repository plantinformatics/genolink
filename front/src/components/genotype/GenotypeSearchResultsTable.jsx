import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setGenotypeCurrentPage } from "../../redux/genotype/genotypeActions";
import styles from "./GenotypeSearchResultsTable.module.css";

const GenotypeSearchResultsTable = ({
  variantPageSize = 100,

  // true: use all Gigwa server responses from Redux
  // false: use only the server-specific values passed below
  combineServerResults = true,

  // Used when combineServerResults is false
  serverData = null,
  serverAlleleData = null,
  serverSamples = [],

  // Controlled pagination for an individual server
  currentPage: controlledCurrentPage,
  onPageChange,
}) => {
  const dispatch = useDispatch();
  const reduxData = useSelector((state) => state.genotype.genomData);
  const reduxAlleles = useSelector((state) => state.genotype.alleleData);
  const reduxSamples = useSelector((state) => state.genotype.completeNames);

  const reduxCurrentPage = useSelector(
    (state) => state.genotype.genotypeCurrentPage,
  );
  const platform = useSelector((state) => state.genotype.selectedOption);
  const pageLengths = useSelector((state) => state.genotype.pageLengths);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const isSeparateServerView = platform === "Gigwa" && !combineServerResults;

  /*
   * In combined mode, continue using all Redux data.
   *
   * In separate mode, normalise the selected server's response into
   * a one-item array. This allows the remainder of the table logic
   * to work without treating the response as belonging to another
   * server.
   */
  const data = useMemo(() => {
    if (isSeparateServerView) {
      return serverData ? [serverData] : [];
    }

    return Array.isArray(reduxData) ? reduxData : [];
  }, [isSeparateServerView, serverData, reduxData]);

  const alleles = useMemo(() => {
    if (isSeparateServerView) {
      return serverAlleleData ? [serverAlleleData] : [];
    }

    return Array.isArray(reduxAlleles) ? reduxAlleles : [];
  }, [isSeparateServerView, serverAlleleData, reduxAlleles]);

  const samples = useMemo(() => {
    if (isSeparateServerView) {
      return [Array.isArray(serverSamples) ? serverSamples : []];
    }

    return Array.isArray(reduxSamples) ? reduxSamples : [];
  }, [isSeparateServerView, serverSamples, reduxSamples]);

  const itemsPerPage = variantPageSize;

  const currentPage = Math.max(
    1,
    controlledCurrentPage ?? reduxCurrentPage ?? 1,
  );

  /*
   * Keep each server's variant, allele and sample responses together.
   * This avoids accidentally reading allele data from a different
   * server after responses have been filtered or reorganised.
   */
  const gigwaServerEntries = useMemo(() => {
    if (platform !== "Gigwa") {
      return [];
    }

    return data.map((serverVariantData, serverIndex) => ({
      serverIndex,
      variantData: serverVariantData,
      alleleData: alleles?.[serverIndex] || null,
      samples: Array.isArray(samples?.[serverIndex])
        ? samples[serverIndex]
        : [],
    }));
  }, [platform, data, alleles, samples]);

  /*
   * Combined mode:
   * Creates the union of samples from all servers.
   *
   * Separate mode:
   * There is only one entry, so only that server's samples are shown.
   */
  const visibleSamples = useMemo(() => {
    const sampleNames = gigwaServerEntries
      .filter((entry) => (entry.variantData?.result?.data?.length || 0) > 0)
      .flatMap((entry) => entry.samples);

    return Array.from(new Set(sampleNames));
  }, [gigwaServerEntries]);

  /*
   * Combined mode:
   * Flattens variants returned by every server.
   *
   * Separate mode:
   * Flattens only the selected server's variants.
   */
  const variants = useMemo(() => {
    if (platform !== "Gigwa") {
      return [];
    }

    return gigwaServerEntries.flatMap((entry) => {
      const serverVariants = entry.variantData?.result?.data || [];

      return serverVariants.map((variant, localIndex) => ({
        serverIndex: entry.serverIndex,
        variant,
        localIndex,
      }));
    });
  }, [platform, gigwaServerEntries]);

  /*
   * Convert each server's allele matrix to:
   *
   * genotypeMaps[serverIndex][sampleName][variantIndex]
   */
  const genotypeMaps = useMemo(() => {
    if (platform !== "Gigwa") {
      return [];
    }

    const maps = [];

    gigwaServerEntries.forEach((entry) => {
      const genotypeMap = {};
      const matrix =
        entry.alleleData?.result?.dataMatrices?.[0]?.dataMatrix || [];

      matrix.forEach((row, variantIndex) => {
        row.forEach((genotype, sampleIndex) => {
          const sampleName = entry.samples?.[sampleIndex];

          if (!sampleName) {
            return;
          }

          if (!genotypeMap[sampleName]) {
            genotypeMap[sampleName] = [];
          }

          genotypeMap[sampleName][variantIndex] = genotype;
        });
      });

      maps[entry.serverIndex] = genotypeMap;
    });

    return maps;
  }, [platform, gigwaServerEntries]);

  const displayVariants = useMemo(() => {
    if (!sortConfig.key) {
      return variants;
    }

    return [...variants].sort((a, b) => {
      let aValue;
      let bValue;

      if (sortConfig.key === "variantDbId") {
        aValue = a.variant?.variantDbId || "";
        bValue = b.variant?.variantDbId || "";
      } else {
        aValue = a.variant?.[sortConfig.key];
        bValue = b.variant?.[sortConfig.key];
      }

      if (aValue === bValue) {
        return 0;
      }

      if (aValue === undefined || aValue === null) {
        return 1;
      }

      if (bValue === undefined || bValue === null) {
        return -1;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      return sortConfig.direction === "asc" ? 1 : -1;
    });
  }, [variants, sortConfig]);

  const handleSort = (columnKey) => {
    setSortConfig((previousSort) => ({
      key: columnKey,
      direction:
        previousSort.key === columnKey && previousSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  /*
   * Separate mode has one pagination count for the selected server.
   *
   * Combined mode continues to use the largest page count among
   * all participating servers.
   */
  const totalPages = useMemo(() => {
    if (platform === "Gigwa") {
      const serverPageCounts = gigwaServerEntries.map((entry) =>
        Math.ceil(
          (entry.alleleData?.result?.pagination?.[0]?.totalCount || 0) /
            itemsPerPage,
        ),
      );

      return Math.max(1, ...serverPageCounts);
    }

    if (platform === "Germinate" && data.length > 0) {
      return Math.max(
        1,
        Math.ceil((data?.[0]?.result?.data?.length || 0) / itemsPerPage),
      );
    }

    return 1;
  }, [platform, gigwaServerEntries, data, itemsPerPage]);

  /*
   * Separate mode:
   * Each server calculates its row number from its own page.
   *
   * Combined mode:
   * Continue using the existing combined page-length calculation.
   */
  const rowOffset = useMemo(() => {
    if (isSeparateServerView) {
      return (currentPage - 1) * itemsPerPage;
    }

    return (pageLengths || [])
      .slice(0, currentPage - 1)
      .reduce((total, pageLength) => {
        return total + (pageLength || 0);
      }, 0);
  }, [isSeparateServerView, currentPage, itemsPerPage, pageLengths]);

  const changePage = (requestedPage) => {
    const nextPage = Math.min(Math.max(requestedPage, 1), totalPages);

    /*
     * A separate server tab supplies its own handler.
     * Combined mode continues using the existing Redux page.
     */
    if (typeof onPageChange === "function") {
      onPageChange(nextPage);
      return;
    }

    dispatch(setGenotypeCurrentPage(nextPage));
  };

  const getVisiblePages = () => {
    const maximumVisiblePages = 3;
    let startPage = Math.max(
      currentPage - Math.floor(maximumVisiblePages / 2),
      1,
    );

    let endPage = startPage + maximumVisiblePages - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(totalPages - maximumVisiblePages + 1, 1);
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index,
    );
  };

  const getVariantId = (variant) => {
    const variantDbId = variant?.variantDbId || "";
    return variantDbId.split("§")[1] || variantDbId;
  };

  const isHeterozygous = (genotypeValue) =>
    genotypeValue === "0/1" ||
    genotypeValue === "1/0" ||
    genotypeValue === "0|1" ||
    genotypeValue === "1|0";

  const getDisplayedGenotype = (genotypeValue) => {
    if (genotypeValue === null || genotypeValue === undefined) {
      return ".";
    }

    if (genotypeValue === ".") {
      return ".";
    }

    if (isHeterozygous(genotypeValue)) {
      return "1";
    }

    if (genotypeValue === "1") {
      return "2";
    }

    return genotypeValue;
  };

  const getGenotypeBackground = (genotypeValue) => {
    if (
      genotypeValue === null ||
      genotypeValue === undefined ||
      genotypeValue === "."
    ) {
      return "#fff";
    }

    if (isHeterozygous(genotypeValue)) {
      return "#dbedf7";
    }

    if (genotypeValue === "1") {
      return "#fac9b0";
    }

    if (genotypeValue === "0") {
      return "#b4c0e7";
    }

    return "#fff";
  };

  const CHROMConverter = (CHROM) => {
    const mapping = {
      1: "chr1A",
      2: "chr1B",
      3: "chr1D",
      4: "chr2A",
      5: "chr2B",
      6: "chr2D",
      7: "chr3A",
      8: "chr3B",
      9: "chr3D",
      10: "chr4A",
      11: "chr4B",
      12: "chr4D",
      13: "chr5A",
      14: "chr5B",
      15: "chr5D",
      16: "chr6A",
      17: "chr6B",
      18: "chr6D",
      19: "chr7A",
      20: "chr7B",
      21: "chr7D",
    };
    return mapping[CHROM] || CHROM;
  };

  return (
    <div>
      <div className={styles.tableWrapper}>
        {platform === "Gigwa" ? (
          <table
            className={`${styles.table} ${styles.tableBordered} ${styles.tableStriped} ${styles.scrollableTable}`}
          >
            <thead>
              <tr>
                <th className={styles.verticalHeader}>
                  <span>#</span>
                </th>
                <th
                  className={styles.verticalHeader}
                  onClick={() => handleSort("referenceName")}
                >
                  <span>CHROM</span>
                </th>
                <th
                  className={styles.verticalHeader}
                  onClick={() => handleSort("start")}
                >
                  <span>POS</span>
                </th>
                <th
                  className={styles.verticalHeader}
                  onClick={() => handleSort("variantDbId")}
                >
                  <span>ID</span>
                </th>
                <th
                  className={styles.verticalHeader}
                  onClick={() => handleSort("referenceBases")}
                >
                  <span>REF</span>
                </th>
                <th
                  className={styles.verticalHeader}
                  onClick={() => handleSort("alternateBases")}
                >
                  <span>ALT</span>
                </th>

                {visibleSamples.map((sample) => (
                  <th
                    className={styles.verticalHeader}
                    key={sample}
                    title={sample}
                  >
                    <span>{sample}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {displayVariants.map((row, index) => {
                const { serverIndex, variant, localIndex } = row;
                return (
                  <tr key={`${serverIndex}-${rowOffset}-${localIndex}`}>
                    <td>{rowOffset + index + 1}</td>
                    <td>{variant?.referenceName}</td>

                    <td>{variant?.start}</td>
                    <td title={getVariantId(variant)}>
                      {getVariantId(variant)}
                    </td>
                    <td style={{ background: "#b4c0e7" }}>
                      {variant?.referenceBases}
                    </td>
                    <td
                      style={{
                        background: "#fac9b0",
                        borderRight: "5px solid white",
                      }}
                    >
                      {variant?.alternateBases?.[0] || ""}
                    </td>

                    {visibleSamples.map((sample) => {
                      const genotypeValue =
                        genotypeMaps?.[serverIndex]?.[sample]?.[localIndex] ??
                        null;

                      return (
                        <td
                          key={sample}
                          style={{
                            background: getGenotypeBackground(genotypeValue),
                          }}
                        >
                          {getDisplayedGenotype(genotypeValue)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : platform === "Germinate" ? (
          <table
            className={`${styles.table} ${styles.tableBordered} ${styles.tableStriped}`}
          >
            <thead>
              <tr>
                <th className={styles.verticalHeader}>#</th>
                <th className={styles.verticalHeader}>CHROM</th>
                <th className={styles.verticalHeader}>POS</th>
                <th className={styles.verticalHeader}>ID</th>
                {samples.map((sample) => (
                  <th className={styles.verticalHeader} key={sample}>
                    {sample}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.[0]?.result?.data
                ?.slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage,
                )
                .map((item, variantIndex) => (
                  <tr key={variantIndex}>
                    <td>
                      {variantIndex + 1 + (currentPage - 1) * itemsPerPage}
                    </td>
                    <td>{CHROMConverter(item.variantName.split("-")[2])}</td>
                    <td>{item.variantName.split("-")[1]}</td>
                    <td>{item.variantName.split("-")[0]}</td>
                    {samples.map((sample, sampleIndex) => (
                      <td key={sampleIndex}>
                        {
                          data?.[sampleIndex]?.result?.data?.[variantIndex]
                            ?.genotypeValue
                        }
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className={styles.dFlex}>
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${
            currentPage === 1 ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() => changePage(1)}
          disabled={currentPage === 1}
        >
          First
        </button>

        <button
          className={`${styles.btn} ${styles.btnPrimary} ${
            currentPage === 1 ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        {getVisiblePages().map((page) => (
          <button
            key={page}
            className={`${styles.btn} ${styles.btnPrimary} ${
              currentPage === page ? styles.btnPrimaryActive : ""
            }`}
            onClick={() => changePage(page)}
          >
            {page}
          </button>
        ))}

        <button
          className={`${styles.btn} ${styles.btnPrimary} ${
            currentPage === totalPages ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>

        <button
          className={`${styles.btn} ${styles.btnPrimary} ${
            currentPage === totalPages ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() => changePage(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default GenotypeSearchResultsTable;
