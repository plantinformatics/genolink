import { useState } from "react";
import "../../tableStyles.css";
import { useSelector, useDispatch } from "react-redux";
import LoadingComponent from "../LoadingComponent";
import { setCheckedAccessions, setCheckedAccessionNames } from "../../actions";
import { genesysApi } from "../../pages/Home";

const MetadataSearchResultTable = ({ filterCode, hasGenotype, filterBody }) => {
  const searchResults = useSelector((state) => state.searchResults);
  const totalAccessions = useSelector((state) => state.totalAccessions);
  const totalPreGenotypedAccessions = useSelector(
    (state) => state.totalPreGenotypedAccessions
  );
  const currentPage = useSelector((state) => state.currentPage);

  const [isPaginating, setIsPaginating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [remainingPages, setRemainingPages] = useState(
    Math.floor(
      (hasGenotype ? totalPreGenotypedAccessions : totalAccessions) / 500
    )
  );
  const dispatch = useDispatch();
  const checkedAccessions = useSelector((state) => state.checkedAccessions);
  const checkedAccessionNames = useSelector(
    (state) => state.checkedAccessionNames
  );
  const isLoadingGenotypedAccessions = useSelector(
    (state) => state.isLoadingGenotypedAccessions
  );

  function getSampleStatus(number) {
    const sampStatMapping = {
      100: "Wild",
      110: "Natural",
      120: "Semi-natural/wild",
      130: "Semi-natural/sown",
      200: "Weedy",
      300: "Traditional cultivar/Landrace",
      400: "Breeding/Research Material",
      410: "Breeders Line",
      411: "Synthetic population",
      412: "Hybrid",
      413: "Founder stock/base population",
      414: "Inbred line",
      415: "Segregating population",
      416: "Clonal selection",
      420: "Genetic stock",
      421: "Mutant",
      422: "Cytogenetic stocks",
      423: "Other genetic stocks",
      500: "Advanced/improved cultivar",
      600: "GMO",
      999: "Other",
    };

    const key = String(number);

    return sampStatMapping[key] || "Unknown status";
  }

  const handleCheckboxChange = (item) => {
    const newCheckedAccessions = { ...checkedAccessions };
    const newCheckedAccessionNames = { ...checkedAccessionNames };

    if (newCheckedAccessions[item.accessionNumber]) {
      delete newCheckedAccessions[item.accessionNumber];
      delete newCheckedAccessionNames[item.accessionNumber];
    } else {
      newCheckedAccessions[item.accessionNumber] = true;
      newCheckedAccessionNames[item.accessionNumber] = item.accessionName;
    }

    dispatch(setCheckedAccessions(newCheckedAccessions));
    dispatch(setCheckedAccessionNames(newCheckedAccessionNames));
  };

  const handleSelectAllChange = () => {
    const newCheckedAccessions = {};
    const newCheckedAccessionNames = {};

    if (selectAll) {
      dispatch(setCheckedAccessions({}));
      dispatch(setCheckedAccessionNames({}));
    } else {
      searchResults?.forEach((item) => {
        newCheckedAccessions[item.accessionNumber] = true;
        newCheckedAccessionNames[item.accessionNumber] = item.accessionName;
      });
      dispatch(setCheckedAccessions(newCheckedAccessions));
      dispatch(setCheckedAccessionNames(newCheckedAccessionNames));
    }

    setSelectAll(!selectAll);
  };

  const fetchMore = async () => {
    try {
      setIsPaginating(true);
      await genesysApi.fetchMoreResults({
        filterCode,
        currentPage,
        pageSize: 500,
        dispatch,
        searchResults,
        hasGenotype,
      });
      setRemainingPages((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Error fetching more results:", error);
    } finally {
      setIsPaginating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (dateStr && dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${day}-${month}-${year}`;
    }
    return dateStr || "";
  };

  const handleRowClick = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const handleExportPassportData = async () => {
    try {
      setIsDownloading(true);
      if (Object.keys(filterBody).length === 0) {
        alert("Please apply filters before exporting data.");
        return;
      }
      await genesysApi.downloadFilteredData(filterBody, hasGenotype);
      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      console.error("Error exporting passport data:", error);
      alert("Failed to export passport data. Please try again.");
    }
  };

  return (
    <>
      <div style={{ maxHeight: "600px", overflowY: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse" }}
          className="table table-bordered table-hover"
        >
          <thead
            style={{
              backgroundColor: "lightblue",
              position: "sticky",
              top: "0",
              zIndex: 2,
            }}
          >
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllChange}
                />
              </th>
              <th>#</th>
              <th scope="col">Institute Code</th>
              <th scope="col">Holding Institute</th>
              <th scope="col">Accession Number</th>
              <th scope="col">Accession Name</th>
              <th scope="col">Aliases</th>
              <th scope="col">Taxonomy</th>
              <th scope="col">Crop Name</th>
              <th scope="col">Biological status of accession</th>
              <th scope="col">Donor Institute</th>
              <th scope="col">Provenance of Material</th>
              <th scope="col">Acquisition Date</th>
              <th scope="col">DOI</th>
              <th scope="col">Last Updated</th>
              <th scope="col">isGenotyped</th>
              <th scope="col">GenotypeID</th>
            </tr>
          </thead>
          <tbody>
            {searchResults?.map((item, index) => {
              const genotypedIndex = Array.isArray(
                genesysApi.genotypedAccessions
              )
                ? genesysApi.genotypedAccessions.indexOf(item.accessionNumber)
                : -1;
              const isGenotyped = genotypedIndex !== -1;
              const genotypeID =
                isGenotyped && Array.isArray(genesysApi.genotypedSamples)
                  ? genesysApi.genotypedSamples[genotypedIndex]
                  : "N/A";

              return (
                <tr
                  key={item.uuid || item.id || index}
                  style={{
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => handleRowClick(index)}
                >
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checkedAccessions[item.accessionNumber] || false}
                      onChange={() => handleCheckboxChange(item)}
                    />
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {index + 1}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item.instituteCode || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item["institute.fullName"]
                      ? item["institute.fullName"]
                      : ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    <a
                      href={`https://www.genesys-pgr.org/a/${item.uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.accessionNumber || ""}
                    </a>
                  </td>

                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item.accessionName || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item.aliases && item.aliases.length > 0
                      ? item.aliases
                          .filter((alias) => alias.aliasType !== "ACCENAME")
                          .map(
                            (alias) =>
                              `${alias.name}${
                                alias.usedBy ? ` ${alias.usedBy}` : ""
                              }`
                          )
                          .join(", ")
                      : ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item["taxonomy.taxonName"] || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item.cropName || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {getSampleStatus(item.sampStat) || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item.donorName && item.donorCode
                      ? `${item.donorName}, ${item.donorCode}`
                      : item.donorName
                      ? item.donorName
                      : item.donorCode || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item["countryOfOrigin.name"] || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {formatDate(item.acquisitionDate)}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item.doi || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {item.lastModifiedDate || ""}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {isGenotyped ? "Yes" : "No"}
                  </td>
                  <td
                    className="cell"
                    style={{
                      overflow: expandedRow === index ? "visible" : "hidden",
                      whiteSpace: expandedRow === index ? "normal" : "nowrap",
                    }}
                  >
                    {genotypeID}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isPaginating &&
        !isLoadingGenotypedAccessions &&
        (remainingPages > 0 ? (
          <button type="button" className="btn btn-primary" onClick={fetchMore}>
            More Results ({remainingPages})
          </button>
        ) : null)}
      {isDownloading ? (
        <LoadingComponent />
      ) : (
        <button
          onClick={handleExportPassportData}
          className="btn btn-primary"
          style={{ marginLeft: "10px" }}
        >
          Export All Passport Data
        </button>
      )}
    </>
  );
};

export default MetadataSearchResultTable;
