import { useState } from "react";
import "../../tableStyles.css";
import { useSelector, useDispatch } from "react-redux";
import LoadingComponent from "../LoadingComponent";
import { genesysServer } from "../../config/apiConfig";
import {
  setCurrentPage,
  setSearchResults,
  setCheckedAccessions,
  setCheckedAccessionNames,
} from "../../actions";
import axios from "axios";
import { useAuth } from "react-oidc-context";

const MetadataSearchResultTable = ({ filterCode }) => {
  const auth = useAuth();
  const searchResults = useSelector((state) => state.searchResults);
  const totalAccessions = useSelector((state) => state.totalAccessions);
  const currentPage = useSelector((state) => state.currentPage);

  const [isPaginating, setIsPaginating] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const dispatch = useDispatch();
  const checkedAccessions = useSelector((state) => state.checkedAccessions);
  const checkedAccessionNames = useSelector((state) => state.checkedAccessionNames);

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
      searchResults?.content.forEach((item) => {
        newCheckedAccessions[item.accessionNumber] = true;
        newCheckedAccessionNames[item.accessionNumber] = item.accessionName;
      });
      dispatch(setCheckedAccessions(newCheckedAccessions));
      dispatch(setCheckedAccessionNames(newCheckedAccessionNames));
    }
  
    setSelectAll(!selectAll);
  };
  

  const fetchMoreResults = () => {
    const token = auth.user?.access_token;
    const pageSize = 500;
    const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases";

    if (currentPage !== undefined && currentPage !== null) {

      setIsPaginating(true);
      const GENESYS_API_URL = filterCode
        ? `${genesysServer}/api/v1/acn/query?f=${filterCode}&p=${currentPage + 1
        }&l=${pageSize}&select=${select}`
        : `${genesysServer}/api/v1/acn/query?p=${currentPage + 1
        }&l=${pageSize}&select=${select}`

      axios
        .post(GENESYS_API_URL, null, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
          },
        })
        .then((response) => {
          dispatch(
            setSearchResults({
              ...searchResults,
              content: [...searchResults.content, ...response.data.content],
            })
          );
          dispatch(setCurrentPage(currentPage + 1));
          setIsPaginating(false);
        })
        .catch((error) => {
          console.error("Error fetching more data:", error);
          setIsPaginating(false);
        });
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




  return (
    <>
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} className="table table-bordered table-hover">
          <thead style={{ backgroundColor: 'lightblue', position: 'sticky', top: '0', zIndex: 2 }}>
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
              <th scope="col">Provenance of Material</th>
              <th scope="col">Acquisition Date</th>
              <th scope="col">DOI</th>
              <th scope="col">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {searchResults?.content.map((item, index) => (
              <tr
                key={item.uuid || item.id || index}
                style={{
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
                onClick={() => handleRowClick(index)}
              >
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
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
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {index + 1}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item.instituteCode || ""}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item["institute.fullName"] ? (
                    item["institute.fullName"]
                  ) : (
                    ""
                  )}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
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
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item.accessionName || ""}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item.aliases && item.aliases.length > 0
                    ? item.aliases
                      .filter(alias => alias.aliasType !== "ACCENAME")
                      .map(alias => (
                        `${alias.name}${alias.usedBy ? ` ${alias.usedBy}` : ''}`
                      )).join(', ')
                    : ""}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item["taxonomy.taxonName"] || ""}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item.cropName || ""}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item["countryOfOrigin.name"] || ""}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {formatDate(item.acquisitionDate)}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item.doi || ""}
                </td>
                <td
                  className="cell"
                  style={{
                    overflow: expandedRow === index ? 'visible' : 'hidden',
                    whiteSpace: expandedRow === index ? 'normal' : 'nowrap',
                  }}
                >
                  {item.lastModifiedDate || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isPaginating ? (
        <LoadingComponent />
      ) : totalAccessions > 50 ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={fetchMoreResults}
        >
          More Results
        </button>
      ) : null}
    </>
  );
};

export default MetadataSearchResultTable;
