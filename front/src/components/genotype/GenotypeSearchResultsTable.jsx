import { useState, useMemo, useEffect } from "react";
import { setGenotypeCurrentPage } from "../../redux/genotype/genotypeActions";
import { useDispatch, useSelector } from "react-redux";
import styles from "./GenotypeSearchResultsTable.module.css";

const GenotypeSearchResultsTable = () => {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.genotype.genomData);
  const alleles = useSelector((state) => state.genotype.alleleData);
  const genotypeCurrentPage = useSelector(
    (state) => state.genotype.genotypeCurrentPage
  );
  const samples = useSelector((state) => state.genotype.completeNames);
  const platform = useSelector((state) => state.genotype.selectedOption);
  const pageLengths = useSelector((state) => state.genotype.pageLengths);
  const itemsPerPage = 20;
  const unionSamples = useMemo(() => {
    const serverSamples = samples.filter(
      (s, idx) => data[idx] && data[idx].result.data.length > 0
    );
    return Array.from(new Set(serverSamples.flat()));
  }, [samples, data]);
  const combinedVariants = useMemo(() => {
    if (platform === "Gigwa" && data && data.length > 0) {
      const flat = [];
      data.forEach((server, serverIndex) => {
        if (server.result && server.result.data) {
          server.result.data.forEach((variant, localIndex) => {
            flat.push({ serverIndex, variant, localIndex });
          });
        }
      });
      return flat;
    }
    return [];
  }, [data]);

  const [displayVariants, setDisplayVariants] = useState(
    combinedVariants || []
  );
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    if (!sortConfig.key) {
      setDisplayVariants(combinedVariants);
    }
  }, [combinedVariants, sortConfig.key]);

  const rowOffset = useMemo(() => {
    return pageLengths
      .slice(0, genotypeCurrentPage - 1)
      .reduce((sum, val) => sum + (val || 0), 0);
  }, [pageLengths, genotypeCurrentPage]);

  let totalPages = 1;
  if (platform === "Gigwa" && alleles.length > 0 && data.length > 0) {
    totalPages = Math.max(
      ...alleles.map((server) =>
        Math.ceil(server.result.pagination[0].totalCount / itemsPerPage),
      ),
    );
  } else if (platform === "Germinate" && data && data.length > 0) {
    totalPages = Math.ceil(data[0].result.data.length / itemsPerPage);
  }
  const genotypeMaps = useMemo(() => {
    if (platform === "Gigwa" && alleles.length > 0 && samples.length > 0) {
      return alleles.map((serverAlleles, serverIndex) => {
        const map = {};
        const matrix = serverAlleles.result.dataMatrices[0].dataMatrix;
        const serverSamples = samples[serverIndex] || [];
        matrix.forEach((row, variantIndex) => {
          row.forEach((genotype, sampleIndex) => {
            if (sampleIndex < serverSamples.length) {
              const sampleId = serverSamples[sampleIndex];
              if (!map[sampleId]) map[sampleId] = [];
              map[sampleId][variantIndex] = genotype;
            }
          });
        });
        return map;
      });
    }
    return [];
  }, [alleles, samples]);

  const handleSort = (columnKey) => {
    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }
    const sorted = [...displayVariants].sort((a, b) => {
      const aVal = a.variant[columnKey];
      const bVal = b.variant[columnKey];
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setSortConfig({ key: columnKey, direction });
    setDisplayVariants(sorted);
  };

  const getVisiblePages = () => {
    const maxPageNumbersToShow = 3;
    let startPage = Math.max(
      genotypeCurrentPage - Math.floor(maxPageNumbersToShow / 2),
      1
    );
    let endPage = startPage + maxPageNumbersToShow - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(totalPages - maxPageNumbersToShow + 1, 1);
    }
    return [...Array(endPage - startPage + 1)].map((_, idx) => startPage + idx);
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
                <th
                  className={styles.verticalHeader}
                  onClick={() => handleSort("id")}
                >
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
                  onClick={() => handleSort("id")}
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
                {unionSamples.map((sample) => (
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
                  <tr key={index}>
                    <td>{rowOffset + index + 1}</td>
                    <td>{variant.referenceName}</td>
                    <td>{variant.start}</td>
                    <td title={variant.variantDbId.split("§")[1]}>
                      {variant.variantDbId.split("§")[1]}
                    </td>
                    <td style={{ background: "#b4c0e7" }}>
                      {variant.referenceBases}
                    </td>
                    <td
                      style={{
                        background: "#fac9b0",
                        borderRight: "5px solid white",
                      }}
                    >
                      {variant.alternateBases[0]}
                    </td>
                    {unionSamples.map((sample) => {
                      const serverSamples = samples[serverIndex] || [];
                      let genotypeValue = null;
                      if (
                        serverSamples.includes(sample) &&
                        genotypeMaps[serverIndex] &&
                        genotypeMaps[serverIndex][sample]
                      ) {
                        genotypeValue =
                          genotypeMaps[serverIndex][sample][localIndex];
                      }
                      return (
                        <td
                          key={sample}
                          style={{
                            background:
                              genotypeValue === "."
                                ? "#fff"
                                : (genotypeValue === "0/1") |
                                  (genotypeValue === "1/0") |
                                  (genotypeValue === "0|1") |
                                  (genotypeValue === "1|0")
                                ? "#dbedf7"
                                : genotypeValue === "1"
                                ? "#fac9b0"
                                : genotypeValue === "0"
                                ? "#b4c0e7"
                                : "#fff",
                          }}
                        >
                          {genotypeValue === "."
                            ? "."
                            : (genotypeValue === "0/1") |
                              (genotypeValue === "1/0") |
                              (genotypeValue === "0|1") |
                              (genotypeValue === "1|0")
                            ? "1"
                            : genotypeValue === "1"
                            ? "2"
                            : genotypeValue !== null
                            ? genotypeValue
                            : "."}
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
              {data &&
                data[0].result.data
                  .slice(
                    (genotypeCurrentPage - 1) * itemsPerPage,
                    genotypeCurrentPage * itemsPerPage
                  )
                  .map((item, index1) => (
                    <tr key={index1}>
                      <td>
                        {index1 + 1 + (genotypeCurrentPage - 1) * itemsPerPage}
                      </td>
                      <td>{CHROMConverter(item.variantName.split("-")[2])}</td>
                      <td>{item.variantName.split("-")[1]}</td>
                      <td>{item.variantName.split("-")[0]}</td>
                      {samples.map((sample, index2) => (
                        <td key={index2}>
                          {data[index2].result.data[index1].genotypeValue}
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
            genotypeCurrentPage === 1 ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() => dispatch(setGenotypeCurrentPage(1))}
          disabled={genotypeCurrentPage === 1}
        >
          First
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${
            genotypeCurrentPage === 1 ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() =>
            dispatch(
              setGenotypeCurrentPage(Math.max(genotypeCurrentPage - 1, 1))
            )
          }
          disabled={genotypeCurrentPage === 1}
        >
          Prev
        </button>
        {getVisiblePages().map((page) => (
          <button
            key={page}
            className={`${styles.btn} ${styles.btnPrimary} ${
              genotypeCurrentPage === page ? styles.btnPrimaryActive : ""
            }`}
            onClick={() => dispatch(setGenotypeCurrentPage(page))}
          >
            {page}
          </button>
        ))}
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${
            genotypeCurrentPage === totalPages ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() =>
            dispatch(
              setGenotypeCurrentPage(
                Math.min(genotypeCurrentPage + 1, totalPages)
              )
            )
          }
          disabled={genotypeCurrentPage === totalPages}
        >
          Next
        </button>
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${
            genotypeCurrentPage === totalPages ? styles.btnPrimaryDisabled : ""
          }`}
          onClick={() => dispatch(setGenotypeCurrentPage(totalPages))}
          disabled={genotypeCurrentPage === totalPages}
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default GenotypeSearchResultsTable;
