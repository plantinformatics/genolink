import styles from "../GenotypeExplorer.module.css";

const DatasetSelector = ({
  datasets,
  selectedDataset,
  selectedGigwaServers,
  onChangeDataset,
}) => {
  if (!datasets || datasets.length === 0) return null;

  return (
    <div className={styles.datasetSelectorContainer}>
      <h4>Select Dataset:</h4>

      {datasets.map((datasetGroup, groupIndex) => (
        <fieldset key={groupIndex} className={styles.datasetGroupFieldset}>
          <legend>
            Server:{" "}
            {selectedGigwaServers?.[groupIndex]?.replace(/^https?:\/\//, "")}
          </legend>

          {datasetGroup.map((dataset) => (
            <label key={dataset} className={styles.radioLabel}>
              <input
                type="radio"
                name={`dataset-group-${groupIndex}`}
                value={dataset}
                checked={selectedDataset?.[groupIndex]?.[0] === dataset}
                onChange={() => onChangeDataset(groupIndex, dataset)}
              />
              {dataset}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
};

export default DatasetSelector;
