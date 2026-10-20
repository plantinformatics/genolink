const { Op } = require("sequelize");
const db = require("../models");

async function resolvePreferredAliasesForAccessions(accessions) {
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
  const result = Object.fromEntries(
    cleaned.map((accession) => [accession, null]),
  );

  if (cleaned.length === 0) return result;

  const rows = await db.SampleAccession.findAll({
    attributes: ["Accession", "PreferredAlias"],
    where: {
      Accession: { [Op.in]: cleaned },
      PreferredAlias: { [Op.ne]: null },
    },
    order: [["id", "ASC"]],
    raw: true,
  });

  rows.forEach((row) => {
    const preferredAlias = String(row.PreferredAlias ?? "").trim();
    if (!preferredAlias || result[row.Accession]) return;
    result[row.Accession] = preferredAlias;
  });

  return result;
}

module.exports = {
  resolvePreferredAliasesForAccessions,
};
