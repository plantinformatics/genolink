import styles from "./GenotypeExplorer.module.css";
import GigwaWorkflowController from "./workflow/GigwaWorkflowController";
import ResultsPane from "./workflow/ResultsPane";

const GenotypeExplorer = () => {
  return (
    <div className={styles.genoData}>
      <h3>Genotype Data</h3>
      <br />

      <div className={styles.genoSplit}>
        <aside className={styles.filtersPane}>
          <GigwaWorkflowController />
        </aside>
        <main className={styles.resultsPane}>
          <ResultsPane />
        </main>
      </div>
    </div>
  );
};

export default GenotypeExplorer;
