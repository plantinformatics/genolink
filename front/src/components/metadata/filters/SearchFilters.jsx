import { useState, useEffect } from "react";
import LoadingComponent from "../../LoadingComponent";
import { useDispatch, useSelector } from "react-redux";
import { FaCircleXmark } from "react-icons/fa6";
import styles from "./SearchFilters.module.css";

import {
  setInstituteCheckedBoxes,
  setResetTrigger,
  setAccessionNumbers,
  setGenotypeIds,
  setFigs,
  setCreationStartDate,
  setCreationEndDate,
  setCropCheckedBoxes,
  setTaxonomyCheckedBoxes,
  setOriginOfMaterialCheckedBoxes,
  setSampStatCheckedBoxes,
  setGermplasmStorageCheckedBoxes,
  setCheckedAccessions,
  setActiveFilters,
  setWildSearchValue,
  setSelectedFig,
} from "../../../redux/passport/passportActions";

import MultiSelectFilter from "./MultiSelectFilter";
import AccessionFilter from "./AccessionFilter";
import GenotypeIdFilter from "./GenotypeIdFilter";
import FigFilter from "./FigFilter";
import MetadataSearchResultTable from "../MetadataSearchResultTable";
import DateRangeFilter from "./DateRangeFilter";
import GenotypeExplorer from "../../genotype/GenotypeExplorer";
import { genesysApi } from "../../../pages/Home";
import { genolinkInternalApi } from "../../../pages/Home";

const SearchFilters = ({ tokenReady }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [genesysHeight, setGenesysHeight] = useState(
    () => window.innerHeight * 0.6
  );
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [filterCode, setFilterCode] = useState(null);
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [isInstituteDrawerOpen, setIsInstituteDrawerOpen] = useState(false);
  const [isCropDrawerOpen, setIsCropDrawerOpen] = useState(false);
  const [isTaxonomyDrawerOpen, setIsTaxonomyDrawerOpen] = useState(false);
  const [isOriginDrawerOpen, setIsOriginDrawerOpen] = useState(false);
  const [isSampStatDrawerOpen, setIsSampStatDrawerOpen] = useState(false);
  const [isGermplasmStorageDrawerOpen, setIsGermplasmStorageDrawerOpen] =
    useState(false);
  const [isFigsDrawerOpen, setIsFigsDrawerOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("Passport Filter");
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [initialRequestSent, setInitialRequestSent] = useState(false);
  const [initialRequestStatus, setInitialRequestStatus] = useState("pending");
  const [filterBody, setFilterBody] = useState({});
  const [searchButtonName, setSearchButtonName] = useState("Search");
  const [hasGenotype, setHasGenotype] = useState(false);
  const [mappingFailed, setMappingFailed] = useState(false);
  const totalAccessions = useSelector(
    (state) => state.passport.totalAccessions
  );
  const searchResults = useSelector((state) => state.passport.searchResults);

  const isLoadingGenotypedAccessions = useSelector(
    (state) => state.genotype.isLoadingGenotypedAccessions
  );

  const activeFilters = useSelector((state) => state.passport.activeFilters);
  const instituteCheckedBoxes = useSelector(
    (state) => state.passport.instituteCheckedBoxes
  );
  const wildSearchValue = useSelector(
    (state) => state.passport.wildSearchValue
  );
  const cropCheckedBoxes = useSelector(
    (state) => state.passport.cropCheckedBoxes
  );
  const taxonomyCheckedBoxes = useSelector(
    (state) => state.passport.taxonomyCheckedBoxes
  );
  const originOfMaterialCheckedBoxes = useSelector(
    (state) => state.passport.originOfMaterialCheckedBoxes
  );
  const sampStatCheckedBoxes = useSelector(
    (state) => state.passport.sampStatCheckedBoxes
  );
  const germplasmStorageCheckedBoxes = useSelector(
    (state) => state.passport.germplasmStorageCheckedBoxes
  );
  const instituteCode = useSelector((state) => state.passport.instituteCode);

  const resetTrigger = useSelector((state) => state.passport.resetTrigger);
  const accessionNumbers = useSelector(
    (state) => state.passport.accessionNumbers
  );
  const genotypeIds = useSelector((state) => state.passport.genotypeIds);
  const figs = useSelector((state) => state.passport.figs);
  const selectedFig = useSelector((state) => state.passport.selectedFig);
  const creationStartDate = useSelector(
    (state) => state.passport.creationStartDate
  );
  const creationEndDate = useSelector(
    (state) => state.passport.creationEndDate
  );
  const cropList = useSelector((state) => state.passport.cropList);
  const taxonomyList = useSelector((state) => state.passport.taxonomyList);
  const originOfMaterialList = useSelector(
    (state) => state.passport.originOfMaterialList
  );
  const sampStatList = useSelector((state) => state.passport.sampStatList);
  const germplasmStorageList = useSelector(
    (state) => state.passport.germplasmStorageList
  );
  const dispatch = useDispatch();

  const wheatImage = "/Wheat.PNG";

  const withRetryOn401 = async (fn, delay = 500) => {
    try {
      return await fn();
    } catch (error) {
      if (error?.response?.status === 401) {
        console.warn("401 Unauthorized — retrying after delay...");
        await new Promise((res) => setTimeout(res, delay));
        return await fn();
      }
      throw error;
    }
  };

  useEffect(() => {
    if (activeFilters.length > 0 && searchButtonName !== "Update Search") {
      setSearchButtonName("Update Search");
    } else {
      setSearchButtonName("Search");
    }
  }, [activeFilters]);

  useEffect(() => {
    const fetchFigs = async () => {
      try {
        const response = await genolinkInternalApi.getAllFigs();
        dispatch(setFigs(response.figs));
      } catch (error) {
        console.error("Failed to fetch figs:", error);
      }
    };

    fetchFigs();
  }, []);

  useEffect(() => {
    if (!tokenReady) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const filterMode = urlParams.get("filterMode");
        const genotypeIdsParam = urlParams.get("genotypeIds");

        let accessionNums = [];

        if (filterMode === "GenotypeId Filter" && genotypeIdsParam) {
          const genotypeIdList = genotypeIdsParam
            .split(",")
            .map((id) => id.trim());
          setFilterMode(filterMode);
          try {
            accessionNums = await genolinkInternalApi.genotypeIdMapping(
              genotypeIdList
            );
            setMappingFailed(accessionNums.length === 0);
          } catch (e) {
            console.warn("Genotype mapping failed, possibly 404:", e);
            setMappingFailed(true);
          }
        }

        const [_, { filterCode, body }] = await Promise.all([
          withRetryOn401(() =>
            genesysApi.fetchInitialFilterData(
              dispatch,
              " ",
              false,
              accessionNums
            )
          ),
          withRetryOn401(() =>
            genesysApi.fetchInitialQueryData(
              dispatch,
              " ",
              false,
              accessionNums
            )
          ),
        ]);

        setFilterCode(filterCode);
        setFilterBody(body);
        setInitialRequestSent(true);
        setInitialRequestStatus("success");
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setInitialRequestStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dispatch, tokenReady]);
  const removeFilter = (filterToRemove) => {
    switch (filterToRemove.type) {
      case "Text":
        dispatch(setWildSearchValue(""));
        break;
      case "Accession Numbers":
        dispatch(setAccessionNumbers([]));
        break;
      case "Genotype Ids":
        dispatch(setGenotypeIds([]));
        break;
      case "Figs":
        dispatch(setSelectedFig(""));
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

    dispatch(
      setActiveFilters(
        activeFilters.filter((filter) => filter !== filterToRemove)
      )
    );

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
          case "Genotype Ids":
            updatedBody.genotypeIds = filter.value;
            break;
          case "Figs":
            updatedBody.selectedFig = filter.value;
            break;
          case "Institute Code":
            updatedBody.institute = { code: filter.value };
            break;
          case "Start Date":
            updatedBody.createdDate = {
              ...updatedBody.createdDate,
              ge: filter.value,
            };
            break;
          case "End Date":
            updatedBody.createdDate = {
              ...updatedBody.createdDate,
              le: filter.value,
            };
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

    setFilterBody(updatedBody);
  };

  const handleChange = () => {
    setHasGenotype(!hasGenotype);
  };
  const handleSearch = async (userInput = "") => {
    let accessionNums = [];
    if (filterMode === "GenotypeId Filter") {
      if (genotypeIds && genotypeIds.length > 0) {
        accessionNums = await genolinkInternalApi.genotypeIdMapping(
          genotypeIds
        );
      }
    } else if (selectedFig) {
      const convertedFig = await genolinkInternalApi.figMapping(selectedFig);
      accessionNums = [...accessionNums, ...convertedFig];
    }

    dispatch(setResetTrigger(false));
    dispatch(setCheckedAccessions({}));
    setIsLoading(true);
    const body = {
      ...filterBody,

      _text: userInput || (wildSearchValue && wildSearchValue.trim()),

      accessionNumbers:
        accessionNums.length > 0 ? accessionNums : accessionNumbers,

      institute:
        instituteCheckedBoxes.length > 0 ? { code: instituteCheckedBoxes } : [],

      createdDate: {
        ...(creationStartDate !== null ? { ge: creationStartDate } : {}),
        ...(creationEndDate !== null ? { le: creationEndDate } : {}),
      },

      crop: cropCheckedBoxes.length > 0 ? cropCheckedBoxes : [],

      taxonomy:
        taxonomyCheckedBoxes.length > 0 ? { genus: taxonomyCheckedBoxes } : {},

      countryOfOrigin:
        originOfMaterialCheckedBoxes.length > 0
          ? { code3: originOfMaterialCheckedBoxes }
          : {},

      sampStat: sampStatCheckedBoxes.length > 0 ? sampStatCheckedBoxes : [],

      storage:
        germplasmStorageCheckedBoxes.length > 0
          ? germplasmStorageCheckedBoxes
          : [],
    };

    Object.keys(body).forEach((key) => {
      if (
        body[key] === undefined ||
        (typeof body[key] === "object" && !Object.keys(body[key]).length)
      ) {
        delete body[key];
      }
    });

    try {
      const filterCode = await genesysApi.applyFilter(
        body,
        dispatch,
        hasGenotype
      );

      setFilterCode(filterCode);
      setIsLoading(false);
      setIsFilterApplied(true);

      const newFilters = [];
      if (userInput) newFilters.push({ type: "Text", value: userInput });
      if (accessionNumbers.length > 0)
        newFilters.push({ type: "Accession Numbers", value: accessionNumbers });
      if (genotypeIds.length > 0)
        newFilters.push({ type: "Genotype Ids", value: genotypeIds });
      if (selectedFig) newFilters.push({ type: "Figs", value: selectedFig });
      if (instituteCheckedBoxes.length > 0)
        newFilters.push({
          type: "Institute Code",
          value: instituteCheckedBoxes,
        });
      if (creationStartDate)
        newFilters.push({ type: "Start Date", value: creationStartDate });
      if (creationEndDate)
        newFilters.push({ type: "End Date", value: creationEndDate });
      if (cropCheckedBoxes.length > 0)
        newFilters.push({ type: "Crop", value: cropCheckedBoxes });
      if (taxonomyCheckedBoxes.length > 0)
        newFilters.push({ type: "Taxonomy", value: taxonomyCheckedBoxes });
      if (originOfMaterialCheckedBoxes.length > 0)
        newFilters.push({
          type: "Origin of Material",
          value: originOfMaterialCheckedBoxes,
        });
      if (sampStatCheckedBoxes.length > 0)
        newFilters.push({
          type: "Biological Status",
          value: sampStatCheckedBoxes,
        });
      if (germplasmStorageCheckedBoxes.length > 0)
        newFilters.push({
          type: "Germplasm Storage",
          value: germplasmStorageCheckedBoxes,
        });

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
      dispatch(setGenotypeIds([]));
      dispatch(setSelectedFig(""));
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
      setIsFigsDrawerOpen(false);
      dispatch(setCheckedAccessions({}));
    }
  }, [resetTrigger]);

  useEffect(() => {
    setIsFilterApplied(activeFilters.length > 0);
  }, [activeFilters]);

  const handleResetFilter = async () => {
    setIsResetLoading(true);

    try {
      const filterCode = await genesysApi.resetFilter(dispatch);
      setFilterCode(filterCode);
      setIsResetLoading(false);
      setGenesysHeight(window.innerHeight * 0.66);
      dispatch(setActiveFilters([]));
      dispatch(setResetTrigger(true));
      dispatch(setWildSearchValue(""));
    } catch (error) {
      setIsResetLoading(false);
      console.error("Error handling reset filter:", error);
    }
  };

  const handleHorizontalDrag = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const topDiv = e.target.previousElementSibling;
    const startTopHeight = topDiv.offsetHeight;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientY - startY;
      const newTopHeight = Math.max(100, startTopHeight + delta);
      setGenesysHeight(newTopHeight);
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
        className={styles.mainLayout}
        style={{
          gridTemplateRows:
            isLoading || isResetLoading
              ? "auto 1fr 5px 1fr auto"
              : `120px ${genesysHeight}px 5px auto 140px`,
          gridAutoRows: isLoading || isResetLoading ? "none" : "min-content",
          height: isLoading || isResetLoading ? "100vh" : "150vh",
        }}
      >
        {/* div1: Genolink Title */}
        <div className={styles.genolinkContainer}>
          <div className={styles.genolinkSubContainer}>
            <img
              src="/Genolink.png"
              alt="Genolink-logo"
              className={styles.genolinkLogo}
            />
            <h2 className={styles.genolinkHeader}>Genolink</h2>
          </div>

          <p className={styles.dataSourceNote}>
            Powered by{" "}
            <a
              href="https://www.genesys-pgr.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
              onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
              onMouseOut={(e) => (e.target.style.textDecoration = "none")}
            >
              Genesys-PGR
            </a>
          </p>
          <p className={styles.dataSourceNote}>
            Passport data sourced from Genesys-PGR. Use of this service means
            you agree to their{" "}
            <a
              href="https://www.genesys-pgr.org/content/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
              onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
              onMouseOut={(e) => (e.target.style.textDecoration = "none")}
            >
              Terms and Conditions{" "}
            </a>
            and acknowledge Genesys-PGR as the source when using Genolink data.
          </p>
        </div>

        {/* div3: Genesys Filter */}
        <div className={styles.genesysFilterContainer}>
          <h4>Filters</h4>
          {initialRequestSent &&
            (!isLoading && !isLoadingGenotypedAccessions ? (
              <h5>Total Accessions: {totalAccessions}</h5>
            ) : (
              <LoadingComponent />
            ))}
          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.buttonSecondary}
              id="reset-filter-button"
              onClick={handleResetFilter}
            >
              Reset Filter
            </button>
            {!isFilterApplied ? (
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className={styles.filterModeSelect}
              >
                <option value="Passport Filter">Passport Filter</option>
                <option value="Accession Filter">Accession Filter</option>
                <option value="GenotypeId Filter">GenotypeId Filter</option>
              </select>
            ) : null}
          </div>
          <div>
            <h5
              style={{
                visibility: activeFilters.length > 0 ? "visible" : "hidden",
              }}
            >
              Active Filters
            </h5>
            {activeFilters.length > 0 ? (
              <ul className={styles.activeFiltersList}>
                {activeFilters.map((filter, index) => (
                  <li key={index} className={styles.activeFilterItem}>
                    <div className={styles.filterLabel}>{filter.type}:</div>
                    <div className={styles.filterValue}>
                      {Array.isArray(filter.value) &&
                      filter.type === "Accession Numbers" &&
                      filter.value.length > 2
                        ? `${filter.value[0]}, ..., ${
                            filter.value[filter.value.length - 1]
                          }`
                        : Array.isArray(filter.value)
                        ? filter.value.join(", ")
                        : filter.value}
                    </div>
                    <button
                      className={styles.removeFilterButton}
                      onClick={() => removeFilter(filter)}
                    >
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
                  onClick={() => setIsDateDrawerOpen(!isDateDrawerOpen)}
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  Date{" "}
                  <span className={styles.drawerArrow}>
                    {isDateDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
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
                  onClick={() =>
                    setIsInstituteDrawerOpen(!isInstituteDrawerOpen)
                  }
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  Holding Institute{" "}
                  <span className={styles.drawerArrow}>
                    {isInstituteDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {isInstituteDrawerOpen &&
                  (instituteCode && instituteCode.length > 0 ? (
                    <MultiSelectFilter
                      options={instituteCode}
                      type="institueCheckedBoxes"
                    />
                  ) : (
                    <p className={styles.unAwailableFilter}>
                      No available filters.
                    </p>
                  ))}
              </div>
              <div>
                <button
                  onClick={() => setIsCropDrawerOpen(!isCropDrawerOpen)}
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  Crops{" "}
                  <span className={styles.drawerArrow}>
                    {isCropDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {isCropDrawerOpen &&
                  (cropList && cropList.length > 0 ? (
                    <MultiSelectFilter
                      options={cropList}
                      type="cropCheckedBoxes"
                    />
                  ) : (
                    <p className={styles.unAwailableFilter}>
                      No available filters.
                    </p>
                  ))}
              </div>
              <div>
                <button
                  onClick={() => setIsTaxonomyDrawerOpen(!isTaxonomyDrawerOpen)}
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  Taxonomy{" "}
                  <span className={styles.drawerArrow}>
                    {isTaxonomyDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {isTaxonomyDrawerOpen &&
                  (taxonomyList && taxonomyList.length > 0 ? (
                    <MultiSelectFilter
                      options={taxonomyList}
                      type="taxonomyCheckedBoxes"
                    />
                  ) : (
                    <p className={styles.unAwailableFilter}>
                      No available filters.
                    </p>
                  ))}
              </div>
              <div>
                <button
                  onClick={() => setIsOriginDrawerOpen(!isOriginDrawerOpen)}
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  Origin Of Material{" "}
                  <span className={styles.drawerArrow}>
                    {isOriginDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {isOriginDrawerOpen &&
                  (originOfMaterialList && originOfMaterialList.length > 0 ? (
                    <MultiSelectFilter
                      options={originOfMaterialList}
                      type="originOfMaterialCheckedBoxes"
                    />
                  ) : (
                    <p className={styles.unAwailableFilter}>
                      No available filters.
                    </p>
                  ))}
              </div>
              <div>
                <button
                  onClick={() => setIsSampStatDrawerOpen(!isSampStatDrawerOpen)}
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  Biological Status Of Accession{" "}
                  <span className={styles.drawerArrow}>
                    {isSampStatDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {isSampStatDrawerOpen &&
                  (sampStatList && sampStatList.length > 0 ? (
                    <MultiSelectFilter
                      options={sampStatList}
                      type="sampStatCheckedBoxes"
                    />
                  ) : (
                    <p className={styles.unAwailableFilter}>
                      No available filters.
                    </p>
                  ))}
              </div>
              <div>
                <button
                  onClick={() =>
                    setIsGermplasmStorageDrawerOpen(
                      !isGermplasmStorageDrawerOpen
                    )
                  }
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  Type Of Germplasm Storage{" "}
                  <span className={styles.drawerArrow}>
                    {isGermplasmStorageDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {isGermplasmStorageDrawerOpen &&
                  (germplasmStorageList && germplasmStorageList.length > 0 ? (
                    <MultiSelectFilter
                      options={germplasmStorageList}
                      type="germplasmStorageCheckedBoxes"
                    />
                  ) : (
                    <p className={styles.unAwailableFilter}>
                      No available filters.
                    </p>
                  ))}
              </div>
              <div>
                <button
                  onClick={() => setIsFigsDrawerOpen(!isFigsDrawerOpen)}
                  className={`${styles.btnInfo} ${styles.passportFilterDrawers}`}
                >
                  FIGS set{" "}
                  <span className={styles.drawerArrow}>
                    {isFigsDrawerOpen ? "\u25B2" : "\u25BC"}
                  </span>
                </button>
                {isFigsDrawerOpen &&
                  (figs && figs.length > 0 ? (
                    <FigFilter />
                  ) : (
                    <p className={styles.unAwailableFilter}>
                      No available filters.
                    </p>
                  ))}
              </div>
            </>
          )}
          <div>
            <label
              style={{
                fontWeight: 500,
                color: wildSearchValue ? "#888" : "inherit",
                cursor: wildSearchValue ? "not-allowed" : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={hasGenotype}
                onChange={handleChange}
                className={styles.mR8}
                disabled={wildSearchValue}
              />
              Check for genotype
            </label>
          </div>
        </div>

        {/* div2: Genesys Result */}
        <div
          className={styles.genesysResultContainer}
          style={{
            backgroundImage: `url(${wheatImage})`,
          }}
        >
          {isLoading || isResetLoading ? (
            <LoadingComponent />
          ) : (
            <div className={styles.pageLayout}>
              <div className={styles.filterBar}>
                {filterMode === "Passport Filter" ? (
                  <input
                    type="text"
                    value={wildSearchValue || ""}
                    onChange={(e) =>
                      dispatch(setWildSearchValue(e.target.value))
                    }
                    placeholder="Wild Search"
                    className={styles.wildSearchInput}
                  />
                ) : filterMode === "Accession Filter" ? (
                  <AccessionFilter />
                ) : (
                  <GenotypeIdFilter />
                )}
                <button
                  type="button"
                  className={`${styles.buttonPrimary} ${styles.searchButton}`}
                  onClick={() => handleSearch(wildSearchValue)}
                >
                  {searchButtonName}
                </button>
              </div>

              <div className={styles.searchResultsContainer}>
                {initialRequestStatus === "pending" && <LoadingComponent />}

                {initialRequestStatus === "error" && !mappingFailed && (
                  <div className={styles.alertBox}>
                    <div role="alert" className={styles.alertMessage}>
                      <strong>Error:</strong> Unable to load data from Genesys.
                      <br />
                      Please check your connection or click the button below.
                      <br />
                      <button
                        onClick={() => window.location.reload()}
                        className={styles.buttonDanger}
                      >
                        Refresh Page
                      </button>
                    </div>
                  </div>
                )}

                {(initialRequestStatus === "success" &&
                  searchResults?.length === 0) ||
                (mappingFailed && searchResults?.length === 0) ? (
                  <div className={styles.noResultWrapper}>
                    <div className={styles.alertWarning} role="alert">
                      <strong>No data found.</strong> The selected filters
                      returned no results.
                      <br />
                      Please reset or try using different filters.
                    </div>
                  </div>
                ) : null}

                {initialRequestStatus === "success" &&
                  searchResults?.length > 0 && (
                    <MetadataSearchResultTable
                      filterCode={filterCode}
                      filterBody={filterBody}
                      hasGenotype={hasGenotype}
                      searchResults={searchResults}
                    />
                  )}
              </div>
            </div>
          )}
        </div>
        {/* Horizontal Divider */}
        <div
          className={styles.horizontalDivider}
          onMouseDown={handleHorizontalDrag}
        ></div>
        {/* div4: Genotype Result */}
        <div className={styles.genotypeResultContainer}>
          <GenotypeExplorer />
        </div>
        <div className={styles.footerSection}>
          <p className={styles.footerDescription}>
            Genolink is a middleware connecting genotype databases with
            Genesys-PGR. Funded by the $30M Australian Grains Genebank
            Partnership, it enhances genetic resource potential for Australian
            grain growers.{" "}
            <a
              href="https://agriculture.vic.gov.au/crops-and-horticulture/the-australian-grains-genebank"
              className={styles.footerLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
            </a>
          </p>
          <div className={styles.logoContainer}>
            <img
              src="/agriculture-victoria-logo.png"
              alt="Agriculture-Victoria-logo"
              className={styles.partnerLogo}
            />
            <img
              src="/Australian-Grains-Genebank-logo.jpg"
              alt="Australian-Grains-Genebank-logo"
              className={styles.partnerLogo}
            />
            <img
              src="/Genesys-logo.jpg"
              alt="Genesys-logo.jpg"
              className={styles.partnerLogo}
            />
            <img
              src="/Germinate-logo.png"
              alt="Germinate-logo"
              className={styles.partnerLogo}
            />
            <img
              src="/Gigwa-logo.png"
              alt="Gigwa-logo"
              className={styles.partnerLogo}
            />
            <img
              src="/GRDC-logo.jpg"
              alt="GRDC-logo"
              className={styles.partnerLogo}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchFilters;
