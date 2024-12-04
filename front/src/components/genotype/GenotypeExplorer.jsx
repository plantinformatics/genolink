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

import GenolinkGigwaApi from "../../api/GenolinkGigwaApi";
import GenolinkGerminateApi from "../../api/GenolinkGerminateApi";

const GenotypeExplorer = () => {
  const [selectedOption, setSelectedOption] = useState("Gigwa");
  const [genolinkGigwaApi, setGenolinkGigwaApi] = useState(new GenolinkGigwaApi());
  const [genolinkGerminateApi, setGenolinkGerminateApi] = useState(new GenolinkGerminateApi());
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
  const [completeNames, setCompleteNames] = useState([]);
  const [sampleVcfNames, setSampleVcfNames] = useState([]);
  const [selectedSamplesDetails, setSelectedSamplesDetails] = useState([]);
  const [isGenomeSearchSubmit, setIsGenomeSearchSubmit] = useState(false);
  const [isGenomDataLoading, setIsGenomDataLoading] = useState(false);
  const [isExportGenomDataLoading, setIsExportGenomDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [showSearchTypeSelector, setShowSearchTypeSelector] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessMode, setAccessMode] = useState("private");
  const [showPrivacyRadio, setShowPrivacyRadio] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [variantList, setVariantList] = useState([]);
  const [numberOfGenesysAccessions, setNumberOfGenesysAccessions] = useState(null);
  const [numberOfPresentAccessions, setNumberOfPresentAccessions] = useState(null);
  const [numberOfMappedAccessions, setNumberOfMappedAccessions] = useState(null);


  const searchResults = useSelector((state) => state.searchResults);
  const checkedAccessionsObject = useSelector(
    (state) => state.checkedAccessions
  );
  const checkedAccessionNamesObject = useSelector(
    (state) => state.checkedAccessionNames
  );
  const checkedAccessions = Object.keys(checkedAccessionsObject);
  const checkedResults = searchResults?.filter((item) =>
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

  const handleAccessModeChange = (event) => {
    setAccessMode(event.target.value);
    setShowLogin(event.target.value === "private");
  };

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
      variantList: variantList,
      selectedSamplesDetails: selectedSamplesDetails,
      variantPage: currentPage,
      linkagegroups: selectedGroups.join(";"),
      start: posStart || -1,
      end: posEnd || -1,
    };
    await genolinkGigwaApi.exportGigwaVCF(body);
    setIsExportGenomDataLoading(false);
  };

  const handleSearch = async () => {

    if (accessMode === "private" && (!username || !password)) {
      alert("Please enter username and password for private access");
      return;
    }

    try {
      if (selectedOption === "Gigwa") {
        if (!isGenomeSearchSubmit) {
          await genolinkGigwaApi.getGigwaToken(
            accessMode === "private" ? username : "",
            accessMode === "private" ? password : ""
          );

          setGenolinkGigwaApi(genolinkGigwaApi);

          const Accessions = checkedResults?.map((item) => item.accessionNumber);
          const { response, variantSetDbIds, sampleDbIds, datasetNames, vcfSamples, numberOfGenesysAccessions, numberOfPresentAccessions, numberOfMappedAccessions, accessionPlusAccessionName } = await genolinkGigwaApi.searchSamplesInDatasets(Accessions, checkedAccessionNamesObject);
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
          const uniqueSampleNames = Array.from(new Set(
            response.result.data.map(sample =>
              sample.germplasmDbId.split("§")[1]
            )));

          const filteredAccessionPlusAccessionName = accessionPlusAccessionName.filter(item => {
            const thirdPart = item.split("§")[2];
            return uniqueSampleNames.includes(thirdPart);
          });
          setVariantSetDbIds(variantSetDbIds);
          setSampleDbIds(sampleDbIds);
          setSampleVcfNames(vcfSamples);
          setDatasets(filteredDatasetNames);
          setSampleDetails(response.result.data);
          setSampleNames(uniqueSampleNames);
          setCompleteNames(filteredAccessionPlusAccessionName);
          setIsGenomeSearchSubmit(true);
          setShowLogin(false);
          setShowSearchTypeSelector(true);
          setShowDatasetSelector(true);
          setShowPrivacyRadio(false);
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
          case 401:
            message = "Authentication failed: Incorrect username or password.";
            break;
          case 403:
            message = "Access denied: You do not have permission to access these resources. Please check your credentials.";
            break;
          case 404: 
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
        const fetchDataPromise = await genolinkGigwaApi.fetchVariants({
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
          fetchAllelesPromise = genolinkGigwaApi.fetchAlleles({
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
          fetchAllelesPromise = genolinkGigwaApi.fetchAlleles({
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
          fetchAllelesPromise = genolinkGigwaApi.fetchAlleles({
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

        const [data, allelesData] = await Promise.all([fetchDataPromise, fetchAllelesPromise]);

        if (data.data.count === 0) {
          alert(`No genotype data found!
            Please set the filters again. `);
          return;
        }

        setAlleleData(allelesData || {}); // Ensure allelesData is set properly
        setGenomData(data.data);
        setShowSearchTypeSelector(false);
        setShowDatasetSelector(false);
      } else if (selectedOption === "Germinate") {
        const Accessions = checkedResults?.map((item) => item.accessionNumber);
        const responses = await Promise.all(
          Accessions.map((accession) =>
            genolinkGerminateApi.fetchCallsetDataForAccession(
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

  const handleReset = () => {
    setShowSearchTypeSelector(false);
    setShowDatasetSelector(false);
    setIsGenomeSearchSubmit(false);
    setGenomData("");
    setVariantList([]);
    setSelectedGroups([]);
    setSelectedSamplesDetails([]);
    setSelectedDataset("");
    setPosStart("");
    setPosEnd("");
    setShowPrivacyRadio(true);
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
              {showPrivacyRadio ? (<div className="access-mode-toggle">
                <label>
                  <input
                    type="radio"
                    value="private"
                    checked={accessMode === "private"}
                    onChange={handleAccessModeChange}
                  />
                  Private
                </label>
                <label>
                  <input
                    type="radio"
                    value="public"
                    checked={accessMode === "public"}
                    onChange={handleAccessModeChange}
                  />
                  Public
                </label>
              </div>) : null}


              {showLogin && accessMode === "private" && (
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
                      value={selectedDataset || ""}
                      onChange={(e) => handleDatasetDetails(e.target.value)}
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

              {selectedDataset && (
                <>
                  {showSearchTypeSelector && (
                    <select
                      value={searchType || ""}
                      onChange={(e) => handleSearchTypeChange(e.target.value)} // Step 3: Handle changes
                      style={{ backgroundColor: "beige" }}
                    >
                      <option value="" disabled>
                        Filter Type
                      </option>
                      <option value="PositionRange">PositionRange</option>
                      <option value="VariantIDs">VariantIDs</option>
                    </select>
                  )}
                  {showSearchTypeSelector &&
                    (searchType === "PositionRange" ? (
                      <>
                        <PositionRangeFilter
                          posStart={posStart}
                          setPosStart={setPosStart}
                          posEnd={posEnd}
                          setPosEnd={setPosEnd}
                        />
                        <LinkageGroupFilter
                          selectedStudyDbId={selectedStudyDbId}
                          selectedGroups={selectedGroups}
                          setSelectedGroups={setSelectedGroups}
                          genolinkGigwaApi={genolinkGigwaApi}
                          genolinkGerminateApi={genolinkGerminateApi}
                        />
                      </>
                    ) : searchType === "VariantIDs" ? (
                      <VariantListFilter setVariantList={setVariantList} />
                    ) : null)}
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
                    samples={completeNames}
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