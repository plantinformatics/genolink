const DATASET_DOI_HEADERS = ["datasetDois", "datasetDoi"];

function parseDatasetDois(raw) {
  const header = DATASET_DOI_HEADERS.find((name) =>
    Object.prototype.hasOwnProperty.call(raw, name),
  );

  if (!header) return { supplied: false, dois: [] };

  const dois = [
    ...new Set(
      String(raw[header] || "")
        .split(/[;|]/)
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, ""))
        .filter(Boolean),
    ),
  ];

  return { supplied: true, dois };
}

async function setDatasetDois(db, sampleAccession, dois, transaction) {
  const datasetDoiRows = [];

  for (const Doi of dois) {
    const [datasetDoi] = await db.DatasetDoi.findOrCreate({
      where: { Doi },
      defaults: { Doi },
      transaction,
    });
    datasetDoiRows.push(datasetDoi);
  }

  await sampleAccession.setDatasetDois(datasetDoiRows, { transaction });
}

module.exports = { parseDatasetDois, setDatasetDois };
