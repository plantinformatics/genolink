const { Op } = require("sequelize");

const PLACEHOLDER_STATUSES = ["Pending", "TBC"];

const normalize = (value) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().replace(/\s+/g, " ");
  return normalized === "" ? null : normalized;
};

const isPlaceholder = (row) =>
  normalize(row.Sample) === null && PLACEHOLDER_STATUSES.includes(row.Status);

/**
 * Insert or update one real sample without disturbing other samples belonging to
 * the same accession. Pending/TBC rows without a sample are lifecycle
 * placeholders: the first real sample consumes one, and any remaining
 * placeholders are removed after the real row has been saved successfully.
 */
async function reconcileSampleAccession({
  db,
  incoming,
  transaction,
  setDatasetDois,
}) {
  const incomingSample = normalize(incoming.Sample);
  const existingRows = await db.SampleAccession.findAll({
    where: { Accession: incoming.Accession },
    order: [
      ["updatedAt", "DESC"],
      ["createdAt", "DESC"],
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const exact = existingRows.find(
    (row) => normalize(row.Sample) === incomingSample,
  );
  const placeholder =
    incomingSample === null ? null : existingRows.find(isPlaceholder);

  const values = {
    Accession: incoming.Accession,
    Sample: incomingSample,
    Status: incoming.Status,
  };

  if (incoming.hasServerUrl) {
    values.ServerUrl = normalize(incoming.ServerUrl);
  }

  let target = exact || placeholder;
  let action;

  if (target) {
    await target.update(values, { transaction });
    action = exact ? "updated" : "resolved-placeholder";
  } else {
    target = await db.SampleAccession.create(values, { transaction });
    action = "created";
  }

  if (incoming.hasDatasetDois) {
    await setDatasetDois(db, target, incoming.datasetDois, transaction);
  }

  let removedPlaceholders = 0;
  if (incomingSample !== null) {
    const obsoletePlaceholders = existingRows.filter(
      (row) => row.id !== target.id && isPlaceholder(row),
    );

    // A placeholder may already carry dataset metadata. Preserve it when the
    // incoming CSV did not explicitly provide a replacement DOI list.
    if (!incoming.hasDatasetDois && obsoletePlaceholders.length > 0) {
      const rowsWithDois = [target, ...obsoletePlaceholders];
      const doiGroups = await Promise.all(
        rowsWithDois.map((row) =>
          row.getDatasetDois({
            attributes: ["Doi"],
            joinTableAttributes: [],
            transaction,
          }),
        ),
      );
      const dois = [
        ...new Set(
          doiGroups.flat().map((datasetDoi) => datasetDoi.Doi).filter(Boolean),
        ),
      ];

      if (dois.length > 0) {
        await setDatasetDois(db, target, dois, transaction);
      }
    }

    const obsoleteIds = obsoletePlaceholders.map((row) => row.id);
    if (obsoleteIds.length > 0) {
      removedPlaceholders = await db.SampleAccession.destroy({
        where: {
          id: { [Op.in]: obsoleteIds },
          Accession: incoming.Accession,
          Sample: { [Op.is]: null },
          Status: { [Op.in]: PLACEHOLDER_STATUSES },
        },
        transaction,
      });
    }
  }

  return { target, action, removedPlaceholders };
}

module.exports = {
  PLACEHOLDER_STATUSES,
  normalize,
  reconcileSampleAccession,
};
