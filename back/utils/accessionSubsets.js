const { Op } = require("sequelize");

const CACHE_DATABASE_BATCH_SIZE = 1000;

const cleanAccessionNumbers = (accessionNumbers) => [
  ...new Set(
    (Array.isArray(accessionNumbers) ? accessionNumbers : [])
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean),
  ),
];

const accessionSubsetKey = (accessionNumber, instituteCode) =>
  `${instituteCode || ""}\u0000${accessionNumber || ""}`;

const normaliseSubsets = (subsets) =>
  Array.isArray(subsets)
    ? subsets
        .filter((subset) => subset && typeof subset === "object")
        .map((subset) => ({
          uuid: subset.uuid,
          title: subset.title,
        }))
    : [];

const normaliseRequests = (accessions) => {
  const requests = [];
  const seen = new Set();

  for (const item of Array.isArray(accessions) ? accessions : []) {
    const accessionNumber =
      typeof item === "string" ? item.trim() : item?.accessionNumber?.trim();
    const instituteCode =
      typeof item === "object" && typeof item?.instituteCode === "string"
        ? item.instituteCode.trim()
        : null;

    if (!accessionNumber) continue;

    const key = accessionSubsetKey(accessionNumber, instituteCode);
    if (seen.has(key)) continue;

    seen.add(key);
    requests.push({ accessionNumber, instituteCode });
  }

  return requests;
};

const createAccessionSubsetService = ({
  cacheModel,
  cacheLifetimeMs,
  fetchFromGenesys,
  now = () => new Date(),
}) => {
  if (!cacheModel || typeof fetchFromGenesys !== "function") {
    throw new Error("Subset cache model and Genesys fetch function are required.");
  }

  const readFreshRows = async (accessionNumbers, freshAfter) => {
    const rows = [];

    for (
      let start = 0;
      start < accessionNumbers.length;
      start += CACHE_DATABASE_BATCH_SIZE
    ) {
      const chunk = accessionNumbers.slice(
        start,
        start + CACHE_DATABASE_BATCH_SIZE,
      );
      const cachedRows = await cacheModel.findAll({
        where: {
          accessionNumber: { [Op.in]: chunk },
          lastFetchedAt: { [Op.gte]: freshAfter },
        },
        raw: true,
      });

      rows.push(...cachedRows);
    }

    return rows.map((row) => ({
      accessionNumber: row.accessionNumber,
      instituteCode: row.instituteCode,
      subsets: normaliseSubsets(row.subsets),
    }));
  };

  const saveRows = async (rows, fetchedAt) => {
    const uniqueRows = new Map();

    for (const row of rows) {
      uniqueRows.set(
        accessionSubsetKey(row.accessionNumber, row.instituteCode),
        {
          accessionNumber: row.accessionNumber,
          instituteCode: row.instituteCode || "",
          subsets: normaliseSubsets(row.subsets),
          lastFetchedAt: fetchedAt,
        },
      );
    }

    const updates = [...uniqueRows.values()];
    for (
      let start = 0;
      start < updates.length;
      start += CACHE_DATABASE_BATCH_SIZE
    ) {
      await cacheModel.bulkCreate(
        updates.slice(start, start + CACHE_DATABASE_BATCH_SIZE),
        {
          updateOnDuplicate: ["subsets", "lastFetchedAt", "updatedAt"],
        },
      );
    }
  };

  return async (accessions) => {
    const requests = normaliseRequests(accessions);
    if (requests.length === 0) return [];

    const accessionNumbers = [...new Set(requests.map((r) => r.accessionNumber))];
    const fetchedAt = now();
    const freshAfter = new Date(fetchedAt.getTime() - cacheLifetimeMs);
    const cachedRows = await readFreshRows(accessionNumbers, freshAfter);
    const requestsIncludeInstitutes = requests.every(
      (request) => request.instituteCode !== null,
    );

    if (requestsIncludeInstitutes) {
      const cachedMap = new Map(
        cachedRows.map((row) => [
          accessionSubsetKey(row.accessionNumber, row.instituteCode),
          row,
        ]),
      );
      const missingRequests = requests.filter(
        (request) =>
          !cachedMap.has(
            accessionSubsetKey(request.accessionNumber, request.instituteCode),
          ),
      );

      if (missingRequests.length > 0) {
        const missingNumbers = [
          ...new Set(missingRequests.map((request) => request.accessionNumber)),
        ];
        const genesysRows = (await fetchFromGenesys(missingNumbers)).map(
          (row) => ({
            accessionNumber: row.accessionNumber,
            instituteCode: row.instituteCode || "",
            subsets: normaliseSubsets(row.subsets),
          }),
        );
        const genesysMap = new Map(
          genesysRows.map((row) => [
            accessionSubsetKey(row.accessionNumber, row.instituteCode),
            row,
          ]),
        );
        const emptyRows = missingRequests
          .filter(
            (request) =>
              !genesysMap.has(
                accessionSubsetKey(
                  request.accessionNumber,
                  request.instituteCode,
                ),
              ),
          )
          .map((request) => ({ ...request, subsets: [] }));

        await saveRows([...genesysRows, ...emptyRows], fetchedAt);
        [...genesysRows, ...emptyRows].forEach((row) => {
          cachedMap.set(
            accessionSubsetKey(row.accessionNumber, row.instituteCode),
            row,
          );
        });
      }

      return requests.map(
        (request) =>
          cachedMap.get(
            accessionSubsetKey(request.accessionNumber, request.instituteCode),
          ) || { ...request, subsets: [] },
      );
    }

    const cachedNumbers = new Set(cachedRows.map((row) => row.accessionNumber));
    const missingNumbers = accessionNumbers.filter(
      (accessionNumber) => !cachedNumbers.has(accessionNumber),
    );
    let newRows = [];

    if (missingNumbers.length > 0) {
      const genesysRows = (await fetchFromGenesys(missingNumbers)).map((row) => ({
        accessionNumber: row.accessionNumber,
        instituteCode: row.instituteCode || "",
        subsets: normaliseSubsets(row.subsets),
      }));
      const returnedNumbers = new Set(
        genesysRows.map((row) => row.accessionNumber),
      );
      const emptyRows = missingNumbers
        .filter((accessionNumber) => !returnedNumbers.has(accessionNumber))
        .map((accessionNumber) => ({
          accessionNumber,
          instituteCode: "",
          subsets: [],
        }));

      newRows = [...genesysRows, ...emptyRows];
      await saveRows(newRows, fetchedAt);
    }

    return [...cachedRows, ...newRows].filter((row) =>
      accessionNumbers.includes(row.accessionNumber),
    );
  };
};

module.exports = {
  accessionSubsetKey,
  cleanAccessionNumbers,
  createAccessionSubsetService,
  normaliseSubsets,
};
