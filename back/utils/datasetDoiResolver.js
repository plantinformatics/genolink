const DATASET_DOI_MAPPINGS = require("../config/datasetDoiMappings");

function accessionTokens(accession) {
  return String(accession)
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

function resolveDatasetInfoForAccession(accession) {
  const tokenSet = new Set(accessionTokens(accession));
  const mapping = DATASET_DOI_MAPPINGS.find((entry) =>
    tokenSet.has(String(entry.cropCode).toUpperCase()),
  );

  if (!mapping || !Array.isArray(mapping.datasetInfo)) {
    return null;
  }

  return mapping.datasetInfo.map((item) => ({ ...item }));
}

function resolveDatasetInfoForAccessions(accessions) {
  if (!Array.isArray(accessions)) {
    return {};
  }

  const result = {};
  const seen = new Set();

  accessions.forEach((accession) => {
    if (typeof accession !== "string") {
      return;
    }

    const cleaned = accession.trim();
    if (!cleaned || seen.has(cleaned)) {
      return;
    }

    seen.add(cleaned);
    result[cleaned] = resolveDatasetInfoForAccession(cleaned);
  });

  return result;
}

module.exports = {
  DATASET_DOI_MAPPINGS,
  resolveDatasetInfoForAccessions,
};
