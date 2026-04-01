import styles from "./SampleSourceTable.module.css";

const SampleSourceTable = ({ sampleSourceData }) => {
  const studyNames = [
    ...new Set(sampleSourceData.map((item) => item.studyName)),
  ];

  const rowsMap = {};
  const studyMetaMap = {};

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

    rowsMap[genotypeId].studies[studyName] = true;

    if (!studyMetaMap[studyName]) {
      studyMetaMap[studyName] = {
        selectedGigwaServer,
        programId,
        studyName,
      };
    }
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
            {studyNames.map((study) => {
              const studyMeta = studyMetaMap[study];

              return (
                <th key={study} title={study} className={styles.headerCell}>
                  {studyMeta ? (
                    <a
                      href={`${studyMeta.selectedGigwaServer}/?module=${encodeURIComponent(
                        studyMeta.programId,
                      )}&project=${encodeURIComponent(studyMeta.studyName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.headerLink}
                      title={`Open ${studyMeta.studyName}`}
                    >
                      {study}
                    </a>
                  ) : (
                    study
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.genotypeId}>
              <td className={styles.bodyCell}>{row.accession}</td>
              <td className={styles.bodyCell}>{row.doi}</td>
              <td className={styles.bodyCell}>{row.genotypeId}</td>
              {studyNames.map((study) => (
                <td key={study} className={styles.tickCell}>
                  {row.studies[study] ? (
                    <span className={styles.tickBadge}>✓</span>
                  ) : (
                    ""
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SampleSourceTable;
