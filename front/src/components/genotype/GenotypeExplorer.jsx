import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setPlatform } from "../../actions";

import GenotypeSearchResultsTable from "./GenotypeSearchResultsTable";
import LoadingComponent from "../LoadingComponent";
import LinkageGroupFilter from "./filters/LinkageGroupFilter"
import PositionRangeFilter from "./filters/PositionRangeFilter";
import VariantListFilter from "./filters/VariantListFilter";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";

import {
  searchSamplesInDatasets,
  fetchVariants,
} from "../../api/genolinkGigwaApi";
import { fetchCallsetDataForAccession } from "../../api/genolinkGerminateApi";
import { exportGigwaVCF } from "../../api/genolinkGigwaApi";

const GenotypeExplorer = () => {
  const [selectedOption, setSelectedOption] = useState("Gigwa");
  const [posStart, setPosStart] = useState("");
  const [posEnd, setPosEnd] = useState("");
  const [genomData, setGenomData] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [sampleDetails, setSampleDetails] = useState([]);
  const [selectedSamplesDetails, setSelectedSamplesDetails] = useState([]);
  const [isGenomeSearchSubmit, setIsGenomeSearchSubmit] = useState(false);
  const [isGenomDataLoading, setIsGenomDataLoading] = useState(false);
  const [isExportGenomDataLoading, setIsExportGenomDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [samples, setSamples] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [showSearchTypeSelector, setShowSearchTypeSelector] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchType, setSearchType] = useState("PositionRange");
  const [variantList, setVariantList] = useState([]);
  // const [selectedAccession, setSelectedAccession] = useState(null);
  const [numberOfGenesysAccessions, setNumberOfGenesysAccessions] = useState(null);
  const [numberOfPresentAccessions, setNumberOfPresentAccessions] = useState(null);
  const [numberOfMappedAccessions, setNumberOfMappedAccessions] = useState(null);


  const searchResults = useSelector((state) => state.searchResults);
  const checkedAccessionsObject = useSelector(
    (state) => state.checkedAccessions
  );
  const checkedAccessions = Object.keys(checkedAccessionsObject);
  const checkedResults = searchResults?.content?.filter((item) =>
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

  const handleDownloadClick = async () => {
    setIsExportGenomDataLoading(true);
    const params = {
      username: username,
      password: password,
      variantList: variantList,
      selectedSamplesDetails: selectedSamplesDetails,
      variantPage: currentPage,
      linkagegroups: selectedGroups.join(";"),
      start: posStart || -1,
      end: posEnd || -1,
    };
    await exportGigwaVCF(params);
    setIsExportGenomDataLoading(false);
  };

  const handleSearch = async () => {
    if (!username || !password) {
      alert("Please enter username and password");
      setIsGenomDataLoading(false);
      return;
    }

    try {
      if (selectedOption === "Gigwa") {
        if (!isGenomeSearchSubmit) {
          const Accessions = checkedResults?.map((item) => item.accessionNumber);
          const { response, numberOfGenesysAccessions, numberOfPresentAccessions, numberOfMappedAccessions } = await searchSamplesInDatasets(
            username,
            password,
            Accessions
          );
          setNumberOfGenesysAccessions(numberOfGenesysAccessions);
          setNumberOfPresentAccessions(numberOfPresentAccessions);
          setNumberOfMappedAccessions(numberOfMappedAccessions);

          if (response.result.data.length === 0) {
            alert("No genotype data found in the Database!");
            return;
          }
          setDatasets([
            ...new Set(
              response.result.data.map(
                (sample) =>
                  `${sample.studyDbId}§${sample.sampleName.split("-").slice(-1)[0]
                  }`
              )
            ),
          ]);
          setSampleDetails(response.result.data);
          setIsGenomeSearchSubmit(true);
          setShowLogin(false);
          setShowSearchTypeSelector(true);
          setShowDatasetSelector(true);
        }
        if (selectedSamplesDetails.length > 0) {
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
          case 404: // No Data Found
            message = "No genotype data found in the Database!";
            break;
          default:
            message = "An error occurred: " + (error.message || "Unknown error");
            break;
        }
      }
      alert(message);
    }
  };

  const fetchData = async (page) => {
    try {
      setIsGenomDataLoading(true);
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

        if (data.data.count === 0) {
          alert(`No genotype data found!
            Please set the filters again. `);
          return;
        }
        setGenomData(data.data);
        setSamples(data.desiredSamples);
        setShowSearchTypeSelector(false);
        setShowDatasetSelector(false);
      } else if (selectedOption === "Germinate") {
        const Accessions = checkedResults?.map((item) => item.accessionNumber);
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
      setIsGenomDataLoading(false);
    } finally {
      setIsGenomDataLoading(false);
    }
  };

  const handleSelectChange = (event) => {
    setSelectedAccession(event.target.value);
  };

  const handleReset = () => {
    setShowSearchTypeSelector(true);
    setShowDatasetSelector(true);
    setIsGenomeSearchSubmit(false);
    setGenomData("");
  }

  const handleOptionChange = (event) => {
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
    // <div className="geno-data-container">
    //   <div className="row">
    //     <div className="col-md-6">
    //       <h2>Metadata</h2>
    //       <div className="form-group">
    //         <label htmlFor="accessionSelect">Accession Number:</label>
    //         <select
    //           id="accessionSelect"
    //           onChange={handleSelectChange}
    //           value={selectedAccession || ""}
    //         >
    //           <option value="" disabled>
    //             Select
    //           </option>
    //           {checkedResults?.map((item) => (
    //             <option key={item.accessionNumber} value={item.accessionNumber}>
    //               {item.accessionNumber}
    //             </option>
    //           ))}
    //         </select>
    //       </div>
    //       {selectedAccession && (
    //         <div className="metadata-details">
    //           {checkedResults
    //             .filter((item) => item.accessionNumber === selectedAccession)
    //             .map((item) => (
    //               <div key={item.accessionNumber}>
    //                 <hr />
    //                 <div className="row">
    //                   <div className="col border-right bg-light">
    //                     {item.doi && <div className="col-label">DOI</div>}
    //                     <div className="col-label">Accession number</div>
    //                     <div className="col-label">Holding institute</div>
    //                     <div className="col-label">Institute code</div>
    //                     <div className="col-label">Data provider</div>
    //                     <div className="col-label">Origin Of Material</div>
    //                     <div className="col-label">Acquisition Date</div>
    //                   </div>
    //                   <div className="col-auto">
    //                     {item.doi && <div>{item.doi}</div>}
    //                     <div>{item.accessionNumber || ""}</div>
    //                     <div>{item["institute.fullName"] || ""}</div>
    //                     <div>{item.instituteCode || ""}</div>
    //                     <div>{item["institute.owner.name"] || ""}</div>
    //                     <div>{item["countryOfOrigin.name"] || ""}</div>
    //                     <div>{item.acquisitionDate || ""}</div>
    //                   </div>
    //                 </div>

    //                 <h3> Taxonomy provided to Genesys</h3>
    //                 <hr />
    //                 <div className="row">
    //                   <div className="col border-right bg-light">
    //                     <div className="col-label">Genus</div>
    //                     <div className="col-label">Specific epithet</div>
    //                     <div className="col-label">Scientific name</div>
    //                     <div className="col-label">Crop name</div>
    //                   </div>
    //                   <div className="col border-right bg-light">
    //                     <div>{item.genus || ""}</div>
    //                     <div>
    //                       {item["taxonomy.grinTaxonomySpecies.speciesName"] || ""}
    //                     </div>
    //                     <div>
    //                       {item["taxonomy.grinTaxonomySpecies.name"] || ""}
    //                     </div>
    //                     <div>{item["crop.name"] || ""}</div>
    //                   </div>
    //                 </div>

    //                 <h3> GRIN Taxonomy</h3>
    //                 <hr />
    //                 <div className="row">
    //                   <div className="col border-right bg-light">
    //                     <div className="col-label">Matched GRIN taxon</div>
    //                   </div>
    //                   <div className="col border-right bg-light">
    //                     <div>
    //                       <a
    //                         href={`https://npgsweb.ars-grin.gov/gringlobal/taxon/taxonomydetail?id=${item["taxonomy.grinTaxonomySpecies.id"]}`}
    //                       >
    //                         {item["taxonomy.grinTaxonomySpecies.name"] || ""}
    //                       </a>
    //                     </div>
    //                   </div>
    //                 </div>

    //                 <h3> Accession names</h3>
    //                 <hr />
    //                 <div className="row">
    //                   <div className="col border-right bg-light">
    //                     <div className="col-label">Accession name</div>
    //                   </div>
    //                   <div className="col border-right bg-light">
    //                     <div>{item.accessionName || ""}</div>
    //                   </div>
    //                 </div>
    //                 <h3> Metadata</h3>
    //                 <hr />
    //                 <div className="row">
    //                   <div className="col border-right bg-light">
    //                     <div className="col-label">UUID</div>
    //                     <div className="col-label">Last updated</div>
    //                     <div className="col-label">Created</div>
    //                   </div>
    //                   <div className="col border-right bg-light">
    //                     <div>{item.uuid || ""}</div>
    //                     <div>{item["institute.owner.lastModifiedDate"]}</div>
    //                     <div>
    //                       {item["institute.owner.createdDate"] ||
    //                         "Date not provided"}
    //                     </div>
    //                   </div>
    //                 </div>
    //               </div>
    //             ))}
    //         </div>
    //       )}
    //     </div>

    <div>
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
                  onChange={handleOptionChange}
                  value={selectedOption}
                >
                  {["Gigwa", "Germinate"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {!genomData ? (
                  <button
                    type="button"
                    className="button-primary"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button-primary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                )}
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

              {selectedOption === "Gigwa" &&
                showDatasetSelector && (
                  <div className="dataset-selector">
                    <h5>{numberOfMappedAccessions} of {numberOfGenesysAccessions} accessions have sample name mappings.</h5>
                    <h5>{numberOfPresentAccessions} of {numberOfGenesysAccessions} accessions have genotypes in Gigwa.</h5>
                    <br />
                    <select
                      value={selectedDataset || ""} // Bind to the currently selected dataset, default to an empty string
                      onChange={(e) => handleDatasetDetails(e.target.value)} // Handle selection changes
                      style={{ backgroundColor: "beige" }}
                    >
                      <option value="" disabled>
                        Select Dataset
                      </option>
                      {datasets.map((dataset) => (
                        <option key={dataset} value={dataset}>
                          {dataset}
                        </option>
                      ))}
                    </select>

                  </div>

                )}
              {showDatasetSelector && selectedDataset && (
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
              {selectedDataset && (
                <>
                  {showSearchTypeSelector && (
                    <select
                      className="form-select"
                      value={searchType}
                      onChange={(e) => handleSearchTypeChange(e.target.value)} // Step 3: Handle changes
                      style={{ width: "280px", backgroundColor: "beige", fontWeight: "500", border: "2px solid #ebba35" }}
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
                </>
              )}

              {isGenomDataLoading && <LoadingComponent />}
              {genomData && !isGenomDataLoading ? (
                <>
                  <GenotypeSearchResultsTable
                    data={genomData}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    samples={samples}
                    platform={selectedOption}
                  />

                  {isExportGenomDataLoading && <LoadingComponent />}
                  {!isExportGenomDataLoading && (
                    <button onClick={handleDownloadClick}>
                      Export VCF
                    </button>
                  )}

                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenotypeExplorer;