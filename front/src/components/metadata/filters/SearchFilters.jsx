import { useState, useEffect } from "react";
import LoadingComponent from "../../LoadingComponent";
import { useDispatch, useSelector } from "react-redux";
import { FaCircleXmark } from "react-icons/fa6";
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
  setActiveFilters,
} from "../../../actions";

import MultiSelectFilter from "./MultiSelectFilter";
import AccessionFilter from "./AccessionFilter";
import MetadataSearchResultTable from "../MetadataSearchResultTable";
import DateRangeFilter from "./DateRangeFilter";
import GenotypeExplorer from "../../genotype/GenotypeExplorer";
import { genesysApi } from "../../../pages/Home";
import { genolinkInternalApi } from "../../../pages/Home";

const SearchFilters = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [genesysHeight, setGenesysHeight] = useState("auto");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [filterCode, setFilterCode] = useState(null);
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
  const [inputValue, setInputValue] = useState("");
  const [filterBody, setFilterBody] = useState({});
  const [searchButtonName, setSearchButtonName] = useState("Search");
  const [hasGenotype, setHasGenotype] = useState(false);
  const checkedAccessions = useSelector((state) => state.checkedAccessions);
  const hasCheckedAccessions = Object.keys(checkedAccessions).length > 0;
  const totalAccessions = useSelector((state) => state.totalAccessions);
  const searchResults = useSelector((state) => state.searchResults);
  const isLoadingGenotypedAccessions = useSelector(
    (state) => state.isLoadingGenotypedAccessions
  );

  const activeFilters = useSelector(
    (state) => state.activeFilters
  );
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

  const wheatImage = '/Wheat.PNG';

  useEffect(() => {
    if (Object.keys(checkedAccessions).length === 0) {
      setGenesysHeight("auto");
    }
  }, [checkedAccessions]);

  useEffect(() => {
    if (activeFilters.length > 0 && searchButtonName !== "Update Search") {
      setSearchButtonName('Update Search')
    } else {
      setSearchButtonName('Search');
    }
  }, [activeFilters]);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!genesysApi.getToken()) {
          await genesysApi.fetchAndSetToken();
        }

        const [_, filterCode] = await Promise.all([
          genesysApi.fetchInitialFilterData(dispatch),
          genesysApi.fetchInitialQueryData(dispatch)
        ]);

        setFilterCode(filterCode);
        setInitialRequestSent(true);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  const removeFilter = (filterToRemove) => {
    switch (filterToRemove.type) {
      case "Text":
        setInputValue("");
        break;
      case "Accession Numbers":
        dispatch(setAccessionNumbers([]));
        break;
      case "Institute Code":
        dispatch(setInstituteCheckedBoxes([]));
        break;
      case "Start Date":
        dispatch(setCreationStartDate(null));
        break;
      case "End Date":
        dispatch(setCreationEndDate(null));
        break;
      case "Crop":
        dispatch(setCropCheckedBoxes([]));
        break;
      case "Taxonomy":
        dispatch(setTaxonomyCheckedBoxes([]));
        break;
      case "Origin of Material":
        dispatch(setOriginOfMaterialCheckedBoxes([]));
        break;
      case "Biological Status":
        dispatch(setSampStatCheckedBoxes([]));
        break;
      case "Germplasm Storage":
        dispatch(setGermplasmStorageCheckedBoxes([]));
        break;
      default:
        break;
    }

    dispatch(setActiveFilters(activeFilters.filter((filter) => filter !== filterToRemove)));

    let updatedBody = {};
    activeFilters
      .filter((filter) => filter !== filterToRemove)
      .forEach((filter) => {
        switch (filter.type) {
          case "Text":
            updatedBody._text = filter.value;
            break;
          case "Accession Numbers":
            updatedBody.accessionNumbers = filter.value;
            break;
          case "Institute Code":
            updatedBody.institute = { code: filter.value };
            break;
          case "Start Date":
            updatedBody.createdDate = { ...updatedBody.createdDate, ge: filter.value };
            break;
          case "End Date":
            updatedBody.createdDate = { ...updatedBody.createdDate, le: filter.value };
            break;
          case "Crop":
            updatedBody.crop = filter.value;
            break;
          case "Taxonomy":
            updatedBody.taxonomy = { genus: filter.value };
            break;
          case "Origin of Material":
            updatedBody.countryOfOrigin = { code3: filter.value };
            break;
          case "Biological Status":
            updatedBody.sampStat = filter.value;
            break;
          case "Germplasm Storage":
            updatedBody.storage = filter.value;
            break;
          default:
            break;
        }
      });

    setFilterBody(updatedBody)
  };

  const handleChange = () => {
    setHasGenotype(!hasGenotype);
  }
  const handleSearch = async (userInput = "") => {
    dispatch(setResetTrigger(false));
    dispatch(setCheckedAccessions({}));
    setIsLoading(true);
    const body = {
      ...filterBody,

      _text: userInput || (inputValue && inputValue.trim()),

      accessionNumbers,

      institute: instituteCheckedBoxes.length > 0 ? { code: instituteCheckedBoxes } : [],

      createdDate: {
        ...(creationStartDate !== null ? { ge: creationStartDate } : {}),
        ...(creationEndDate !== null ? { le: creationEndDate } : {}),
      },

      crop: cropCheckedBoxes.length > 0 ? cropCheckedBoxes : [],

      taxonomy: taxonomyCheckedBoxes.length > 0 ? { genus: taxonomyCheckedBoxes } : {},

      countryOfOrigin: originOfMaterialCheckedBoxes.length > 0 ? { code3: originOfMaterialCheckedBoxes } : {},

      sampStat: sampStatCheckedBoxes.length > 0 ? sampStatCheckedBoxes : [],

      storage: germplasmStorageCheckedBoxes.length > 0 ? germplasmStorageCheckedBoxes : [],
    };

    Object.keys(body).forEach((key) => {
      if (
        body[key] === undefined ||
        (typeof body[key] === 'object' && !Object.keys(body[key]).length)
      ) {
        delete body[key];
      }
    });


    try {
      const filterCode = await genesysApi.applyFilter(body, dispatch, hasGenotype);

      setFilterCode(filterCode);
      setIsLoading(false);
      setIsFilterApplied(true);

      const newFilters = [];
      if (userInput) newFilters.push({ type: "Text", value: userInput });
      if (accessionNumbers.length > 0) newFilters.push({ type: "Accession Numbers", value: accessionNumbers });
      if (instituteCheckedBoxes.length > 0) newFilters.push({ type: "Institute Code", value: instituteCheckedBoxes });
      if (creationStartDate) newFilters.push({ type: "Start Date", value: creationStartDate });
      if (creationEndDate) newFilters.push({ type: "End Date", value: creationEndDate });
      if (cropCheckedBoxes.length > 0) newFilters.push({ type: "Crop", value: cropCheckedBoxes });
      if (taxonomyCheckedBoxes.length > 0) newFilters.push({ type: "Taxonomy", value: taxonomyCheckedBoxes });
      if (originOfMaterialCheckedBoxes.length > 0) newFilters.push({ type: "Origin of Material", value: originOfMaterialCheckedBoxes });
      if (sampStatCheckedBoxes.length > 0) newFilters.push({ type: "Biological Status", value: sampStatCheckedBoxes });
      if (germplasmStorageCheckedBoxes.length > 0) newFilters.push({ type: "Germplasm Storage", value: germplasmStorageCheckedBoxes });

      dispatch(setActiveFilters(newFilters));

      setFilterBody(body);
    } catch (error) {
      console.error("Error applying filter:", error);
      setIsLoading(false);
      setIsFilterApplied(false);
    }
  };
  useEffect(() => {
    if (resetTrigger) {
      dispatch(setInstituteCheckedBoxes([]));
      dispatch(setAccessionNumbers([]));
      dispatch(setCreationEndDate(null));
      dispatch(setCreationStartDate(null));
      dispatch(setCropCheckedBoxes([]));
      dispatch(setTaxonomyCheckedBoxes([]));
      dispatch(setOriginOfMaterialCheckedBoxes([]));
      dispatch(setSampStatCheckedBoxes([]));
      dispatch(setGermplasmStorageCheckedBoxes([]));
      setIsCropDrawerOpen(false);
      setIsDateDrawerOpen(false);
      setIsInstituteDrawerOpen(false);
      setIsOriginDrawerOpen(false);
      setIsTaxonomyDrawerOpen(false);
      setIsSampStatDrawerOpen(false);
      setIsGermplasmStorageDrawerOpen(false);
      dispatch(setCheckedAccessions({}));
    }
  }, [resetTrigger]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUploadClick = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    try {
      setIsUploadLoading(true);
      await genolinkInternalApi.createSampleAccessions(file);
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

    try {
      const filterCode = await genesysApi.resetFilter(dispatch);
      setFilterCode(filterCode);
      setIsResetLoading(false);
      setIsFilterApplied(false);
      setGenesysHeight("auto");
      dispatch(setActiveFilters([]));
      dispatch(setResetTrigger(true));
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, auto) 1fr",
          // gridTemplateRows: hasCheckedAccessions
          //   ? "auto 1fr 5px 1fr auto"
          //   : "auto 1fr auto",
          // gridAutoRows: "min-content",
          gridTemplateRows: (isLoading || isResetLoading)
            ? hasCheckedAccessions
              ? "auto 1fr 5px 1fr auto"
              : "auto 1fr auto"
            : "none",
          gridAutoRows: (isLoading || isResetLoading)
            ? "none"
            : "min-content",
          gap: "0px",
          height: "100vh",
          padding: "10px",
          overflowY: "auto",
        }}
      >
        {/* div1: Genolink Title */}
        <div
          style={{
            gridColumn: "1 / 3",
            gridRow: "1",
            background: "green",
            color: "white",
            textAlign: "center",
            padding: "10px",
          }}
        >
          <img
            src="/Genolink.png"
            alt="Genolink-logo"
            style={{ marginRight: "20px", verticalAlign: "middle" }}
          />
          <h2 style={{ margin: "0", display: "inline" }}>Genolink</h2>
        </div>

        {/* div3: Genesys Filter */}
        <div
          style={{
            maxWidth: "340px",
            overflowX: "auto",
            gridColumn: "1",
            gridRow: hasCheckedAccessions ? "2 / 5" : "2 / 4",
            background: "#50748c00",
            borderRight: "5px solid gray",
            padding: "10px",
            minWidth: "320px",
            overflow: "auto",
            height: "100%"
          }}
        >
          <h4>Filters</h4>
          {initialRequestSent && ((!isLoading && !isLoadingGenotypedAccessions) ?
            (<h5>Total Accessions: {totalAccessions}</h5>) : <LoadingComponent />)
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
          <div>
            <h5 style={{ visibility: activeFilters.length > 0 ? 'visible' : 'hidden' }}>Active Filters</h5>
            {activeFilters.length > 0 ? (
              <ul className="active-filters-list">
                {activeFilters.map((filter, index) => (
                  <li key={index} className="active-filter-item">
                    <div className="filter-label">{filter.type}:</div>
                    <div className="filter-value">
                      {Array.isArray(filter.value) && filter.type === "Accession Numbers" && filter.value.length > 2
                        ? `${filter.value[0]}, ..., ${filter.value[filter.value.length - 1]}`
                        : Array.isArray(filter.value)
                          ? filter.value.join(", ")
                          : filter.value}
                    </div>
                    <button className="remove-filter-button" onClick={() => removeFilter(filter)}>
                      <FaCircleXmark color="red" />
                    </button>
                  </li>
                ))}
              </ul>
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
          <div>
            <label style={{ fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={hasGenotype}
                onChange={handleChange}
                style={{ marginRight: "8px" }}
              />
              Check for genotype
            </label>

          </div>
        </div>

        {/* div2: Genesys Result */}
        <div
          style={{
            gridColumn: "2",
            gridRow: "2",
            backgroundImage: `url(${wheatImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "10px",
            overflow: "auto",
            minHeight: "100px",
            height: hasCheckedAccessions ? genesysHeight : "100%",
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
                height: '100vh',
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
                    marginLeft: '10px',
                  }}
                >
                  {searchButtonName}
                </button>
              </div>

              <div style={{ flex: '1 1 auto' }}>
                {Object.keys(searchResults).length !== 0 ? (
                  <MetadataSearchResultTable filterCode={filterCode} hasGenotype={hasGenotype} filterBody={filterBody} />
                ) : null}
              </div>
            </div>
          )}
        </div>
        {/* Horizontal Divider */}
        {Object.keys(checkedAccessions).length > 0 && (
          <div
            style={{
              gridColumn: "2",
              gridRow: "3",
              background: "gray",
              height: "5px",
              cursor: "row-resize",
            }}
            onMouseDown={handleHorizontalDrag}
          ></div>
        )}
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

        {/* New About Section */}
        <div
          style={{
            gridColumn: "1 / 3", // Takes both columns
            gridRow: hasCheckedAccessions ? "5" : "4",
            background: "green",
            color: "white",
            padding: "20px",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <p style={{ textAlign: "center", margin: "0 0 10px 0", fontSize: "15px" }}>
            Genolink is a middleware connecting genotype databases with Genesys-PGR. Funded by the $30M Australian Grains Genebank Partnership, it enhances genetic resource potential for Australian grain growers.            <a
              href="https://agriculture.vic.gov.au/crops-and-horticulture/the-australian-grains-genebank"
              style={{ color: "white", textDecoration: "underline" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
            </a>
          </p>
          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img src="/agriculture-victoria-logo.png" alt="Agriculture-Victoria-logo" style={{ height: "60px" }} />
            <img src="/Australian-Grains-Genebank-logo.jpg" alt="Australian-Grains-Genebank-logo" style={{ height: "60px" }} />
            <img src="/Genesys-logo.jpg" alt="Genesys-logo.jpg" style={{ height: "60px" }} />
            <img src="/Germinate-logo.png" alt="Germinate-logo" style={{ height: "60px" }} />
            <img src="/Gigwa-logo.png" alt="Gigwa-logo" style={{ height: "60px" }} />
            <img src="/GRDC-logo.jpg" alt="GRDC-logo" style={{ height: "60px" }} />
          </div>
        </div>
      </div>
    </>
  );

};

export default SearchFilters;
