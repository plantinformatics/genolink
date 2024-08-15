import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const Institute = () => {
  const searchResults = useSelector((state) => state.searchResults);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const instituteId = queryParams.get("id");

  const filteredSearchResults = searchResults.content.filter(
    (item) => item.institute?.id == instituteId || item.institute == instituteId
  );
  const instituteCode = filteredSearchResults.find(
    (item) => item.instituteCode
  )?.instituteCode;

  const type = filteredSearchResults.find((item) => item.institute?.type)
    ?.institute?.type;

  const country = filteredSearchResults.find(
    (item) => item.institute?.country?.name
  )?.institute?.country?.name;

  const url = filteredSearchResults.find((item) => item.institute?.url)
    ?.institute?.url;

  const dataProvider = filteredSearchResults.find(
    (item) => item.institute?.owner?.name
  )?.institute?.owner?.name;

  const accessionCount = filteredSearchResults.find(
    (item) => item.institute?.accessionCount
  )?.institute?.accessionCount;

  return (
    <table className="table table-bordered table-hover">
      <thead className="thead-light" style={{ backgroundColor: "lightblue" }}>
        <tr>
          <th scope="col">Institute Code</th>
          <th scope="col">Type</th>
          <th scope="col">Country</th>
          <th scope="col">Web link</th>
          <th scope="col">Data provider</th>
          <th scope="col">Accessions in Genesys</th>
        </tr>
      </thead>
      <tbody>
        {
          <tr>
            <td>{instituteCode || ""}</td>
            <td>{type || ""}</td>
            <td>{country || ""}</td>
            <td>
              <a href={url || ""}>{url || ""}</a>
            </td>
            <td>{dataProvider || ""}</td>
            <td>{accessionCount || ""}</td>
          </tr>
        }
      </tbody>
    </table>
  );
};

export default Institute;
