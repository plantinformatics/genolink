import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import {
  setPlatform,
  setResetTrigger,
  setWildSearchValue,
} from "../../../redux/passport/passportActions";
import * as genotypeActions from "../../../redux/genotype/genotypeActions";

import LoadingComponent from "../../LoadingComponent";
import { linkageGroupFilter } from "../filters/LinkageGroupFilter";
import PositionRangeFilter from "../filters/PositionRangeFilter";
import VariantListFilter from "../filters/VariantListFilter";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faCopy } from "@fortawesome/free-solid-svg-icons";

import GenolinkGigwaApi from "../../../api/GenolinkGigwaApi";
import GenolinkGerminateApi from "../../../api/GenolinkGerminateApi";
import {
  platforms,
  REQUIRE_GIGWA_CREDENTIALS,
} from "../../../config/apiConfig";
import styles from "../GenotypeExplorer.module.css";
import { genesysApi } from "../../../pages/Home";

import DatasetSelector from "./DatasetSelector";

const GigwaWorkflowController = () => {
  const dispatch = useDispatch();

  // ---------- Local UI state (kept OUT of GenotypeExplorer)
  const [genolinkGerminateApi] = useState(new GenolinkGerminateApi());
  const [copied, setCopied] = useState(false);
  const [posStart, setPosStart] = useState("");
  const [posEnd, setPosEnd] = useState("");
  const [isGenomDataLoading, setIsGenomDataLoading] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

  const [usernames, setUsernames] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [accessMode, setAccessMode] = useState([]);

  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [selectedGigwaServers, setSelectedGigwaServers] = useState([]);
  const [searchSamplesInDatasetsResult, setSearchSamplesInDatasetsResult] =
    useState([]);
  const [uiStep, setUiStep] = useState(0);
  const [showPrivacyRadio, setShowPrivacyRadio] = useState(true);

  const genolinkGigwaApisRef = useRef({});

  // ---------- Redux state (SELECTION + EXECUTION)
  const selectedOption = useSelector((state) => state.genotype.selectedOption);

  const datasets = useSelector((state) => state.genotype.datasets);
  const selectedDataset = useSelector(
    (state) => state.genotype.selectedDataset,
  );
  const selectedStudyDbId = useSelector(
    (state) => state.genotype.selectedStudyDbId,
  );
  const selectedVariantSetDbId = useSelector(
    (state) => state.genotype.selectedVariantSetDbId,
  );

  const sampleDetails = useSelector((state) => state.genotype.sampleDetails);
  const sampleDbIds = useSelector((state) => state.genotype.sampleDbIds);
  const sampleNames = useSelector((state) => state.genotype.sampleNames);
  const selectedSamplesDetails = useSelector(
    (state) => state.genotype.selectedSamplesDetails,
  );

  const isGenomeSearchSubmit = useSelector(
    (state) => state.genotype.isGenomeSearchSubmit,
  );
  const pagesPerServer = useSelector((state) => state.genotype.pagesPerServer);
  const genotypeCurrentPage = useSelector(
    (state) => state.genotype.genotypeCurrentPage,
  );
  const selectedGroups = useSelector((state) => state.genotype.selectedGroups);
  const linkageGroups = useSelector((state) => state.genotype.linkageGroups);
  const variantList = useSelector((state) => state.genotype.variantList);

  const numberOfGenesysAccessions = useSelector(
    (state) => state.genotype.numberOfGenesysAccessions,
  );
  const numberOfPresentAccessions = useSelector(
    (state) => state.genotype.numberOfPresentAccessions,
  );
  const numberOfMappedAccessions = useSelector(
    (state) => state.genotype.numberOfMappedAccessions,
  );

  const resetTrigger = useSelector((state) => state.passport.resetTrigger);
  const searchResults = useSelector((state) => state.passport.searchResults);
  const checkedAccessionsObject = useSelector(
    (state) => state.passport.checkedAccessions,
  );
  const checkedAccessionNamesObject = useSelector(
    (state) => state.passport.checkedAccessionNames,
  );

  const checkedAccessions = Object.keys(checkedAccessionsObject);

  const checkedResults = useMemo(() => {
    return Array.isArray(searchResults)
      ? searchResults.filter((item) =>
          checkedAccessions.includes(item.accessionNumber),
        )
      : [];
  }, [searchResults, checkedAccessions]);

  // ---------- Behaviors

  useEffect(() => {
    // Pagination fetch ONLY after search has been submitted
    if (selectedOption === "Gigwa" && isGenomeSearchSubmit) {
      fetchData(genotypeCurrentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genotypeCurrentPage]);

  useEffect(() => {
    // when switching platform, clear results
    dispatch(genotypeActions.setGenomData([]));
  }, [selectedOption, dispatch]);

  useEffect(() => {
    if (selectedGigwaServers.length > 0) {
      const defaultAccessModes = selectedGigwaServers.map(() =>
        REQUIRE_GIGWA_CREDENTIALS ? "private" : "public",
      );
      const defaultUsernames = selectedGigwaServers.map(() => "");
      const defaultPasswords = selectedGigwaServers.map(() => "");

      setAccessMode(defaultAccessModes);
      setUsernames(defaultUsernames);
      setPasswords(defaultPasswords);
    }
  }, [selectedGigwaServers]);

  useEffect(() => {
    if (resetTrigger) {
      handleReset();
      dispatch(setResetTrigger(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // linkage group fetch depends on selectedStudyDbId + servers, so keep here
  useEffect(() => {
    if (selectedStudyDbId.length === 0 || resetTrigger) return;

    const fetchAllLinkageGroups = async () => {
      const allGroups = [];

      for (let i = 0; i < selectedGigwaServers.length; i++) {
        const studyDbId = selectedStudyDbId[i];
        const groups = await linkageGroupFilter({
          selectedStudyDbId: studyDbId,
          genolinkGigwaApi:
            genolinkGigwaApisRef.current[selectedGigwaServers[i]],
          genolinkGerminateApi: genolinkGerminateApi,
          selectedGigwaServer: selectedGigwaServers[i],
          platform: selectedOption,
          checkedAccessionsObject,
        });

        allGroups.push(...groups);
      }

      const uniqueGroups = Array.from(new Set(allGroups));
      dispatch(genotypeActions.setLinkageGroups(uniqueGroups));
    };

    fetchAllLinkageGroups();
  }, [
    selectedOption,
    selectedGigwaServers,
    selectedStudyDbId,
    checkedAccessionsObject,
    resetTrigger,
    dispatch,
    genolinkGerminateApi,
  ]);

  const fetchGigwaServers = async (accessions) => {
    if (checkedResults.length > 0) {
      const info = await genesysApi.genotypeInfo(accessions);
      const gigwaServers = [...new Set(info.map((item) => item.serverUrl))];

      if (
        JSON.stringify(selectedGigwaServers) !== JSON.stringify(gigwaServers)
      ) {
        setSelectedGigwaServers(gigwaServers);
      }

      if (gigwaServers.length > 0) {
        const newInstances = {};
        for (const server of gigwaServers) {
          if (genolinkGigwaApisRef.current[server]?.token) {
            newInstances[server] = genolinkGigwaApisRef.current[server];
          } else {
            newInstances[server] = new GenolinkGigwaApi(server);
          }
        }
        genolinkGigwaApisRef.current = newInstances;
      }
    } else {
      genolinkGigwaApisRef.current = {};
      setSelectedGigwaServers([]);
    }
  };

  const handleInputChange = (groupName) => {
    dispatch(genotypeActions.setSelectedGroups(groupName));
  };

  const handleUsernameChange = (index, value) => {
    setUsernames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handlePasswordChange = (index, value) => {
    setPasswords((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAccessModeChange = (index, event) => {
    setAccessMode((prev) => {
      const next = [...prev];
      next[index] = event.target.value;
      return next;
    });
  };

  const handleDatasetDetails = useCallback(
    (groupIndex, selectedValue) => {
      let updatedSelection = Array.isArray(selectedDataset)
        ? [...selectedDataset]
        : [];
      updatedSelection[groupIndex] = [selectedValue];

      dispatch(genotypeActions.setSelectedDataset(updatedSelection));

      const selectedVariantSetDbIdLocal = datasets.map((innerArray, index) =>
        innerArray.filter(
          (variantSetDbId) => variantSetDbId === updatedSelection[index]?.[0],
        ),
      );

      const selectedSamples = sampleDetails.map((server, gIdx) =>
        server.filter((sample) => {
          const sel = updatedSelection[gIdx]?.[0];
          if (!sel) return false;
          const [programDbId, projectId, runId] = sel.split("§");
          const targetStudyDbId = `${programDbId}§${projectId}`;
          return (
            sample.studyDbId === targetStudyDbId &&
            sample.sampleName.endsWith(runId)
          );
        }),
      );

      const selectedSampleDbIdsLocal = selectedSamples.map((server) =>
        server.map((sample) => sample.sampleDbId),
      );

      const selectedAccessionPlusAccessionName =
        searchSamplesInDatasetsResult.map((server, gIdx) => {
          const sel = updatedSelection[gIdx]?.[0];
          if (!sel) return [];
          const [programDbId, projectId, runId] = sel.split("§");

          const matchingGermplasmIds = [
            ...new Set(
              server.response.result.data
                .filter(
                  (sample) =>
                    sample.germplasmDbId.split("§")[0] === programDbId &&
                    sample.sampleName.endsWith(runId),
                )
                .map((sample) => sample.germplasmDbId.split("§")[1]),
            ),
          ];

          return server.accessionPlusAccessionName.filter((item) =>
            matchingGermplasmIds.some((gid) => item.includes(gid)),
          );
        });

      const selectedStudyDbIdLocal = datasets.map((innerArray, index) =>
        innerArray
          .filter(
            (variantSetDbId) => variantSetDbId === updatedSelection[index]?.[0],
          )
          .map((variantSetDbId) =>
            variantSetDbId.split("§").slice(0, 2).join("§"),
          ),
      );

      dispatch(
        genotypeActions.setSelectedVariantSetDbId(selectedVariantSetDbIdLocal),
      );
      dispatch(genotypeActions.setSelectedSamplesDetails(selectedSamples));
      dispatch(genotypeActions.setSelectedStudyDbId(selectedStudyDbIdLocal));
      dispatch(genotypeActions.setSampleDbIds(selectedSampleDbIdsLocal));
      dispatch(
        genotypeActions.setCompleteNames(selectedAccessionPlusAccessionName),
      );
    },
    [
      dispatch,
      datasets,
      sampleDetails,
      selectedDataset,
      searchSamplesInDatasetsResult,
    ],
  );

  const handleReset = () => {
    setShowDatasetSelector(false);
    setPosStart("");
    setPosEnd("");
    setUiStep(0);
    setSearchType("");
    setSearchSamplesInDatasetsResult([]);
    setSelectedGigwaServers([]);
    genolinkGigwaApisRef.current = {};

    dispatch(genotypeActions.resetGenotype());
    dispatch(setWildSearchValue(""));
  };

  const handleOptionChange = (event) => {
    dispatch(genotypeActions.setIsGenomeSearchSubmit(false));
    const newSelectedOption = event.target.value;
    dispatch(genotypeActions.setSelectedOption(newSelectedOption));
    dispatch(setPlatform(newSelectedOption));
    setShowPrivacyRadio(true);
  };

  const handleSearchTypeChange = (newType) => {
    if (newType !== searchType) {
      if (newType === "PositionRange") {
        dispatch(genotypeActions.setVariantList([]));
      } else if (newType === "VariantIDs") {
        setPosStart("");
        setPosEnd("");
        dispatch(genotypeActions.setSelectedGroups(""));
      }
    }
    setSearchType(newType);
  };

  const handleCopySampleNames = () => {
    const flatSamples = sampleNames.flat();
    navigator.clipboard
      .writeText(flatSamples.join("\n"))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Failed to copy sample names: ", err));
  };

  const fetchData = async (page) => {
    try {
      if (checkedAccessions.length === 0) {
        alert("Please select accessions from the passport table.");
        return;
      }
      if (Object.keys(genolinkGigwaApisRef.current).length === 0) {
        alert("No valid Gigwa servers available.");
        return;
      }

      setIsGenomDataLoading(true);

      if (selectedOption === "Gigwa") {
        const buildAlleleReqs = (buildBody) => {
          return Object.entries(genolinkGigwaApisRef.current)
            .filter(([_, __], idx) => {
              const pages = pagesPerServer?.[idx];
              return !(Array.isArray(pages) && page > pages.length);
            })
            .map(([_, api], idx) => ({
              api,
              idx,
              promise: api.fetchAlleles(buildBody(idx)),
            }));
        };

        let alleleReqs = [];
        const variantPageSize = 20;
        const callsetPageSize = 500;

        if (posStart && posEnd) {
          alleleReqs = buildAlleleReqs((index) => ({
            selectedGigwaServer: selectedGigwaServers[index],
            callSetDbIds: sampleDbIds[index],
            variantSetDbIds: selectedVariantSetDbId[index],
            positionRanges: selectedGroups
              ? [`${selectedGroups}:${posStart}-${posEnd}`]
              : [],
            dataMatrixAbbreviations: ["GT"],
            pagination: [
              {
                dimension: "variants",
                page: page - 1,
                pageSize: variantPageSize,
              },
              { dimension: "callsets", page: 0, pageSize: callsetPageSize },
            ],
          }));
        } else if (!posStart && !posEnd && selectedGroups) {
          alleleReqs = buildAlleleReqs((index) => ({
            selectedGigwaServer: selectedGigwaServers[index],
            callSetDbIds: sampleDbIds[index],
            variantSetDbIds: selectedVariantSetDbId[index],
            positionRanges: [selectedGroups],
            dataMatrixAbbreviations: ["GT"],
            pagination: [
              {
                dimension: "variants",
                page: page - 1,
                pageSize: variantPageSize,
              },
              { dimension: "callsets", page: 0, pageSize: callsetPageSize },
            ],
          }));
        } else if (variantList.length > 0) {
          alleleReqs = buildAlleleReqs((index) => ({
            selectedGigwaServer: selectedGigwaServers[index],
            callSetDbIds: sampleDbIds[index],
            variantSetDbIds: selectedVariantSetDbId[index],
            variantDbIds: variantList.map(
              (variant) =>
                `${selectedVariantSetDbId[index][0].split("§")[0]}§${variant}`,
            ),
            dataMatrixAbbreviations: ["GT"],
            pagination: [
              {
                dimension: "variants",
                page: page - 1,
                pageSize: variantPageSize,
              },
              { dimension: "callsets", page: 0, pageSize: callsetPageSize },
            ],
          }));
        } else {
          alleleReqs = buildAlleleReqs((index) => ({
            selectedGigwaServer: selectedGigwaServers[index],
            callSetDbIds: sampleDbIds[index],
            variantSetDbIds: selectedVariantSetDbId[index],
            dataMatrixAbbreviations: ["GT"],
            pagination: [
              {
                dimension: "variants",
                page: page - 1,
                pageSize: variantPageSize,
              },
              { dimension: "callsets", page: 0, pageSize: callsetPageSize },
            ],
          }));
        }

        const alleleResponses = await Promise.all(
          alleleReqs.map((r) => r.promise),
        );

        const fetchVariantRequests = alleleResponses.flatMap((resp, i) => {
          const variantDbIds = resp?.result?.variantDbIds;
          if (!Array.isArray(variantDbIds) || variantDbIds.length === 0)
            return [];
          const { api, idx } = alleleReqs[i];
          return [
            api.fetchVariants({
              selectedGigwaServer: selectedGigwaServers?.[idx],
              variantDbIds,
            }),
          ];
        });

        const variantResponses = await Promise.all(fetchVariantRequests);

        if (pagesPerServer.length === 0) {
          const newPagesPerServer = alleleResponses.map((server) => {
            const varPag = server?.result?.pagination?.find(
              (p) => (p.dimension || "").toUpperCase() === "VARIANTS",
            );
            const count = varPag?.totalCount ?? 0;
            const fullPages = Math.floor(count / variantPageSize);
            const remainder = count % variantPageSize;
            const pagesArr = Array(fullPages).fill(variantPageSize);
            if (remainder > 0) pagesArr.push(remainder);
            return pagesArr;
          });

          dispatch(genotypeActions.setPagesPerServer(newPagesPerServer));

          const globalPageCount = Math.max(
            ...newPagesPerServer.map((arr) => arr.length),
            0,
          );
          const newGlobalPageLengths = Array.from(
            { length: globalPageCount },
            (_, i) =>
              newPagesPerServer.reduce((sum, pagesArr) => {
                if (pagesArr[i] !== undefined) {
                  return (
                    sum +
                    (i < pagesArr.length - 1 ? variantPageSize : pagesArr[i])
                  );
                }
                return sum;
              }, 0),
          );

          dispatch(genotypeActions.setPageLengths(newGlobalPageLengths));
        }

        dispatch((dispatch, getState) => {
          const state = getState();
          const prevPageLengths = state.genotype.pageLengths || [];
          const totalVariantsOnThisPage = variantResponses.reduce(
            (sum, r) => sum + (r?.result?.data?.length ?? 0),
            0,
          );
          const updated = [...prevPageLengths];
          updated[page - 1] = totalVariantsOnThisPage;
          dispatch(genotypeActions.setPageLengths(updated));
        });

        dispatch(genotypeActions.setGenomData(variantResponses));
        dispatch(genotypeActions.setAlleleData(alleleResponses));
      } else if (selectedOption === "Germinate") {
        alert("Germinate flow not moved in this refactor yet.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred: " + (error?.message || "Unknown error"));
    } finally {
      setIsGenomDataLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      if (checkedAccessions.length === 0) {
        alert("Please select accessions from the passport table.");
        return;
      }

      // STEP 0 -> 1: lookup
      if (uiStep === 0) {
        setIsLookupLoading(true);

        await fetchGigwaServers(checkedAccessions);

        const hasServers =
          (selectedGigwaServers && selectedGigwaServers.length > 0) ||
          Object.keys(genolinkGigwaApisRef.current).length > 0;

        if (!hasServers) {
          alert("No valid Gigwa servers available.");
          setIsLookupLoading(false);
          return;
        }

        setUiStep(1);
        setIsLookupLoading(false);
        return;
      }

      // STEP 1 -> 2: verify + summary
      if (uiStep === 1) {
        setIsVerifyLoading(true);

        const servers =
          selectedGigwaServers.length > 0
            ? selectedGigwaServers
            : Object.keys(genolinkGigwaApisRef.current);

        if (
          servers.length === 0 ||
          Object.keys(genolinkGigwaApisRef.current).length === 0
        ) {
          alert("No valid Gigwa servers available.");
          setIsVerifyLoading(false);
          return;
        }

        if (REQUIRE_GIGWA_CREDENTIALS) {
          const missingCreds = servers.some((_, i) => {
            const u = String(usernames[i] ?? "").trim();
            const p = String(passwords[i] ?? "").trim();
            return !u || !p;
          });
          if (missingCreds) {
            alert("Please enter both username and password for all servers.");
            setIsVerifyLoading(false);
            return;
          }
        } else {
          const missingPrivCreds = servers.some((_, i) => {
            const isPrivate = accessMode[i] === "private";
            const u = String(usernames[i] ?? "").trim();
            const p = String(passwords[i] ?? "").trim();
            return isPrivate && (!u || !p);
          });
          if (missingPrivCreds) {
            alert(
              "Please enter both username and password for all private servers.",
            );
            setIsVerifyLoading(false);
            return;
          }
        }

        const authResults = await Promise.all(
          servers.map(async (server, index) => {
            const username = REQUIRE_GIGWA_CREDENTIALS
              ? usernames[index] || ""
              : accessMode[index] === "private"
                ? usernames[index] || ""
                : "";
            const password = REQUIRE_GIGWA_CREDENTIALS
              ? passwords[index] || ""
              : accessMode[index] === "private"
                ? passwords[index] || ""
                : "";

            try {
              await genolinkGigwaApisRef.current[server].getGigwaToken(
                server,
                username,
                password,
              );
              return { server, success: true };
            } catch (error) {
              const status = error?.response?.status;
              let message = "Unknown error";
              if (status === 401 || status === 403)
                message = "Invalid username or password.";
              else if (error?.message) message = error.message;
              return { server, success: false, message };
            }
          }),
        );

        const failed = authResults.filter((r) => !r.success);
        if (failed.length > 0) {
          alert(
            failed
              .map(
                (f) =>
                  `Authentication failed for ${f.server?.replace(/^https?:\/\//, "")}: ${f.message}`,
              )
              .join("\n"),
          );
          setIsVerifyLoading(false);
          return;
        }

        const Accessions = checkedResults?.map((item) => item.accessionNumber);
        const fetchRequests = Object.values(genolinkGigwaApisRef.current).map(
          (api, index) =>
            api.searchSamplesInDatasets(
              servers[index],
              Accessions,
              checkedAccessionNamesObject,
            ),
        );

        const responses = await Promise.all(fetchRequests);

        let combinedResults = {
          responseData: [],
          datasetNames: [],
          numberOfGenesysAccessions: [],
          numberOfPresentAccessions: [],
          numberOfMappedAccessions: [],
          accessionPlusAccessionName: [],
        };

        responses.forEach(
          ({
            response,
            datasetNames,
            numberOfGenesysAccessions,
            numberOfPresentAccessions,
            numberOfMappedAccessions,
            accessionPlusAccessionName,
          }) => {
            combinedResults.responseData.push(response.result.data);
            combinedResults.datasetNames.push(datasetNames);
            combinedResults.numberOfGenesysAccessions.push(
              numberOfGenesysAccessions,
            );
            combinedResults.numberOfPresentAccessions.push(
              numberOfPresentAccessions,
            );
            combinedResults.numberOfMappedAccessions.push(
              numberOfMappedAccessions,
            );
            combinedResults.accessionPlusAccessionName.push(
              accessionPlusAccessionName,
            );
          },
        );

        setSearchSamplesInDatasetsResult(responses);

        const totalNumberOfGenesysAccessions =
          combinedResults.numberOfGenesysAccessions[0];
        dispatch(
          genotypeActions.setNumberOfGenesysAccessions(
            totalNumberOfGenesysAccessions,
          ),
        );
        dispatch(
          genotypeActions.setNumberOfPresentAccessions(
            combinedResults.numberOfPresentAccessions,
          ),
        );
        dispatch(
          genotypeActions.setNumberOfMappedAccessions(
            combinedResults.numberOfMappedAccessions,
          ),
        );

        if (combinedResults.responseData.length === 0) {
          alert("No genotype data found across all Gigwa servers.");
          setIsVerifyLoading(false);
          return;
        }

        const uniqueSampleNames = combinedResults.responseData.map(
          (apiResponse) =>
            Array.from(
              new Set(
                apiResponse.map((sample) => sample.germplasmDbId.split("§")[1]),
              ),
            ),
        );

        dispatch(genotypeActions.setDatasets(combinedResults.datasetNames));
        dispatch(
          genotypeActions.setSampleDetails(combinedResults.responseData),
        );
        dispatch(genotypeActions.setSampleNames(uniqueSampleNames));

        setShowDatasetSelector(true);
        setUiStep(2);
        setIsVerifyLoading(false);
        return;
      }

      // STEP 2: execute genotype search
      if (uiStep === 2) {
        const servers =
          selectedGigwaServers.length > 0
            ? selectedGigwaServers
            : Object.keys(genolinkGigwaApisRef.current);

        const missingDatasetSelection = servers.some((_, index) => {
          return (
            !datasets[index] ||
            datasets[index].length === 0 ||
            !selectedDataset[index] ||
            selectedDataset[index].length === 0
          );
        });

        if (missingDatasetSelection) {
          alert("Please select a dataset for each server before continuing.");
          return;
        }

        if (!isGenomeSearchSubmit) {
          dispatch(genotypeActions.setIsGenomeSearchSubmit(true));
        }

        await fetchData(1);
        dispatch(genotypeActions.setGenotypeCurrentPage(1));
        return;
      }
    } catch (error) {
      setIsLookupLoading(false);
      setIsVerifyLoading(false);

      let message = "An unexpected error occurred.";
      if (axios.isAxiosError(error)) {
        const status = error.response ? error.response.status : null;
        switch (status) {
          case 401:
            message = "Authentication failed: Incorrect username or password.";
            break;
          case 403:
            message =
              "Access denied: You do not have permission to access these resources.";
            break;
          case 404:
            message = "No genotype data found in the Database!";
            break;
          default:
            message =
              "An error occurred: " + (error.message || "Unknown error");
            break;
        }
      }
      alert(message);
    }
  };

  const CHROMConverter = (CHROM) => {
    const mapping = {
      1: "chr1A",
      2: "chr1B",
      3: "chr1D",
      4: "chr2A",
      5: "chr2B",
      6: "chr2D",
      7: "chr3A",
      8: "chr3B",
      9: "chr3D",
      10: "chr4A",
      11: "chr4B",
      12: "chr4D",
      13: "chr5A",
      14: "chr5B",
      15: "chr5D",
      16: "chr6A",
      17: "chr6B",
      18: "chr6D",
      19: "chr7A",
      20: "chr7B",
      21: "chr7D",
    };
    return mapping[CHROM] || null;
  };

  // ---------- UI
  return (
    <div>
      <div className={styles.searchContainer}>
        {platforms.length > 1 && (
          <select
            className={styles.platformSelector}
            onChange={handleOptionChange}
            value={selectedOption}
          >
            {platforms.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {uiStep === 0 && (
          <>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSearch}
              disabled={isLookupLoading}
            >
              {isLookupLoading ? "Looking up..." : "Lookup Servers"}
            </button>
            {isLookupLoading && <LoadingComponent />}
          </>
        )}

        {uiStep === 1 && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSearch}
              disabled={isVerifyLoading}
            >
              {isVerifyLoading ? "Verifying..." : "Verify Access"}
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={handleReset}
              disabled={isVerifyLoading || isLookupLoading}
            >
              Reset
            </button>
            {isVerifyLoading && <LoadingComponent />}
          </div>
        )}

        {uiStep === 2 && (
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSearch}
            >
              Search Genotype
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {isGenomDataLoading && <LoadingComponent />}

      {/* STEP 1: credentials */}
      {uiStep === 1 && (
        <div>
          {selectedGigwaServers.length > 0 && <h4>Server found:</h4>}
          {selectedGigwaServers.map((server, index) => (
            <div key={server} style={{ marginBottom: "15px" }}>
              <h5>{server?.replace(/^https?:\/\//, "")}</h5>

              {REQUIRE_GIGWA_CREDENTIALS ? (
                <>
                  <div className={styles.inputGroup}>
                    <span className={styles.inputGroupAddon}>
                      <FontAwesomeIcon icon={faUser} />
                    </span>
                    <input
                      type="text"
                      className={styles.formControl}
                      placeholder="Username"
                      value={usernames[index] || ""}
                      onChange={(e) =>
                        handleUsernameChange(index, e.target.value)
                      }
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <span className={styles.inputGroupAddon}>
                      <FontAwesomeIcon icon={faLock} />
                    </span>
                    <input
                      type="password"
                      className={styles.formControl}
                      placeholder="Password"
                      value={passwords[index] || ""}
                      onChange={(e) =>
                        handlePasswordChange(index, e.target.value)
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.accessModeToggle}>
                    <label>
                      <input
                        type="radio"
                        value="private"
                        checked={accessMode[index] === "private"}
                        onChange={(e) => handleAccessModeChange(index, e)}
                      />
                      Private
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="public"
                        checked={accessMode[index] === "public"}
                        onChange={(e) => handleAccessModeChange(index, e)}
                      />
                      Public
                    </label>
                  </div>

                  {accessMode[index] === "private" && (
                    <>
                      <div className={styles.inputGroup}>
                        <span className={styles.inputGroupAddon}>
                          <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input
                          type="text"
                          className={styles.formControl}
                          placeholder="Username"
                          value={usernames[index] || ""}
                          onChange={(e) =>
                            handleUsernameChange(index, e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <span className={styles.inputGroupAddon}>
                          <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input
                          type="password"
                          className={styles.formControl}
                          placeholder="Password"
                          value={passwords[index] || ""}
                          onChange={(e) =>
                            handlePasswordChange(index, e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* STEP 2: summary + dataset select + filters */}
      {selectedOption === "Gigwa" && uiStep === 2 && (
        <div>
          <h3>Search Summary</h3>

          {selectedGigwaServers.map((server, index) => (
            <div key={server} className={styles.serverSummaryBox}>
              <h4>Server: {server?.replace(/^https?:\/\//, "")}</h4>
              <h5>
                {numberOfMappedAccessions?.[index]} of{" "}
                {numberOfGenesysAccessions} accessions have genotypeId in
                Genesys.
              </h5>
              <h5>
                {numberOfPresentAccessions?.[index]} of{" "}
                {numberOfGenesysAccessions} accessions have genotype-data in
                Gigwa.
              </h5>
            </div>
          ))}

          {!copied ? (
            <button
              type="button"
              className={styles.copySampleButton}
              onClick={handleCopySampleNames}
            >
              <FontAwesomeIcon icon={faCopy} className={styles.copyIcon} /> Copy
              Sample-Names
            </button>
          ) : (
            <span className={styles.copySuccessText}>Copied!</span>
          )}

          <br />

          <DatasetSelector
            datasets={datasets}
            selectedDataset={selectedDataset}
            selectedGigwaServers={selectedGigwaServers}
            onChangeDataset={handleDatasetDetails}
          />
        </div>
      )}

      {/* Filter type selector */}
      {uiStep === 2 && (
        <select
          value={searchType || ""}
          onChange={(e) => handleSearchTypeChange(e.target.value)}
          disabled={selectedGigwaServers.some(
            (_, index) =>
              !datasets?.[index] ||
              datasets[index].length === 0 ||
              !selectedDataset?.[index] ||
              selectedDataset[index].length === 0,
          )}
          className={styles.filterTypeSelect}
        >
          <option value="" disabled>
            Filter Type
          </option>
          <option value="PositionRange">PositionRange</option>
          <option value="VariantIDs">VariantIDs</option>
        </select>
      )}

      {/* Filters */}
      {showDatasetSelector &&
        (searchType === "PositionRange" ? (
          <>
            <PositionRangeFilter
              posStart={posStart}
              setPosStart={setPosStart}
              posEnd={posEnd}
              setPosEnd={setPosEnd}
            />
            <div>
              <select
                value={selectedGroups || ""}
                onChange={(e) => handleInputChange(e.target.value)}
              >
                <option value="" disabled>
                  Select a chromosome
                </option>
                {linkageGroups.map((group) => (
                  <option key={group} value={group}>
                    {selectedOption === "Germinate"
                      ? CHROMConverter(group)
                      : group}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : searchType === "VariantIDs" ? (
          <VariantListFilter />
        ) : null)}
    </div>
  );
};

export default GigwaWorkflowController;
