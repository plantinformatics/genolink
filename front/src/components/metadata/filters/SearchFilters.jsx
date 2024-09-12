import { useState, useEffect } from "react";
import LoadingComponent from "../../LoadingComponent";
import { useAuth } from "react-oidc-context";
import { useDispatch, useSelector } from "react-redux";
import wheatImage from "../../../assets/Wheat.jpg"
import {
  setInstituteCheckedBoxes,
  setResetTrigger,
  setAccessionNumbers,
  setCreationStartDate,
  setCreationEndDate,
  setCropCheckedBoxes,
  setTaxonomyCheckedBoxes,
  setOriginOfMaterialCheckedBoxes,
  setSampStatCheckedBoxes,
  setGermplasmStorageCheckedBoxes,
  setCheckedAccessions,
} from "../../../actions";

import MultiSelectFilter from "./MultiSelectFilter";
import AccessionFilter from "./AccessionFilter";
import MetadataSearchResultTable from "../MetadataSearchResultTable";
import DateRangeFilter from "./DateRangeFilter";
import GenotypeExplorer from "../../genotype/GenotypeExplorer";
import { createSampleAccessions } from "../../../api/genolinkInternalApi";


import {
  fetchInitialData,
  applyFilter,
  resetFilter,
} from "../../../api/genesysApi";

const SearchFilters = () => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [genesysHeight, setGenesysHeight] = useState("auto");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [filterCode, setFilterCode] = useState(null);
  // const [isAccessionDrawerOpen, setIsAccessionDrawerOpen] = useState(false);
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [isInstituteDrawerOpen, setIsInstituteDrawerOpen] = useState(false);
  const [isCropDrawerOpen, setIsCropDrawerOpen] = useState(false);
  const [isTaxonomyDrawerOpen, setIsTaxonomyDrawerOpen] = useState(false);
  const [isOriginDrawerOpen, setIsOriginDrawerOpen] = useState(false);
  const [isSampStatDrawerOpen, setIsSampStatDrawerOpen] = useState(false);
  const [isGermplasmStorageDrawerOpen, setIsGermplasmStorageDrawerOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("Passport Filter");
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [initialRequestSent, setInitialRequestSent] = useState(false);
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(Date.now());
  const [showFileInput, setShowFileInput] = useState(false);
  // const [isSearchSubmit, setIsSearchSubmit] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const checkedAccessions = useSelector((state) => state.checkedAccessions);
  const hasCheckedAccessions = Object.keys(checkedAccessions).length > 0;
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
  const sampStatCheckedBoxes = useSelector(
    (state) => state.sampStatCheckedBoxes
  );
  const germplasmStorageCheckedBoxes = useSelector(
    (state) => state.germplasmStorageCheckedBoxes
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
  const sampStatList = useSelector(
    (state) => state.sampStatList
  );
  const germplasmStorageList = useSelector(
    (state) => state.germplasmStorageList
  );
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchInitialData(auth.user?.access_token, dispatch);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [auth.user?.access_token, dispatch, searchResults]);

  const handleSearch = (userInput = "") => {
    setIsLoading(true);
    setInitialRequestSent(true);
    const fetchData = async () => {
      const token = auth.user?.access_token;
      let body = {};

      if (userInput) {
        body = { ...body, _text: userInput }
      }
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
      if (sampStatCheckedBoxes.length > 0) {
        body = {
          ...body,
          sampStat: sampStatCheckedBoxes,
        };
      }
      if (germplasmStorageCheckedBoxes.length > 0) {
        body = {
          ...body,
          storage: germplasmStorageCheckedBoxes,
        };
      }
      try {
        const filterCode = await applyFilter(token, body, dispatch);
        setFilterCode(filterCode);
        setIsLoading(false);
        setIsFilterApplied(true);
        setInputValue("");
        // setIsSearchSubmit(true);
      } catch (error) {
        setIsLoading(false);
        setIsFilterApplied(false);
        setInputValue("");
        // setIsSearchSubmit(false);
      }
    };

    fetchData();
  }

  useEffect(() => {
    dispatch(setInstituteCheckedBoxes([]));
    dispatch(setAccessionNumbers([]));
    dispatch(setCreationEndDate(null));
    dispatch(setCreationStartDate(null));
    dispatch(setCropCheckedBoxes([]));
    dispatch(setTaxonomyCheckedBoxes([]));
    dispatch(setOriginOfMaterialCheckedBoxes([]));
    dispatch(setSampStatCheckedBoxes([]));
    dispatch(setGermplasmStorageCheckedBoxes([]));
    // setIsAccessionDrawerOpen(false);
    setIsCropDrawerOpen(false);
    setIsDateDrawerOpen(false);
    setIsInstituteDrawerOpen(false);
    setIsOriginDrawerOpen(false);
    setIsTaxonomyDrawerOpen(false);
    setIsSampStatDrawerOpen(false);
    setIsGermplasmStorageDrawerOpen(false);
    dispatch(setResetTrigger(false));
    dispatch(setCheckedAccessions({}));
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
      setShowFileInput(false);
      setInputKey(Date.now());
    } catch (error) {
      setIsUploadLoading(false);
      console.error("Error uploading file:", error);
      alert("Failed to upload file!");
      setShowFileInput(false); 
      setInputKey(Date.now());
    }
  };

  const handleDownloadTemplate = () => {
    const headers = 'sample,accession\n';
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_accessions_template.csv'; 
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
  };

  const handleResetFilter = async () => {
    setIsResetLoading(true);
    const token = auth.user?.access_token;

    try {
      const filterCode = await resetFilter(token, dispatch);
      setFilterCode(filterCode);
      setIsResetLoading(false);
      setIsFilterApplied(false);
      setGenesysHeight("auto");
    } catch (error) {
      setIsResetLoading(false);
      console.error("Error handling reset filter:", error);
    }
  };

  const handleHorizontalDrag = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const topDiv = e.target.previousElementSibling;
    const bottomDivs = e.target.nextElementSibling;
    const startTopHeight = topDiv.offsetHeight;
    const startBottomHeight = bottomDivs ? bottomDivs.offsetHeight : 0;
  
    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientY - startY;
      const newTopHeight = Math.max(100, startTopHeight + delta);
      const newBottomHeight = Math.max(50, startBottomHeight - delta);
  
      topDiv.style.height = `${newTopHeight}px`;
      if (bottomDivs) {
        bottomDivs.style.height = `${newBottomHeight}px`;
      }
      setGenesysHeight(`${newTopHeight}px`); 
    };
  
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  

  return (
    <>
      {/* Container with Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, auto) 1fr",
          gridTemplateRows: hasCheckedAccessions
            ? "auto 1fr 5px 1fr"
            : "auto 1fr 5px",
          gap: "0px",
          height: "100vh",
          padding: "10px",
        }}
      >
        {/* div1: Genolink Title */}
        <div
          style={{
            gridColumn: "1 / 5",
            gridRow: "1",
            background: "green",
            color: "white",
            textAlign: "center",
            padding: "10px",
          }}
        >
          <img
            src="/Genolink.png"
            alt="Logo"
            style={{ marginRight: "20px", verticalAlign: "middle" }}
          />
          <h2 style={{ margin: "0", display: "inline" }}>Genolink</h2>
        </div>

        {/* div3: Genesys Filter */}
        <div
          style={{
            gridColumn: "1",
            gridRow: "2 / 5",
            background: "#50748c00",
            borderRight: "5px solid gray",
            padding: "10px",
            minWidth: "320px",
            overflow: "auto",
          }}
        >
          <h4>Filters</h4>
          {!isLoading && initialRequestSent &&
            <h5>Total Accessions: {totalAccessions}</h5>
          }
          <div style={{ marginBottom: "5px" }}>
            {initialRequestSent ? (
              isUploadLoading ? (
                <LoadingComponent />
              ) : (
                <div style={{ marginBottom: "70px" }}>
                  <button
                    className="btn btn-info"
                    onClick={() => setShowFileInput(!showFileInput)}
                    style={{
                      display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", margin: "15px 0 5px 0", backgroundColor: "beige", fontWeight: "500"
                    }}
                  >
                    Upload Metadata <span style={{ float: "right" }}>{showFileInput ? "\u25B2" : "\u25BC"}</span> {" "}
                  </button>
                  {showFileInput && (
                    <div style={{ marginBottom: "20px" }}>
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
                        style={{ width: "210px", marginLeft: "5px" }}
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
              )
            ) : null}
          </div>
          <div style={{ display: "flex", marginBottom: "10px" }}>
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
                style={{ marginLeft: "10px", width: "161px" }}
              >
                <option value="Passport Filter">Passport Filter</option>
                <option value="Accession Filter">Accession Filter</option>
              </select>
            ) : null}
          </div>
          {filterMode === "Passport Filter" && (
            <>
              <div>
                <button
                  className="btn btn-info"
                  onClick={() => setIsDateDrawerOpen(!isDateDrawerOpen)}
                  style={{
                    display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", backgroundColor: "beige", marginBottom: "5px", fontWeight: "500"
                  }}
                >
                  Date   <span style={{ float: "right" }}>{isDateDrawerOpen ? "\u25B2" : "\u25BC"}</span>
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
                  style={{
                    display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", backgroundColor: "beige", marginBottom: "5px", fontWeight: "500"
                  }}
                >
                  Holding Institute <span style={{ float: "right" }}>{isInstituteDrawerOpen ? "\u25B2" : "\u25BC"}</span>
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
                  style={{
                    display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", backgroundColor: "beige", marginBottom: "5px", fontWeight: "500"
                  }}
                >
                  Crops <span style={{ float: "right" }}>{isCropDrawerOpen ? "\u25B2" : "\u25BC"}</span>
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
                  onClick={() => setIsTaxonomyDrawerOpen(!isTaxonomyDrawerOpen)}
                  style={{
                    display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", backgroundColor: "beige", marginBottom: "5px", fontWeight: "500"
                  }}
                >
                  Taxonomy <span style={{ float: "right" }}>{isTaxonomyDrawerOpen ? "\u25B2" : "\u25BC"}</span>
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
                  onClick={() => setIsOriginDrawerOpen(!isOriginDrawerOpen)}
                  style={{
                    display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", backgroundColor: "beige", marginBottom: "5px", fontWeight: "500"
                  }}
                >
                  Origin Of Material <span style={{ float: "right" }}>{isOriginDrawerOpen ? "\u25B2" : "\u25BC"}</span>
                </button>
                {isOriginDrawerOpen && (
                  <MultiSelectFilter
                    options={originOfMaterialList}
                    type="originOfMaterialCheckedBoxes"
                  />
                )}
              </div>
              <div>
                <button
                  className="btn btn-info"
                  onClick={() => setIsSampStatDrawerOpen(!isSampStatDrawerOpen)}
                  style={{
                    display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", backgroundColor: "beige", marginBottom: "5px", fontWeight: "500"
                  }}
                >
                  Biological Status Of Accession <span style={{ float: "right" }}>{isSampStatDrawerOpen ? "\u25B2" : "\u25BC"}</span>
                </button>
                {isSampStatDrawerOpen && (
                  <MultiSelectFilter
                    options={sampStatList}
                    type="sampStatCheckedBoxes"
                  />
                )}
              </div>
              <div>
                <button
                  className="btn btn-info"
                  onClick={() => setIsGermplasmStorageDrawerOpen(!isGermplasmStorageDrawerOpen)}
                  style={{
                    display: "inline-block", width: "280px", textAlign: "left", position: "relative", border: "2px solid #ebba35", backgroundColor: "beige", marginBottom: "5px", fontWeight: "500"
                  }}
                >
                  Type Of Germplasm Storage <span style={{ float: "right" }}>{isGermplasmStorageDrawerOpen ? "\u25B2" : "\u25BC"}</span>
                </button>
                {isGermplasmStorageDrawerOpen && (
                  <MultiSelectFilter
                    options={germplasmStorageList}
                    type="germplasmStorageCheckedBoxes"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* div2: Genesys Result */}
        <div
          style={{
            gridColumn: "2 / 5",
            gridRow: "2",
            backgroundImage: `url(${wheatImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "10px",
            overflow: "auto",
            minHeight: "100px",
            height: genesysHeight,
          }}
        >
          {(isLoading || isResetLoading) ? (
            <LoadingComponent />
          ) : (
            <div
              className="container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',  // Adjust this to fit your layout
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '20px',
                  top: '0',
                  position: 'sticky',
                  zIndex: 1,
                }}
              >
                {filterMode === 'Passport Filter' ? (
                  <input
                    type="text"
                    value={inputValue || ''}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Wild Search"
                    style={{ width: '500px', padding: '8px', marginLeft: "250px" }}
                  />
                ) : (
                  <AccessionFilter />
                )}
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => handleSearch(inputValue)}
                  style={{
                    backgroundColor: '#0056b3',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: '10px', // Add spacing if needed
                  }}
                >
                  Search
                </button>
              </div>

              <div style={{ flex: '1 1 auto' }}>
                {Object.keys(searchResults).length !== 0 ? (
                  <MetadataSearchResultTable filterCode={filterCode} />
                ) : null}
              </div>
            </div>
          )}
        </div>
        {/* Horizontal Divider */}
        <div
          style={{
            gridColumn: "2 / 5",
            gridRow: "3",
            background: "gray",
            height: "5px",
            cursor: "row-resize",
          }}
          onMouseDown={handleHorizontalDrag}
        ></div>

        {/* div4: Genotype Result */}
        {Object.keys(checkedAccessions).length > 0 && (
          <div
            style={{
              gridColumn: "2",
              gridRow: "4",
              background: "linear-gradient(to right, #EEF1F2,#F1F3F4, #F3F6F7)",
              padding: "10px",
              minWidth: "100px",
              minHeight: "50px",
              overflow: "auto",
            }}
          >
            <GenotypeExplorer />
          </div>
        )}

      </div>
    </>
  );

};

export default SearchFilters;
