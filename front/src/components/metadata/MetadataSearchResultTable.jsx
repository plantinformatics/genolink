import { useState } from "react";
import { Link } from "react-router-dom";
import "../../tableStyles.css";
import { useSelector, useDispatch } from "react-redux";
import LoadingComponent from "../LoadingComponent";
import {
  setCurrentPage,
  setSearchResults,
  setCheckedAccessions,
} from "../../actions";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const MetadataSearchResultTable = ({ filterCode }) => {
  const auth = useAuth();
  const searchResults = useSelector((state) => state.searchResults);
  const totalAccessions = useSelector((state) => state.totalAccessions);
  const currentPage = useSelector((state) => state.currentPage);

  const [isPaginating, setIsPaginating] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const checkedAccessions = useSelector((state) => state.checkedAccessions);

  const handleCheckboxChange = (item) => {
    const newCheckedAccessions = { ...checkedAccessions };

    if (newCheckedAccessions[item.accessionNumber]) {
      delete newCheckedAccessions[item.accessionNumber];
    } else {
      newCheckedAccessions[item.accessionNumber] = true;
    }

    dispatch(setCheckedAccessions(newCheckedAccessions));
  };

  const handleSelectAllChange = () => {
    if (selectAll) {
      dispatch(setCheckedAccessions({}));
    } else {
      const newCheckedAccessions = {};
      searchResults?.content.forEach((item) => {
        newCheckedAccessions[item.accessionNumber] = true;
      });
      dispatch(setCheckedAccessions(newCheckedAccessions));
    }
    setSelectAll(!selectAll);
  };

  const fetchMoreResults = () => {
    const token = auth.user?.access_token;
    const pageSize = 500;
    const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,institute.country.name";

    if (currentPage !== undefined && currentPage !== null) {

      setIsPaginating(true);
      const GENESYS_API_URL = filterCode
        ?     `https://api.sandbox.genesys-pgr.org/api/v1/acn/query?f=${filterCode}&p=${currentPage + 1
      }&l=${pageSize}&select=${select}`
        :     `https://api.sandbox.genesys-pgr.org/api/v1/acn/query?p=${currentPage + 1
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
  return (
    <>
      <div style={{ position: "sticky", top: "0", background: "white", zIndex: "11", display: "inline-block" }}>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate("/GenotypeMetadataExplorer")}
          disabled={Object.keys(checkedAccessions).length === 0}
        >
          View
        </button>
      </div>
      <table className="table table-bordered table-hover">
        <thead className="thead-light" style={{ backgroundColor: "lightblue" }}>
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
            <tr key={item.uuid || item.id || index}>
              <td className="cell">
                <input
                  type="checkbox"
                  checked={checkedAccessions[item.accessionNumber] || false}
                  onChange={() => handleCheckboxChange(item)}
                />
              </td>
              <td className="cell">{index + 1}</td>
              <td className="cell">{item.instituteCode || ""}</td>
              <td className="cell">
                {item["institute.fullName"] ? (
                  <Link
                    to={{
                      pathname: "institute",
                      search: `?id=${item["institute.id"]}`,
                    }}
                  >
                    {item["institute.fullName"]}
                  </Link>
                ) : (
                  ""
                )}
              </td>
              <td className="cell">
                {" "}
                <Link
                  to={{ pathname: "accession", search: `?uuid=${item.uuid}` }}
                >
                  {item.accessionNumber || ""}
                </Link>
              </td>
              <td className="cell">{item.accessionName || ""}</td>
              <td className="cell">{item["taxonomy.taxonName"] || ""}</td>
              <td className="cell">{item.cropName || ""}</td>
              <td className="cell">{item["countryOfOrigin.name"] || ""}</td>
              <td className="cell">{formatDate(item.acquisitionDate)}</td>
              <td className="cell">{item.doi || ""}</td>
              <td className="cell">{item.lastModifiedDate || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
