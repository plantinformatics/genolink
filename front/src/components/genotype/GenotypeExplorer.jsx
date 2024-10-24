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
import { faCopy } from "@fortawesome/free-solid-svg-icons";


import {
  getGigwaToken,
  searchSamplesInDatasets,
  fetchVariants, fetchAlleles
} from "../../api/genolinkGigwaApi";
import { fetchCallsetDataForAccession } from "../../api/genolinkGerminateApi";
import { exportGigwaVCF } from "../../api/genolinkGigwaApi";

const GenotypeExplorer = () => {
  const [selectedOption, setSelectedOption] = useState("Gigwa");
  const [copied, setCopied] = useState(false);
  const [posStart, setPosStart] = useState("");
  const [posEnd, setPosEnd] = useState("");
  const [genomData, setGenomData] = useState("");
  const [alleleData, setAlleleData] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [selectedStudyDbId, setSelectedStudyDbId] = useState("");
  const [selectedVariantSetDbId, setSelectedVariantSetDbId] = useState([]);
  const [sampleDetails, setSampleDetails] = useState([]);
  const [variantSetDbIds, setVariantSetDbIds] = useState([]);
  const [sampleDbIds, setSampleDbIds] = useState([]);
  const [sampleNames, setSampleNames] = useState([]);
  const [sampleVcfNames, setSampleVcfNames] = useState([]);
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
  const [gigwaToken, setGigwaToken] = useState("");
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
    const selectedSamples = sampleDetails.filter((sample) =>
      sample.sampleName.includes(dataset)
    );
    const selectedVariantSetDbId = variantSetDbIds.filter((variantSetDbId) =>
      variantSetDbId.includes(dataset));

    setSelectedVariantSetDbId(selectedVariantSetDbId)
    setSelectedSamplesDetails(selectedSamples);
    setSelectedStudyDbId([...new Set(selectedSamples.map((sample) => sample.studyDbId))]);
    setSelectedDataset(dataset);
  };

  const handleDownloadClick = async () => {
    setIsExportGenomDataLoading(true);
    const body = {
      gigwaToken,
      variantList: variantList,
      // sampleVcfNames: sampleVcfNames,
      selectedSamplesDetails: selectedSamplesDetails,
      variantPage: currentPage,
      linkagegroups: selectedGroups.join(";"),
      start: posStart || -1,
      end: posEnd || -1,
    };
    await exportGigwaVCF(body);
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
          const token = await getGigwaToken(username, password);
          setGigwaToken(token);
          const Accessions = checkedResults?.map((item) => item.accessionNumber);
          const { response, variantSetDbIds, sampleDbIds, datasetNames, vcfSamples, numberOfGenesysAccessions, numberOfPresentAccessions, numberOfMappedAccessions } = await searchSamplesInDatasets(
            token,
            Accessions
          );
          const sampleNames = response.result.data.map(sample => sample.sampleName);
          setNumberOfGenesysAccessions(numberOfGenesysAccessions);
          setNumberOfPresentAccessions(numberOfPresentAccessions);
          setNumberOfMappedAccessions(numberOfMappedAccessions);

          if (response.result.data.length === 0) {
            alert("No genotype data found in the Database!");
            return;
          }

          const filteredDatasetNames = datasetNames.filter(datasetName =>
            sampleNames.some(sampleName => sampleName.includes(datasetName))
          );

          // Set filtered dataset names
          setVariantSetDbIds(variantSetDbIds);
          setSampleDbIds(sampleDbIds);
          setSampleVcfNames(vcfSamples);
          setDatasets(filteredDatasetNames);
          setSampleDetails(response.result.data);
          setSampleNames(response.result.data.map((sample) =>
            sample.sampleName.split("-").slice(0, -2).join("-")));
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
        const fetchDataPromise = fetchVariants({
          gigwaToken: gigwaToken,
          variantList: variantList,
          sampleVcfNames: sampleVcfNames,
          selectedSamplesDetails: selectedSamplesDetails,
          variantPage: page - 1,
          linkagegroups: selectedGroups.join(";"),
          start: posStart || -1,
          end: posEnd || -1,
        });

        let fetchAllelesPromise;

        if (posStart && posEnd) {
          fetchAllelesPromise = fetchAlleles({
            gigwaToken: gigwaToken,
            callSetDbIds: sampleDbIds,
            variantSetDbIds: selectedVariantSetDbId,
            positionRanges: selectedGroups.map(group => `${group}:${posStart}-${posEnd}`),
            dataMatrixAbbreviations: ["GT"],
            pagination: [
              {
                dimension: "variants",
                page: page - 1,
                pageSize: 1000
              },
              {
                dimension: "callsets",
                page: 0,
                pageSize: 10000
              }
            ],
          });
        } else if (variantList.length > 0) {
          fetchAllelesPromise = fetchAlleles({
            gigwaToken: gigwaToken,
            callSetDbIds: sampleDbIds,
            variantSetDbIds: selectedVariantSetDbId,
            variantDbIds: variantList.map(variant => `${selectedVariantSetDbId[0].split("§")[0]}§${variant}`),
            dataMatrixAbbreviations: ["GT"],
            pagination: [
              {
                dimension: "variants",
                page: page - 1,
                pageSize: 1000
              },
              {
                dimension: "callsets",
                page: 0,
                pageSize: 10000
              }
            ],
          });
        } else {
          fetchAllelesPromise = fetchAlleles({
            gigwaToken: gigwaToken,
            callSetDbIds: sampleDbIds,
            variantSetDbIds: selectedVariantSetDbId,
            dataMatrixAbbreviations: ["GT"],
            pagination: [
              {
                dimension: "variants",
                page: page - 1,
                pageSize: 1000
              },
              {
                dimension: "callsets",
                page: 0,
                pageSize: 10000
              }
            ],
          });
        }

        // Run both fetches in parallel
        const [data, allelesData] = await Promise.all([fetchDataPromise, fetchAllelesPromise]);

        if (data.data.count === 0) {
          alert(`No genotype data found!
            Please set the filters again. `);
          return;
        }

        setAlleleData(allelesData || {}); // Ensure allelesData is set properly
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

  // const handleSelectChange = (event) => {
  //   setSelectedAccession(event.target.value);
  // };

  const handleReset = () => {
    setShowSearchTypeSelector(true);
    setShowDatasetSelector(true);
    setIsGenomeSearchSubmit(false);
    setGenomData("");
    setVariantList([]);
    setSelectedGroups([]);
    setPosStart("");
    setPosEnd("");
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
        setVariantList([]);
      } else if (newType === "VariantIDs") {
        setPosStart("");
        setPosEnd("");
      }
    }
    setSearchType(newType);
  };

  const handleCopySampleNames = () => {
    const samples = sampleNames.join("\n");
    navigator.clipboard.writeText(samples)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy sample names: ", err);
      });
  };


  return (
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
                    <div>
                      <h5>
                        {numberOfPresentAccessions} of {numberOfGenesysAccessions} accessions have genotypes in Gigwa.
                        {!copied ? (
                          <button
                            type="button"
                            className="btn btn-outline-secondary ml-2"
                            style={{
                              marginLeft: "10px",
                              padding: "5px 10px",
                              fontSize: "16px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                            onClick={handleCopySampleNames}
                          >
                            <FontAwesomeIcon icon={faCopy} style={{ marginRight: "5px" }} />
                            Copy
                          </button>
                        ) : (
                          <span style={{ color: "green", marginLeft: "10px" }}>Copied!</span>
                        )}
                      </h5>
                    </div>


                    <br />
                    <select
                      value={selectedDataset || ""} // Bind to the currently selected dataset, default to an empty string
                      onChange={(e) => handleDatasetDetails(e.target.value)} // Handle selection changes
                      style={{ backgroundColor: "beige" }}
                    >
                      <option value="" disabled>
                        Select Dataset
                      </option>
                      {datasets && datasets.map((dataset) => (
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
                    selectedStudyDbId={selectedStudyDbId}
                    selectedGroups={selectedGroups}
                    setSelectedGroups={setSelectedGroups}
                    gigwaToken={gigwaToken}
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
              {genomData && alleleData && !isGenomDataLoading ? (
                <>
                  <GenotypeSearchResultsTable
                    data={genomData}
                    alleles={alleleData}
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