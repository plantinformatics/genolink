import styles from "./SampleSourceTable.module.css";

const SampleSourceTable = ({ sampleSourceData }) => {
  const studyNames = [
    ...new Set(sampleSourceData.map((item) => item.studyName)),
  ];

  const rowsMap = {};

  sampleSourceData.forEach((item) => {
    const selectedGigwaServer = item.selectedGigwaServer || "";
    const programId = item.variantSetDbIds?.[0]?.split("§")[0] || "";
    const genotypeId = item.germplasmDbId?.split("§")[1] || "";
    const accession = item.accessionNumber || "";
    const doi = item.doi || "";
    const studyName = item.studyName;

    if (!rowsMap[genotypeId]) {
      rowsMap[genotypeId] = {
        accession,
        genotypeId,
        doi,
        studies: {},
      };
    }

    rowsMap[genotypeId].studies[studyName] = {
      selectedGigwaServer,
      programId,
      genotypeId,
      studyName,
    };
  });

  const rows = Object.values(rowsMap);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.headerCell}>Accession</th>
            <th className={styles.headerCell}>DOI</th>
            <th className={styles.headerCell}>GenotypeId</th>
            {studyNames.map((study) => (
              <th key={study} title={study} className={styles.headerCell}>
                {study}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.genotypeId}>
              <td className={styles.bodyCell}>{row.accession}</td>
              <td className={styles.bodyCell}>{row.doi}</td>
              <td className={styles.bodyCell}>{row.genotypeId}</td>
              {studyNames.map((study) => {
                const studyInfo = row.studies[study];

                return (
                  <td key={study} className={styles.tickCell}>
                    {studyInfo ? (
                      <a
                        href={`${studyInfo.selectedGigwaServer}/?module=${encodeURIComponent(
                          studyInfo.programId,
                        )}&ind=${encodeURIComponent(
                          studyInfo.genotypeId,
                        )}&project=${encodeURIComponent(studyInfo.studyName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.tickLink}
                        title={`Open ${studyInfo.studyName}`}
                      >
                        ✓
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SampleSourceTable;
