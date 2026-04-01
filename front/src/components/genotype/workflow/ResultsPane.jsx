import React from "react";
import { useSelector } from "react-redux";
import GenotypeSearchResultsTable from "../GenotypeSearchResultsTable";
import styles from "../GenotypeExplorer.module.css";
import SampleSourceTable from "../SampleSourceTable";

const ResultsPane = React.memo(() => {
  const selectedOption = useSelector((state) => state.genotype.selectedOption);
  const genomData = useSelector((state) => state.genotype.genomData);
  const alleleData = useSelector((state) => state.genotype.alleleData);
  const sampleSourceData = useSelector(
    (state) => state.genotype.sampleSourceData,
  );

  const hasGigwaResults =
    selectedOption === "Gigwa" &&
    Array.isArray(genomData) &&
    genomData.length > 0 &&
    Array.isArray(alleleData) &&
    alleleData.length > 0;

  const hasGerminateResults =
    selectedOption === "Germinate" &&
    Array.isArray(genomData) &&
    genomData.length > 0;

  const hasSampleSourceResults =
    selectedOption === "Gigwa" &&
    Array.isArray(sampleSourceData) &&
    sampleSourceData.length > 0;

  if (hasGigwaResults) {
    return (
      <div className={styles.resultsArea}>
        <div className={styles.tableScroll}>
          <GenotypeSearchResultsTable />
        </div>
      </div>
    );
  }

  if (hasSampleSourceResults) {
    return (
      <div className={styles.resultsArea}>
        <div className={styles.tableScroll}>
          <SampleSourceTable sampleSourceData={sampleSourceData} />
        </div>
      </div>
    );
  }

  if (hasGerminateResults) {
    return <GenotypeSearchResultsTable />;
  }

  return null;
});

export default ResultsPane;
