const { Op } = require("sequelize");
const db = require("../models");

async function resolveDatasetInfoForAccessions(accessions) {
  if (!Array.isArray(accessions)) {
    return {};
  }

  const cleaned = [
    ...new Set(
      accessions
        .filter((accession) => typeof accession === "string")
        .map((accession) => accession.trim())
        .filter(Boolean),
    ),
  ];
  const result = Object.fromEntries(cleaned.map((accession) => [accession, []]));

  if (cleaned.length === 0) return result;

  const rows = await db.SampleAccession.findAll({
    attributes: ["Accession"],
    where: { Accession: { [Op.in]: cleaned } },
    include: [
      {
        model: db.DatasetDoi,
        as: "DatasetDois",
        attributes: ["Doi"],
        through: { attributes: [] },
        required: true,
      },
    ],
  });

  const seenByAccession = new Map();
  rows.forEach((row) => {
    if (!result[row.Accession]) result[row.Accession] = [];
    if (!seenByAccession.has(row.Accession)) {
      seenByAccession.set(row.Accession, new Set());
    }

    row.DatasetDois.forEach(({ Doi }) => {
      if (!Doi || seenByAccession.get(row.Accession).has(Doi)) return;
      seenByAccession.get(row.Accession).add(Doi);
      result[row.Accession].push({
        doi: Doi,
        url: `https://doi.org/${encodeURIComponent(Doi).replace(/%2F/g, "/")}`,
      });
    });
  });

  return result;
}

module.exports = {
  resolveDatasetInfoForAccessions,
};
