import { useState, useEffect } from "react";
import LoadingComponent from "../../LoadingComponent";
import { useAuth } from "react-oidc-context";
import { useDispatch, useSelector } from "react-redux";
import {
  setInstituteCheckedBoxes,
  setResetTrigger,
  setAccessionNumbers,
  setCreationStartDate,
  setCreationEndDate,
  setCropCheckedBoxes,
  setTaxonomyCheckedBoxes,
  setOriginOfMaterialCheckedBoxes,
} from "../../../actions";

import MultiSelectFilter from "./MultiSelectFilter";
import AccessionFilter from "./AccessionFilter";
import MetadataSearchResultTable from "../MetadataSearchResultTable";
import DateRangeFilter from "./DateRangeFilter";
import { createSampleAccessions } from "../../../api/genolinkInternalApi";

import {
  fetchInitialData,
  fetchInitialData2,
  applyFilter,
  resetFilter,
} from "../../../api/genesysApi";

const SearchFilters = () => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [filterCode, setFilterCode] = useState(null);
  const [isAccessionDrawerOpen, setIsAccessionDrawerOpen] = useState(false);
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [isInstituteDrawerOpen, setIsInstituteDrawerOpen] = useState(false);
  const [isCropDrawerOpen, setIsCropDrawerOpen] = useState(false);
  const [isTaxonomyDrawerOpen, setIsTaxonomyDrawerOpen] = useState(false);
  const [isOriginDrawerOpen, setIsOriginDrawerOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("Accession Filter");
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [initialRequestSent, setInitialRequestSent] = useState(false);
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(Date.now());
  const [showFileInput, setShowFileInput] = useState(false);

  const totalAccessions = useSelector((state) => state.totalAccessions);
  const searchResults = useSelector((state) => state.searchResults);

  const instituteCheckedBoxes = useSelector(
    (state) => state.instituteCheckedBoxes
  );
  const cropCheckedBoxes = useSelector((state) => state.cropCheckedBoxes);
  const taxonomyCheckedBoxes = useSelector(
    (state) => state.taxonomyCheckedBoxes
  );
  const originOfMaterialCheckedBoxes = useSelector(
    (state) => state.originOfMaterialCheckedBoxes
  );
  const instituteCode = useSelector((state) => state.instituteCode);

  const resetTrigger = useSelector((state) => state.resetTrigger);
  const accessionNumbers = useSelector((state) => state.accessionNumbers);
  const creationStartDate = useSelector((state) => state.creationStartDate);
  const creationEndDate = useSelector((state) => state.creationEndDate);
  const cropList = useSelector((state) => state.cropList);
  const taxonomyList = useSelector((state) => state.taxonomyList);
  const originOfMaterialList = useSelector(
    (state) => state.originOfMaterialList
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      if (Object.keys(searchResults).length === 0) {
        setIsLoading(true);
        try {
          const [initialData, initialData2] = await Promise.all([
            fetchInitialData(auth.user?.access_token, dispatch),
            fetchInitialData2(auth.user?.access_token, dispatch)
          ]);
          // Handle the results
          setFilterCode(initialData2);  // Store the filterCode from the second request
          setInitialRequestSent(true);
        } catch (error) {
          console.error("Error fetching initial data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setInitialRequestSent(true);
      }
    };

    fetchData();
  }, [auth.user?.access_token, dispatch, searchResults]);

  useEffect(() => {
    dispatch(setInstituteCheckedBoxes([]));
    dispatch(setAccessionNumbers([]));
    dispatch(setCreationEndDate(null));
    dispatch(setCreationStartDate(null));
    dispatch(setCropCheckedBoxes([]));
    dispatch(setTaxonomyCheckedBoxes([]));
    dispatch(setOriginOfMaterialCheckedBoxes([]));
    setIsAccessionDrawerOpen(false);
    setIsCropDrawerOpen(false);
    setIsDateDrawerOpen(false);
    setIsInstituteDrawerOpen(false);
    setIsOriginDrawerOpen(false);
    setIsTaxonomyDrawerOpen(false);
    dispatch(setResetTrigger(false));
  }, [resetTrigger]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // Set the selected file
  };

  const handleUploadClick = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    try {
      setIsUploadLoading(true);
      await createSampleAccessions(file);
      setIsUploadLoading(false);
      alert("File uploaded successfully!");
      setShowFileInput(false); // Hide the input after successful operation
      setInputKey(Date.now()); // Reset the input
    } catch (error) {
      setIsUploadLoading(false);
      console.error("Error uploading file:", error);
      alert("Failed to upload file!");
      setShowFileInput(false); // Optionally hide the input on error as well
      setInputKey(Date.now());
    }
  };

  const handleFilter = async () => {
    setIsLoading(true);
    const token = auth.user?.access_token;
    let body = {};

    if (accessionNumbers.length > 0) {
      body = { ...body, accessionNumbers };
    }
    if (instituteCheckedBoxes.length > 0) {
      body = { ...body, institute: { code: instituteCheckedBoxes } };
    }
    if (creationStartDate && creationEndDate)
      body = {
        ...body,
        createdDate: { ge: creationStartDate, le: creationEndDate },
      };
    else if (creationStartDate)
      body = { ...body, createdDate: { ge: creationStartDate } };
    else if (creationEndDate)
      body = { ...body, createdDate: { le: creationEndDate } };

    if (cropCheckedBoxes.length > 0) {
      body = {
        ...body,
        crop: cropCheckedBoxes,
      };
    }
    if (taxonomyCheckedBoxes.length > 0) {
      body = {
        ...body,
        taxonomy: { genus: taxonomyCheckedBoxes },
      };
    }
    if (originOfMaterialCheckedBoxes.length > 0) {
      body = {
        ...body,
        countryOfOrigin: { code3: originOfMaterialCheckedBoxes },
      };
    }

    try {
      const filterCode = await applyFilter(token, body, dispatch);
      setFilterCode(filterCode);
      setIsLoading(false);
      setIsFilterApplied(true);
    } catch (error) {
      setIsLoading(false);
      setIsFilterApplied(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = 'sample,accession\n'; // CSV headers
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });

    // Create a link element, use it to download the blob, and then remove it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_accessions_template.csv'; // Name of the file to download
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link); // Clean up
    URL.revokeObjectURL(url); // Free up storage—optional but good practice
  };

  const handleResetFilter = async () => {
    setIsResetLoading(true);
    const token = auth.user?.access_token;

    try {
      const filterCode = await resetFilter(token, dispatch);
      setFilterCode(filterCode);
      setIsResetLoading(false);
      setIsFilterApplied(false);
    } catch (error) {
      setIsResetLoading(false);
      console.error("Error handling reset filter:", error);
    }
  };

  return (
    <>
      <div
        style={{
          top: "0",
          background: "white",
          paddingBottom: "10px",
          paddingTop: "10px",
          zIndex: "1000",
          position: "fixed",
          width: "100%", // Ensure the div takes the full width
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "green",
            color: "white",
            fontWeight: "bold",
            position: "fixed",
            width: "100%",
            top: "0",
            zIndex: "1001",
            padding: "10px 0",
          }}
        >
          <img
            src="/Genolink.png"
            alt="Logo"
            style={{
              marginRight: "20px",
            }}
          />
          <h2
            style={{
              margin: 0, // Remove default margin
            }}
          >
            Genolink
          </h2>
        </div>
      </div>


      <div className="container-fluid" style={{ paddingTop: "50px" }}>
        <div className="row">
          {initialRequestSent ? (
            <div className="col-md-3 col-md-3-custom">
              <div
                style={{
                  top: "60px",
                  background: "white",
                  zIndex: "1000",
                  padding: "10px 70px 0 0", // for space
                }}
              >

                {isUploadLoading ? (
                  <LoadingComponent />
                ) : (
                  <div style={{ marginBottom: "50px" }}>
                    <button
                      className="btn btn-info"
                      style={{ margin: "15px 0 5px 0" }}
                      onClick={() => setShowFileInput(!showFileInput)}
                    >
                      Upload Metadata {showFileInput ? "\u25B2" : "\u25BC"}{" "}
                    </button>
                    {showFileInput && (
                      <div>
                        <button
                          className="btn btn-success"
                          onClick={handleDownloadTemplate}
                        >
                          Download Template
                        </button>
                        <input
                          id="file-input"
                          type="file"
                          onChange={handleFileChange}
                          accept=".csv,.tsv"
                          key={inputKey}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handleUploadClick}
                        >
                          Submit File
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <h5>Total Accessions: {totalAccessions}</h5>
                <br />
                <h4>Filters</h4>
                <div style={{ display: "flex" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    id="apply-filter-button"
                    onClick={handleFilter}
                  >
                    Apply Filter
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    id="reset-filter-button"
                    onClick={handleResetFilter}
                  >
                    Reset Filter
                  </button>
                  {!isFilterApplied ? (
                    <select
                      value={filterMode}
                      onChange={(e) => setFilterMode(e.target.value)}
                    >
                      <option value="Accession Filter">Accession Filter</option>
                      <option value="Passport Filter">Passport Filter</option>
                    </select>
                  ) : null}
                </div>
                {filterMode == "Accession Filter" ? (
                  <>
                    <button
                      className="btn btn-info"
                      onClick={() =>
                        setIsAccessionDrawerOpen(!isAccessionDrawerOpen)
                      }
                    >
                      Enter Accession Numbers{" "}
                      {isAccessionDrawerOpen ? "\u25B2" : "\u25BC"}
                    </button>
                    <div>{isAccessionDrawerOpen && <AccessionFilter />}</div>
                  </>
                ) : (
                  <>
                    <div>
                      <button
                        className="btn btn-info"
                        onClick={() => setIsDateDrawerOpen(!isDateDrawerOpen)}
                      >
                        Date {isDateDrawerOpen ? "\u25B2" : "\u25BC"}
                      </button>
                      {isDateDrawerOpen && (
                        <>
                          <DateRangeFilter type="start" />
                          <DateRangeFilter type="end" />
                        </>
                      )}
                    </div>
                    <div>
                      <button
                        className="btn btn-info"
                        onClick={() =>
                          setIsInstituteDrawerOpen(!isInstituteDrawerOpen)
                        }
                      >
                        Holding Institute {isInstituteDrawerOpen ? "\u25B2" : "\u25BC"}
                      </button>
                      {isInstituteDrawerOpen && (
                        <MultiSelectFilter
                          options={instituteCode}
                          type="institueCheckedBoxes"
                        />
                      )}
                    </div>
                    <div>
                      <button
                        className="btn btn-info"
                        onClick={() => setIsCropDrawerOpen(!isCropDrawerOpen)}
                      >
                        Crops {isCropDrawerOpen ? "\u25B2" : "\u25BC"}
                      </button>
                      {isCropDrawerOpen && (
                        <MultiSelectFilter
                          options={cropList}
                          type="cropCheckedBoxes"
                        />
                      )}
                    </div>
                    <div>
                      <button
                        className="btn btn-info"
                        onClick={() =>
                          setIsTaxonomyDrawerOpen(!isTaxonomyDrawerOpen)
                        }
                      >
                        Taxonomy {isTaxonomyDrawerOpen ? "\u25B2" : "\u25BC"}
                      </button>
                      {isTaxonomyDrawerOpen && (
                        <MultiSelectFilter
                          options={taxonomyList}
                          type="taxonomyCheckedBoxes"
                        />
                      )}
                    </div>
                    <div>
                      <button
                        className="btn btn-info"
                        onClick={() =>
                          setIsOriginDrawerOpen(!isOriginDrawerOpen)
                        }
                      >
                        Origin Of Material {isOriginDrawerOpen ? "\u25B2" : "\u25BC"}
                      </button>
                      {isOriginDrawerOpen && (
                        <MultiSelectFilter
                          options={originOfMaterialList}
                          type="originOfMaterialCheckedBoxes"
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          <div className={"col-md-9 col-md-9-custom"}>
            {(isLoading || isResetLoading) ? (
              <LoadingComponent />
            ) : (
              <div className="container">
                {initialRequestSent && (
                  <MetadataSearchResultTable filterCode={filterCode} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchFilters;
