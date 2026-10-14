import { Fragment } from "react";

import styles from "./SampleSourceTable.module.css";

const SampleSourceTable = ({ sampleSourceData }) => {
  const studyNames = [
    ...new Set(sampleSourceData.map((item) => item.studyName)),
  ];

  const accessionGroups = new Map();
  const studyMetaMap = {};

  sampleSourceData.forEach((item, itemIndex) => {
    const selectedGigwaServer = item.selectedGigwaServer || "";
    const programId = item.variantSetDbIds?.[0]?.split("§")[0] || "";
    const genotypeId = item.germplasmDbId?.split("§")[1] || "";
    const accession = item.accessionNumber || "";
    const doi = item.doi || "";
    const studyName = item.studyName;
    // Keep records without an accession or genotype distinct instead of merging
    // every missing value into the same group/row.
    const accessionKey = accession
      ? `accession:${accession}`
      : `missing-accession:${itemIndex}`;
    const genotypeKey = genotypeId
      ? `genotype:${selectedGigwaServer}\u0000${genotypeId}`
      : `missing-genotype:${itemIndex}`;

    if (!accessionGroups.has(accessionKey)) {
      accessionGroups.set(accessionKey, {
        key: accessionKey,
        accession,
        doi,
        genotypes: new Map(),
      });
    }

    const accessionGroup = accessionGroups.get(accessionKey);

    if (!accessionGroup.doi && doi) {
      accessionGroup.doi = doi;
    }

    if (!accessionGroup.genotypes.has(genotypeKey)) {
      accessionGroup.genotypes.set(genotypeKey, {
        key: genotypeKey,
        genotypeId,
        studies: {},
      });
    }

    accessionGroup.genotypes.get(genotypeKey).studies[studyName] = true;

    if (!studyMetaMap[studyName]) {
      studyMetaMap[studyName] = {
        selectedGigwaServer,
        programId,
        studyName,
      };
    }
  });

  const groups = [...accessionGroups.values()].map((group) => ({
    ...group,
    genotypes: [...group.genotypes.values()],
  }));

  const renderStudyCells = (genotype) =>
    studyNames.map((study) => (
      <td key={study} className={styles.tickCell}>
        {genotype.studies[study] ? (
          <span className={styles.tickBadge}>✓</span>
        ) : (
          <span className={styles.noMembership}>—</span>
        )}
      </td>
    ));

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
                      href={`${studyMeta.selectedGigwaServer}/gigwa/?module=${encodeURIComponent(
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
          {groups.map((group) => {
            if (group.genotypes.length === 1) {
              const genotype = group.genotypes[0];

              return (
                <tr key={group.key}>
                  <td className={styles.bodyCell}>{group.accession}</td>
                  <td className={styles.bodyCell}>{group.doi}</td>
                  <td className={styles.bodyCell}>{genotype.genotypeId}</td>
                  {renderStudyCells(genotype)}
                </tr>
              );
            }

            return (
              <Fragment key={group.key}>
                <tr className={styles.groupHeaderRow}>
                  <td className={styles.bodyCell}>{group.accession}</td>
                  <td className={styles.bodyCell}>{group.doi}</td>
                  <td className={styles.bodyCell} />
                  {studyNames.map((study) => (
                    <td key={study} className={styles.tickCell} />
                  ))}
                </tr>
                {group.genotypes.map((genotype) => (
                  <tr key={genotype.key} className={styles.childRow}>
                    <td className={styles.childIndicator} aria-hidden="true">
                      ↳
                    </td>
                    <td className={styles.bodyCell} />
                    <td className={`${styles.bodyCell} ${styles.genotypeCell}`}>
                      {genotype.genotypeId}
                    </td>
                    {renderStudyCells(genotype)}
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SampleSourceTable;
