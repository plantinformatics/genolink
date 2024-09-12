import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { Button, Collapse, Card } from "react-bootstrap";
import { setPlatform } from "../actions";

import GenotypeSearchResultsTable from "../components/genotype/GenotypeSearchResultsTable";
import LoadingComponent from "../components/LoadingComponent";
import LinkageGroupFilter from "../components/genotype/filters/LinkageGroupFilter";
import PositionRangeFilter from "../components/genotype/filters/PositionRangeFilter";
import VariantListFilter from "../components/genotype/filters/VariantListFilter";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";

import {
  searchSamplesInDatasets,
  fetchVariants,
} from "../api/genolinkGigwaApi";
import { fetchCallsetDataForAccession } from "../api/genolinkGerminateApi";

const GenotypeMetadataExplorer = () => {
  const [selectedOption, setSelectedOption] = useState("Gigwa");
  const [posStart, setPosStart] = useState("");
  const [posEnd, setPosEnd] = useState("");
  const [genomData, setGenomData] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState([]);
  const [sampleDetails, setSampleDetails] = useState([]);
  const [selectedSamplesDetails, setSelectedSamplesDetails] = useState([]);
  const [isGenomeSearchSubmit, setIsGenomeSearchSubmit] = useState(false);
  const [isGenomDataLoading, setIsGenomDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [samples, setSamples] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [showSearchTypeSelector, setShowSearchTypeSelector] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [openDrawerId, setOpenDrawerId] = useState(null);
  const [searchType, setSearchType] = useState("PositionRange");
  const [variantList, setVariantList] = useState([]);

  const searchResults = useSelector((state) => state.searchResults);
  const checkedAccessionsObject = useSelector(
    (state) => state.checkedAccessions
  );
  const checkedAccessions = Object.keys(checkedAccessionsObject);
  const checkedResults = searchResults.content.filter((item) =>
    checkedAccessions.includes(item.accessionNumber)
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedOption === "Gigwa" && isGenomeSearchSubmit) {
      fetchData(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    setGenomData("");
  }, [selectedOption]);

  const toggleDrawer = (id) => {
    setOpenDrawerId(openDrawerId === id ? null : id);
  };

  const handleDatasetDetails = (dataset) => {
    setSelectedSamplesDetails(
      sampleDetails.filter(
        (sample) =>
          sample.studyDbId ===
            `${dataset.split("§")[0]}§${dataset.split("§")[1]}` &&
          sample.sampleName.split("-").slice(-1)[0] === dataset.split("§")[2]
      )
    );
    setSelectedDataset(dataset);
  };

  const handleSearch = async () => {
    setIsGenomDataLoading(true);
    if (!username || !password) {
      alert("Please enter username and password");
      setIsGenomDataLoading(false);
      return;
    }

    try {
      if (selectedOption === "Gigwa") {
        if (!isGenomeSearchSubmit) {
          const Accessions = checkedResults.map((item) => item.accessionNumber);
          const sampleDetails = await searchSamplesInDatasets(
            username,
            password,
            Accessions
          );
          setDatasets([
            ...new Set(
              sampleDetails.map(
                (sample) =>
                  `${sample.studyDbId}§${
                    sample.sampleName.split("-").slice(-1)[0]
                  }`
              )
            ),
          ]);
          setSampleDetails(sampleDetails);
          setIsGenomeSearchSubmit(true);
          setShowLogin(false);
          setShowSearchTypeSelector(true);
          setShowDatasetSelector(true);
        }
        if (selectedSamplesDetails.length > 0) {
          console.log(selectedSamplesDetails);
          fetchData(1);
          setCurrentPage(1);
        }
      } else if (selectedOption === "Germinate") {
        fetchData(1);
      }
    } catch (error) {
      let message = "An unexpected error occurred.";
      if (axios.isAxiosError(error)) {
        const status = error.response ? error.response.status : null;
        switch (status) {
          case 401: // Unauthorized
            message = "Authentication failed: Incorrect username or password.";
            break;
          case 403: // Forbidden
            message = "Access denied: You do not have permission to access these resources. Please check your credentials.";
            break;
          default:
            message = "An error occurred: " + (error.message || "Unknown error");
            break;
        }
      }
      alert(message);
    }

    setIsGenomDataLoading(false);
  };

  const fetchData = async (page) => {
    setIsGenomDataLoading(true);
    try {
      if (selectedOption === "Gigwa") {
        const data = await fetchVariants({
          username: username,
          password: password,
          variantList: variantList,
          selectedSamplesDetails: selectedSamplesDetails,
          variantPage: page - 1,
          linkagegroups: selectedGroups.join(";"),
          start: posStart || -1,
          end: posEnd || -1,
        });
        setGenomData(data.data);
        setSamples(data.desiredSamples);
        setShowSearchTypeSelector(false);
        setShowDatasetSelector(false);
      } else if (selectedOption === "Germinate") {
        const Accessions = checkedResults.map((item) => item.accessionNumber);
        const responses = await Promise.all(
          Accessions.map((accession) =>
            fetchCallsetDataForAccession(
              username,
              password,
              accession,
              selectedGroups,
              posStart,
              posEnd
            )
          )
        );
        const allGenomicData = responses.map((response) => response.data);
        setGenomData(allGenomicData);
      }
    } catch (error) {
      alert("An error occurred: " + error.message);
    }
    setIsGenomDataLoading(false);
  };

  const handleSelectChange = (event) => {
    setIsGenomeSearchSubmit(false);
    const newSelectedOption = event.target.value;
    setSelectedOption(newSelectedOption);
    dispatch(setPlatform(newSelectedOption));
  };

  const handleSearchTypeChange = (newType) => {
    if (newType !== searchType) {
      if (newType === "PositionRange") {
        // Clear VariantIDs related data
        setVariantList([]);
      } else if (newType === "VariantIDs") {
        // Clear PositionRange related data
        setPosStart("");
        setPosEnd("");
      }
    }
    setSearchType(newType); // Update the search type
  };

  return (
    <div className="geno-data-container">
      <div className="row">
        <div className="col-md-6">
          <h2>Metadata</h2>
          {checkedResults?.map((item, index) => (
            <React.Fragment key={index}>
              <div className="col-md-3">
                <Button
                  className="w-100 mb-2"
                  onClick={() => toggleDrawer(item.accessionNumber)}
                  aria-controls={`collapse${item.accessionNumber}`}
                  aria-expanded={openDrawerId === item.accessionNumber}
                >
                  {item.accessionNumber}
                </Button>
              </div>
              <Collapse in={openDrawerId === item.accessionNumber}>
                <div id={`collapse${item.accessionNumber}`}>
                  <Card.Body>
                    <br />
                    <h3>{item.accessionNumber}</h3>
                    <hr />
                    <div className="row">
                      <div className="col border-right bg-light">
                        {item.doi && <div className="col-label">DOI</div>}
                        <div className="col-label">Accession number</div>
                        <div className="col-label">Holding institute</div>
                        <div className="col-label">Institute code</div>
                        <div className="col-label">Data provider</div>
                        <div className="col-label">Acquisition Date</div>
                      </div>
                      <div className="col-auto">
                        {item.doi && <div>{item.doi}</div>}
                        <div>{item.accessionNumber || ""}</div>
                        <div>{item.institute.fullName || ""}</div>
                        <div>{item.instituteCode || ""}</div>
                        <div>{item.institute.owner?.name || ""}</div>
                        <div>{item.acquisitionDate || ""}</div>
                      </div>
                    </div>

                    <h3> Taxonomy provided to Genesys</h3>
                    <hr />
                    <div className="row">
                      <div className="col border-right bg-light">
                        <div className="col-label">Genus</div>
                        <div className="col-label">Specific epithet</div>
                        <div className="col-label">Scientific name</div>
                        <div className="col-label">Crop name</div>
                      </div>
                      <div className="col border-right bg-light">
                        <div>{item.genus || ""}</div>
                        <div>
                          {item.taxonomy.grinTaxonomySpecies?.speciesName || ""}
                        </div>
                        <div>
                          {item.taxonomy.grinTaxonomySpecies?.name || ""}
                        </div>
                        <div>{item.crop?.name || ""}</div>
                      </div>
                    </div>

                    <h3> GRIN Taxonomy</h3>
                    <hr />
                    <div className="row">
                      <div className="col border-right bg-light">
                        <div className="col-label">Matched GRIN taxon</div>
                      </div>
                      <div className="col border-right bg-light">
                        <div>
                          <a
                            href={`https://npgsweb.ars-grin.gov/gringlobal/taxon/taxonomydetail?id=${item.taxonomy.grinTaxonomySpecies?.id}`}
                          >
                            {item.taxonomy.grinTaxonomySpecies?.name || ""}
                          </a>
                        </div>
                      </div>
                    </div>

                    <h3> Accession names</h3>
                    <hr />
                    <div className="row">
                      <div className="col border-right bg-light">
                        <div className="col-label">Accession name</div>
                      </div>
                      <div className="col border-right bg-light">
                        <div>{item.accessionName || ""}</div>
                      </div>
                    </div>
                    <h3> Metadata</h3>
                    <hr />
                    <div className="row">
                      <div className="col border-right bg-light">
                        <div className="col-label">UUID</div>
                        <div className="col-label">Last updated</div>
                        <div className="col-label">Created</div>
                      </div>
                      <div className="col border-right bg-light">
                        <div>{item.uuid || ""}</div>
                        <div>{item.institute.owner?.lastModifiedDate}</div>
                        <div>
                          {item.institute.owner?.createdDate ||
                            "Date not provided"}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </div>
              </Collapse>
            </React.Fragment>
          ))}
        </div>

        <div className="col-md-6">
          {checkedResults && (
            <div className="geno-data">
              <h2>Genotype Data</h2>
              <br />
              {isGenomDataLoading && <LoadingComponent />}
              {!isGenomDataLoading && (
                <div>
                  <div className="search-container">
                    <select
                      className="form-select"
                      onChange={handleSelectChange}
                      value={selectedOption}
                    >
                      {["Gigwa", "Germinate"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button-primary"
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                  </div>
                  {showLogin && (
                    <>
                      <div className="input-group mb-3">
                        <span className="input-group-addon">
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                      <div className="input-group mb-3">
                        <span className="input-group-addon">
                          <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {isGenomeSearchSubmit &&
                    selectedOption === "Gigwa" &&
                    showDatasetSelector && (
                      <div className="dataset-selector">
                        <label style={{ marginRight: "10px" }}>
                          Select Dataset:
                        </label>{" "}
                        {datasets.map((dataset) => (
                          <button
                            key={dataset}
                            onClick={() => handleDatasetDetails(dataset)}
                            style={{
                              backgroundColor:
                                selectedDataset === dataset
                                  ? "lightblue"
                                  : "initial",
                              marginLeft: "5px",
                            }}
                          >
                            {dataset}
                          </button>
                        ))}
                      </div>
                    )}
                  {/* {isGenomeSearchSubmit && genomData ? ( */}
                  {showDatasetSelector && (
                    <div className="filter-container">
                      <LinkageGroupFilter
                        selectedDataset={selectedDataset}
                        selectedGroups={selectedGroups}
                        setSelectedGroups={setSelectedGroups}
                        username={username}
                        password={password}
                      />
                    </div>
                  )}
                  {showSearchTypeSelector && (
                    <select
                      className="form-select"
                      value={searchType}
                      onChange={(e) => handleSearchTypeChange(e.target.value)} // Step 3: Handle changes
                      style={{ marginRight: "10px" }}
                    >
                      <option value="PositionRange">PositionRange</option>
                      <option value="VariantIDs">VariantIDs</option>
                    </select>
                  )}
                  {showSearchTypeSelector &&
                    (searchType === "PositionRange" ? (
                      <PositionRangeFilter
                        posStart={posStart}
                        setPosStart={setPosStart}
                        posEnd={posEnd}
                        setPosEnd={setPosEnd}
                      />
                    ) : (
                      <VariantListFilter setVariantList={setVariantList} />
                    ))}

                  {isGenomeSearchSubmit && genomData ? (
                    <GenotypeSearchResultsTable
                      data={genomData}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      samples={samples}
                      platform={selectedOption}
                    />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenotypeMetadataExplorer;
