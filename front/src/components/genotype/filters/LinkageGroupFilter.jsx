const fetchLinkageGroups = async (
  platform,
  genolinkGigwaApi,
  genolinkGerminateApi,
  selectedStudyDbId,
  selectedGigwaServer,
  checkedAccessionsObject
) => {
  try {
    if (platform === "Gigwa") {
      return await genolinkGigwaApi.fetchGigwaLinkageGroups(
        selectedGigwaServer,
        selectedStudyDbId
      );
    } else if (platform === "Germinate") {
      const accession = Object.keys(checkedAccessionsObject)[0];
      return await genolinkGerminateApi.fetchGerminateLinkageGroups(
        germinateUsername,
        germinatePassword,
        accession
      );
    }
  } catch (error) {
    console.error("Error fetching linkage groups:", error);
  }
  return [];
};

export const linkageGroupFilter = ({
  selectedStudyDbId,
  genolinkGigwaApi,
  genolinkGerminateApi,
  selectedGigwaServer,
  platform,
  checkedAccessionsObject,
}) => {
  return fetchLinkageGroups(
    platform,
    genolinkGigwaApi,
    genolinkGerminateApi,
    selectedStudyDbId,
    selectedGigwaServer,
    checkedAccessionsObject
  );
};
