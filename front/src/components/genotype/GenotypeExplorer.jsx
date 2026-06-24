import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  setPlatform,
  setResetTrigger,
  setWildSearchValue,
} from "../../redux/passport/passportActions";
import * as genotypeActions from "../../redux/genotype/genotypeActions";
import GenotypeSearchResultsTable from "./GenotypeSearchResultsTable";
import LoadingComponent from "../LoadingComponent";
import { linkageGroupFilter } from "./filters/LinkageGroupFilter";
import PositionRangeFilter from "./filters/PositionRangeFilter";
import VariantListFilter from "./filters/VariantListFilter";

import { faUser, faLock, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import GenolinkGigwaApi from "../../api/GenolinkGigwaApi";
import GenolinkGerminateApi from "../../api/GenolinkGerminateApi";
import { genesysApi } from "../../pages/Home";
import { platforms, REQUIRE_GIGWA_CREDENTIALS } from "../../config/apiConfig";
import styles from "./GenotypeExplorer.module.css";
import SampleSourceTable from "./SampleSourceTable";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

const createServerState = (server, lookupResponse = {}) => ({
  server,

  datasets: lookupResponse.datasetNames || [],
  callSetDetails: lookupResponse.combinedResult || [],
  germplasms: lookupResponse.uniqueGermplasmPresence || [],
  accessionPlusAccessionNames: lookupResponse.accessionPlusAccessionName || [],

  numberOfGenesysAccessions: lookupResponse.numberOfGenesysAccessions || 0,
  numberOfPresentAccessions: lookupResponse.numberOfPresentAccessions || 0,
  numberOfMappedAccessions: lookupResponse.numberOfMappedAccessions || 0,

  /*
   * searchSamplesInDatasets was called separately for this server,
   * so this response contains only this server's samples.
   */
  sampleSourceData: lookupResponse.combinedResult || [],

  selectedDataset: "",
  selectedVariantSetDbId: [],
  selectedStudyDbId: [],
  selectedCallSetDetails: [],
  callSetDbIds: [],
  completeNames: [],

  linkageGroups: [],
  selectedGroup: "",
  posStart: "",
  posEnd: "",

  searchType: "",
  variantListInput: "",
  variantList: [],

  genomData: null,
  alleleData: null,
  currentPage: 1,

  isSearching: false,
  isExporting: false,
  copied: false,
});

const GenotypeExplorer = () => {
  const [combineServerResults, setCombineServerResults] = useState(false);

  const [serverStates, setServerStates] = useState({});
  const [genolinkGerminateApi, setGenolinkGerminateApi] = useState(
    new GenolinkGerminateApi(),
  );
  const [copied, setCopied] = useState(false);
  const [posStart, setPosStart] = useState("");
  const [posEnd, setPosEnd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenomDataLoading, setIsGenomDataLoading] = useState(false);
  const [isExportGenomDataLoading, setIsExportGenomDataLoading] =
    useState(false);
  const [usernames, setUsernames] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [accessMode, setAccessMode] = useState([]);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [selectedGigwaServers, setSelectedGigwaServers] = useState([]);
  const [accessionPlusAccessionNames, setAccessionPlusAccessionNames] =
    useState([]);
  const [exportServer, setExportServer] = useState("");
  const [variantPageSize, setVariantPageSize] = useState(100);
  const [callsetPageSize, setCallsetPageSize] = useState(500);

  const selectedOption = useSelector((state) => state.genotype.selectedOption);
  const genomData = useSelector((state) => state.genotype.genomData);
  const alleleData = useSelector((state) => state.genotype.alleleData);
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
  const callSetDetails = useSelector((state) => state.genotype.callSetDetails);
  const callSetDbIds = useSelector((state) => state.genotype.callSetDbIds);
  const germplasms = useSelector((state) => state.genotype.germplasms);
  const selectedCallSetDetails = useSelector(
    (state) => state.genotype.selectedCallSetDetails,
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

  const sampleSourceData = useSelector(
    (state) => state.genotype.sampleSourceData,
  );

  const genolinkGigwaApisRef = useRef({});
  const checkedAccessions = Object.keys(checkedAccessionsObject);
  const checkedResults = useMemo(() => {
    return Array.isArray(searchResults)
      ? searchResults.filter((item) =>
          checkedAccessions.includes(item.accessionNumber),
        )
      : [];
  }, [searchResults, checkedAccessions]);
  const dispatch = useDispatch();
  useEffect(() => {
    if (
      selectedOption === "Gigwa" &&
      isGenomeSearchSubmit &&
      combineServerResults
    ) {
      fetchData(genotypeCurrentPage);
    }
  }, [
    genotypeCurrentPage,
    selectedOption,
    isGenomeSearchSubmit,
    combineServerResults,
  ]);

  useEffect(() => {
    dispatch(genotypeActions.setGenomData([]));
  }, [selectedOption]);

  useEffect(() => {
    if (selectedGigwaServers.length > 0) {
      const defaultAccessModes = selectedGigwaServers.map(() => "public");
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
  }, [resetTrigger]);

  useEffect(() => {
    if (!combineServerResults) {
      return;
    }
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
    genomData,
    selectedOption,
    selectedGigwaServers,
    selectedStudyDbId,
    checkedAccessionsObject,
  ]);
  const handleInputChange = (groupName) => {
    dispatch(genotypeActions.setSelectedGroups(groupName));
  };

  const handleUsernameChange = (index, value) => {
    const updatedUsernames = [...usernames];
    updatedUsernames[index] = value;
    setUsernames(updatedUsernames);
  };

  const handlePasswordChange = (index, value) => {
    const updatedPasswords = [...passwords];
    updatedPasswords[index] = value;
    setPasswords(updatedPasswords);
  };

  const handleAccessModeChange = (index, event) => {
    const updatedAccessMode = [...accessMode];
    updatedAccessMode[index] = event.target.value;
    setAccessMode(updatedAccessMode);
  };

  useEffect(() => {
    if (checkedResults.length > 0) {
      const selectedAccessions = checkedResults
        .map((item) => item.accessionNumber)
        .filter(Boolean);

      const matchedServers =
        genesysApi.getServerUrlsForAccessions(selectedAccessions);

      if (
        JSON.stringify(selectedGigwaServers) !== JSON.stringify(matchedServers)
      ) {
        setSelectedGigwaServers(matchedServers);
      }

      if (matchedServers.length > 0) {
        const newInstances = {};

        for (const server of matchedServers) {
          if (
            genolinkGigwaApisRef.current[server] &&
            genolinkGigwaApisRef.current[server].gigwaSessionId
          ) {
            newInstances[server] = genolinkGigwaApisRef.current[server];
          } else {
            newInstances[server] = new GenolinkGigwaApi(server);
          }
        }

        if (
          JSON.stringify(genolinkGigwaApisRef.current) !==
          JSON.stringify(newInstances)
        ) {
          genolinkGigwaApisRef.current = newInstances;
        }
      } else if (Object.keys(genolinkGigwaApisRef.current).length !== 0) {
        genolinkGigwaApisRef.current = {};
      }
    } else {
      if (Object.keys(genolinkGigwaApisRef.current).length !== 0) {
        genolinkGigwaApisRef.current = {};
      }

      if (selectedGigwaServers.length !== 0) {
        setSelectedGigwaServers([]);
      }
    }
  }, [checkedResults, selectedGigwaServers]);

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

      const selectedCallSets = callSetDetails.map((server, gIdx) =>
        server.filter((callset) => {
          const sel = updatedSelection[gIdx]?.[0];
          if (!sel) return false;
          return sel === callset.variantSetDbIds[0];
        }),
      );

      const selectedCallSetDbIdsLocal = selectedCallSets.map((server) =>
        server.map((callset) => callset.callSetDbId),
      );

      const selectedAccessionPlusAccessionName = selectedCallSets.map(
        (matchedCallsets, gIdx) => {
          if (!matchedCallsets?.length) return [];

          const ids = [
            ...new Set(
              matchedCallsets.map((s) => s.germplasmDbId.split("§")[1]),
            ),
          ];

          const namesForServer = accessionPlusAccessionNames[gIdx] ?? [];
          return namesForServer.filter((item) =>
            ids.some((gid) => item.includes(gid)),
          );
        },
      );

      dispatch(genotypeActions.setSelectedCallSetDetails(selectedCallSets));

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
      dispatch(genotypeActions.setSelectedCallSetDetails(selectedCallSets));
      dispatch(genotypeActions.setSelectedStudyDbId(selectedStudyDbIdLocal));
      dispatch(genotypeActions.setCallSetDbIds(selectedCallSetDbIdsLocal));
      dispatch(
        genotypeActions.setCompleteNames(selectedAccessionPlusAccessionName),
      );
    },
    [
      dispatch,
      datasets,
      callSetDetails,
      selectedDataset,
      accessionPlusAccessionNames,
    ],
  );
  const handleExportVCF = async () => {
    setIsExportGenomDataLoading(true);
    if (!exportServer) {
      alert("Please select a server for export.");
      setIsExportGenomDataLoading(false);
      return;
    }
    const apiInstance = genolinkGigwaApisRef.current[exportServer];
    if (!apiInstance) {
      alert("API instance for the selected server was not found.");
      setIsExportGenomDataLoading(false);
      return;
    }

    const exportIndex = selectedGigwaServers.findIndex(
      (srv) => srv === exportServer,
    );
    const exportSamples =
      exportIndex !== -1 && selectedCallSetDetails[exportIndex]
        ? selectedCallSetDetails[exportIndex]
        : [];
    const body = {
      variantList: variantList,
      selectedCallSetDetails: exportSamples,
      variantPage: genotypeCurrentPage,
      linkagegroups: selectedGroups ? selectedGroups : "",
      start: posStart || -1,
      end: posEnd || -1,
    };

    try {
      await apiInstance.exportGigwaVCF(body);
      setIsExportGenomDataLoading(false);
    } catch (error) {
      setIsExportGenomDataLoading(false);
      console.error("Export failed:", error);
    }
  };

  const handleSearch = async () => {
    try {
      if (checkedAccessions.length === 0) {
        alert("Please select accessions from the passport table.");
        return;
      }
      if (Object.keys(genolinkGigwaApisRef.current).length === 0) {
        alert("No valid Gigwa servers available.");
        return;
      }

      if (selectedOption === "Gigwa") {
        const hasMissingCredentials = selectedGigwaServers.some(
          (server, index) => {
            return (
              accessMode[index] === "private" &&
              (!usernames[index]?.trim() || !passwords[index]?.trim())
            );
          },
        );

        if (hasMissingCredentials) {
          alert(
            "Please enter both username and password for all private servers.",
          );
          return;
        }

        if (isGenomeSearchSubmit) {
          const missingDatasetSelection = selectedGigwaServers.some(
            (_, index) => {
              return (
                !datasets[index] ||
                datasets[index].length === 0 ||
                !selectedDataset[index] ||
                selectedDataset[index].length === 0
              );
            },
          );
          if (missingDatasetSelection) {
            alert("Please select a dataset for each server before continuing.");
            return;
          }
        }

        if (!isGenomeSearchSubmit) {
          setIsLoading(true);
          const authResults = await Promise.all(
            selectedGigwaServers.map(async (server, index) => {
              const username =
                accessMode[index] === "private" ? usernames[index] : "";
              const password =
                accessMode[index] === "private" ? passwords[index] : "";

              try {
                await genolinkGigwaApisRef.current[server].getGigwaToken(
                  username,
                  password,
                );
                return { server, success: true };
              } catch (error) {
                const status = error.response?.status;
                let message = "Unknown error";
                if (status === 401 || status === 403) {
                  message = "Invalid username or password.";
                } else if (error.message) {
                  message = error.message;
                }
                return { server, success: false, message };
              }
            }),
          );

          const failed = authResults.filter((res) => !res.success);
          if (failed.length > 0) {
            const messages = failed
              .map(
                (f) =>
                  `Authentication failed for ${f.server?.replace(
                    /^https?:\/\//,
                    "",
                  )}: ${f.message}`,
              )
              .join("\n");

            alert(messages);
            setIsLoading(false);
            return;
          }

          const accessions = checkedResults?.map(
            (item) => item.accessionNumber,
          );

          const accessionDoiPairs =
            checkedResults?.map((item) => ({
              accessionNumber: item.accessionNumber,
              doi: item.doi,
            })) || [];

          const fetchRequests = selectedGigwaServers.map((server) =>
            genolinkGigwaApisRef.current[server].searchSamplesInDatasets({
              accessions,
              accessionNames: checkedAccessionNamesObject,
              accessionDoiPairs,
            }),
          );

          const responses = await Promise.all(fetchRequests);

          const nextServerStates = {};

          responses.forEach((response, index) => {
            const server = selectedGigwaServers[index];

            nextServerStates[server] = createServerState(server, response);
          });

          setServerStates(nextServerStates);

          let combinedResults = {
            combinedResult: [],
            uniqueGermplasmPresence: [],
            datasetNames: [],
            numberOfGenesysAccessions: [],
            numberOfPresentAccessions: [],
            numberOfMappedAccessions: [],
            accessionPlusAccessionName: [],
          };

          responses.forEach(
            ({
              combinedResult,
              uniqueGermplasmPresence,
              datasetNames,
              numberOfGenesysAccessions,
              numberOfPresentAccessions,
              numberOfMappedAccessions,
              accessionPlusAccessionName,
            }) => {
              combinedResults.combinedResult.push(combinedResult);
              combinedResults.uniqueGermplasmPresence.push(
                uniqueGermplasmPresence,
              );
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

          setAccessionPlusAccessionNames(
            combinedResults.accessionPlusAccessionName,
          );

          const noSamplesFound = responses.every(
            (response) =>
              !Array.isArray(response?.combinedResult) ||
              response.combinedResult.length === 0,
          );

          if (noSamplesFound) {
            alert("No genotype data found across all Gigwa servers.");
            setIsLoading(false);
            return;
          }

          dispatch(genotypeActions.setDatasets(combinedResults.datasetNames));

          dispatch(
            genotypeActions.setCallSetDetails(combinedResults.combinedResult),
          );
          dispatch(
            genotypeActions.setGermplasms(
              combinedResults.uniqueGermplasmPresence,
            ),
          );

          const flattenedSampleSourceData =
            combinedResults.combinedResult.flat();
          dispatch(
            genotypeActions.setSampleSourceData(flattenedSampleSourceData),
          );
          dispatch(genotypeActions.setIsGenomeSearchSubmit(true));
          setIsLoading(false);
          setShowDatasetSelector(true);
        }

        if (combineServerResults && selectedCallSetDetails.length > 0) {
          await fetchData(1);
          dispatch(genotypeActions.setGenotypeCurrentPage(1));
        }
      } else if (selectedOption === "Germinate") {
        if (isGenomeSearchSubmit) {
          await fetchData(1);
        } else {
          dispatch(genotypeActions.setIsGenomeSearchSubmit(true));
        }
        setShowPrivacyRadio(false);
      }
    } catch (error) {
      console.error(error);
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
        // Helper: filter out servers that don’t have this page, then build paired requests
        const buildAlleleReqs = (buildBody) => {
          return Object.entries(genolinkGigwaApisRef.current)
            .map(([server, api], originalIndex) => ({
              server,
              api,
              idx: originalIndex,
            }))
            .filter(({ idx }) => {
              const pages = pagesPerServer?.[idx];
              return !(Array.isArray(pages) && page > pages.length);
            })
            .map(({ api, idx }) => ({
              api,
              idx,
              promise: api.fetchAlleles(buildBody(idx)),
            }));
        };

        let alleleReqs = [];
        if (posStart && posEnd && selectedGroups) {
          alleleReqs = buildAlleleReqs((index) => ({
            callSetDbIds: callSetDbIds[index],
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
        } else if (posStart && !posEnd && selectedGroups) {
          alleleReqs = buildAlleleReqs((index) => ({
            callSetDbIds: callSetDbIds[index],
            variantSetDbIds: selectedVariantSetDbId[index],
            positionRanges: selectedGroups
              ? [`${selectedGroups}:${posStart}-`]
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
        } else if (!posStart && posEnd && selectedGroups) {
          alleleReqs = buildAlleleReqs((index) => ({
            callSetDbIds: callSetDbIds[index],
            variantSetDbIds: selectedVariantSetDbId[index],
            positionRanges: selectedGroups
              ? [`${selectedGroups}:-${posEnd}`]
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
            callSetDbIds: callSetDbIds[index],
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
        } else if ((posStart || posEnd) && !selectedGroups) {
          alert("Please select the Chromosome");
          return;
        } else if (variantList.length > 0) {
          alleleReqs = buildAlleleReqs((index) => ({
            callSetDbIds: callSetDbIds[index],
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
            callSetDbIds: callSetDbIds[index],
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

        // Run allele requests
        const alleleResponses = await Promise.all(
          alleleReqs.map((r) => r.promise),
        );

        // Build fetchVariants from the paired (api, idx) metadata; skip empties
        const fetchVariantRequests = alleleResponses.flatMap((resp, i) => {
          const variantDbIds = resp?.result?.variantDbIds;
          if (!Array.isArray(variantDbIds) || variantDbIds.length === 0)
            return [];
          const { api, idx } = alleleReqs[i];
          return [
            api.fetchVariants({
              variantDbIds,
            }),
          ];
        });

        const variantResponses = await Promise.all(fetchVariantRequests);

        // Initialize pagesPerServer once (typically on first call)
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

        // Update pageLengths for this page from real variant responses
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
        const Accessions = checkedResults?.map((item) => item.accessionNumber);
        const responses = await Promise.all(
          Accessions.map((accession) =>
            genolinkGerminateApi.fetchCallsetDataForAccession(
              username,
              password,
              accession,
              selectedGroups,
              posStart,
              posEnd,
            ),
          ),
        );
        const allGenomicData = responses.map((response) => response.data);
        dispatch(genotypeActions.setGenomData(allGenomicData));
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred: " + error.message);
    } finally {
      setIsGenomDataLoading(false);
    }
  };

  const handleReset = () => {
    setShowDatasetSelector(false);
    setPosStart("");
    setPosEnd("");
    dispatch(genotypeActions.resetGenotype());
    dispatch(setWildSearchValue(""));
    setSearchType("");
    setSelectedGigwaServers([]);
    genolinkGigwaApisRef.current = {};
    dispatch(genotypeActions.resetGenotype());
    dispatch(genotypeActions.setSampleSourceData([]));
    setServerStates({});
    setCombineServerResults(false);
  };

  const handleOptionChange = (event) => {
    dispatch(genotypeActions.setIsGenomeSearchSubmit(false));
    const newSelectedOption = event.target.value;
    dispatch(genotypeActions.setSelectedOption(newSelectedOption));
    dispatch(setPlatform(newSelectedOption));
    setShowPrivacyRadio(true);
    setServerStates({});
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

  const handleCopyGermplasms = () => {
    const flatSamples = germplasms.flat();
    navigator.clipboard
      .writeText(flatSamples.join("\n"))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Failed to copy germplasms: ", err));
  };

  const updateServerState = useCallback((server, update) => {
    setServerStates((previousStates) => {
      const currentState = previousStates[server];

      if (!currentState) {
        return previousStates;
      }

      const changes =
        typeof update === "function" ? update(currentState) : update;

      return {
        ...previousStates,
        [server]: {
          ...currentState,
          ...changes,
        },
      };
    });
  }, []);

  const handleServerDatasetDetails = async (server, selectedValue) => {
    const currentState = serverStates[server];
    const apiInstance = genolinkGigwaApisRef.current[server];

    if (!currentState || !apiInstance) {
      return;
    }

    const selectedCallSets = currentState.callSetDetails.filter(
      (callSet) => callSet.variantSetDbIds?.[0] === selectedValue,
    );

    const callSetDbIds = selectedCallSets
      .map((callSet) => callSet.callSetDbId)
      .filter(Boolean);

    const selectedStudyDbId = [selectedValue.split("§").slice(0, 2).join("§")];

    const selectedVariantSetDbId = [selectedValue];

    const selectedGenotypeIds = new Set(
      selectedCallSets
        .map((callSet) => callSet.germplasmDbId?.split("§")?.[1])
        .filter(Boolean),
    );

    const completeNames = currentState.accessionPlusAccessionNames.filter(
      (item) =>
        Array.from(selectedGenotypeIds).some((genotypeId) =>
          item.includes(genotypeId),
        ),
    );

    updateServerState(server, {
      selectedDataset: selectedValue,
      selectedVariantSetDbId,
      selectedStudyDbId,
      selectedCallSetDetails: selectedCallSets,
      callSetDbIds,
      completeNames,

      linkageGroups: [],
      selectedGroup: "",
      posStart: "",
      posEnd: "",
      searchType: "",
      variantListInput: "",
      variantList: [],

      genomData: null,
      alleleData: null,
      currentPage: 1,
    });

    try {
      const groups = await linkageGroupFilter({
        selectedStudyDbId,
        genolinkGigwaApi: apiInstance,
        genolinkGerminateApi,
        platform: "Gigwa",
        checkedAccessionsObject,
      });

      updateServerState(server, (latestState) => {
        /*
         * Do not apply linkage groups from an earlier request if
         * the user selected another dataset while it was loading.
         */
        if (latestState.selectedDataset !== selectedValue) {
          return {};
        }

        return {
          linkageGroups: Array.from(
            new Set(Array.isArray(groups) ? groups : []),
          ),
        };
      });
    } catch (error) {
      console.error(`Failed to fetch linkage groups for ${server}:`, error);

      alert(
        `Could not load chromosomes for ${server.replace(/^https?:\/\//, "")}.`,
      );
    }
  };

  const handleServerSearchTypeChange = (server, newType) => {
    updateServerState(server, (currentState) => {
      if (newType === "PositionRange") {
        return {
          searchType: newType,
          variantListInput: "",
          variantList: [],
          genomData: null,
          alleleData: null,
          currentPage: 1,
        };
      }

      if (newType === "VariantIDs") {
        return {
          searchType: newType,
          selectedGroup: "",
          posStart: "",
          posEnd: "",
          genomData: null,
          alleleData: null,
          currentPage: 1,
        };
      }

      return {
        searchType: newType,
        genomData: null,
        alleleData: null,
        currentPage: 1,
      };
    });
  };

  const buildServerAlleleBody = (serverState, page) => {
    const body = {
      callSetDbIds: serverState.callSetDbIds,
      variantSetDbIds: serverState.selectedVariantSetDbId,
      dataMatrixAbbreviations: ["GT"],
      pagination: [
        {
          dimension: "variants",
          page: page - 1,
          pageSize: variantPageSize,
        },
        {
          dimension: "callsets",
          page: 0,
          pageSize: callsetPageSize,
        },
      ],
    };

    if (serverState.searchType === "PositionRange") {
      const {
        selectedGroup,
        posStart: serverPosStart,
        posEnd: serverPosEnd,
      } = serverState;

      if (selectedGroup) {
        if (serverPosStart && serverPosEnd) {
          body.positionRanges = [
            `${selectedGroup}:${serverPosStart}-${serverPosEnd}`,
          ];
        } else if (serverPosStart) {
          body.positionRanges = [`${selectedGroup}:${serverPosStart}-`];
        } else if (serverPosEnd) {
          body.positionRanges = [`${selectedGroup}:-${serverPosEnd}`];
        } else {
          body.positionRanges = [selectedGroup];
        }
      }
    }

    if (
      serverState.searchType === "VariantIDs" &&
      serverState.variantList.length > 0
    ) {
      const programId =
        serverState.selectedVariantSetDbId?.[0]?.split("§")?.[0];

      body.variantDbIds = serverState.variantList.map(
        (variantId) => `${programId}§${variantId}`,
      );
    }

    return body;
  };

  const fetchServerData = async (server, page = 1) => {
    const serverState = serverStates[server];
    const apiInstance = genolinkGigwaApisRef.current[server];

    if (!serverState || !apiInstance) {
      alert("The selected Gigwa server is not available.");
      return;
    }

    if (!serverState.selectedDataset) {
      alert(
        `Please select a dataset for ${server.replace(/^https?:\/\//, "")}.`,
      );
      return;
    }

    if (
      serverState.searchType === "PositionRange" &&
      (serverState.posStart || serverState.posEnd) &&
      !serverState.selectedGroup
    ) {
      alert("Please select a chromosome.");
      return;
    }

    updateServerState(server, {
      isSearching: true,
    });

    try {
      const body = buildServerAlleleBody(serverState, page);

      const alleleResponse = await apiInstance.fetchAlleles(body);

      const variantDbIds = alleleResponse?.result?.variantDbIds || [];

      let variantResponse = {
        result: {
          data: [],
        },
      };

      if (variantDbIds.length > 0) {
        variantResponse = await apiInstance.fetchVariants({
          variantDbIds,
        });
      }

      updateServerState(server, {
        alleleData: alleleResponse,
        genomData: variantResponse,
        currentPage: page,
      });
    } catch (error) {
      console.error(`Failed to search ${server}:`, error);

      alert(
        `An error occurred while searching ${server.replace(
          /^https?:\/\//,
          "",
        )}: ${error.message}`,
      );
    } finally {
      updateServerState(server, {
        isSearching: false,
      });
    }
  };

  const handleServerPageChange = (server, page) => {
    fetchServerData(server, page);
  };

  const handleServerReset = (server) => {
    updateServerState(server, {
      selectedDataset: "",
      selectedVariantSetDbId: [],
      selectedStudyDbId: [],
      selectedCallSetDetails: [],
      callSetDbIds: [],
      completeNames: [],

      linkageGroups: [],
      selectedGroup: "",
      posStart: "",
      posEnd: "",

      searchType: "",
      variantListInput: "",
      variantList: [],

      genomData: null,
      alleleData: null,
      currentPage: 1,
      isSearching: false,
      isExporting: false,
    });
  };

  const handleCopyServerGermplasms = async (server) => {
    const serverState = serverStates[server];

    if (!serverState) {
      return;
    }

    try {
      await navigator.clipboard.writeText(serverState.germplasms.join("\n"));

      updateServerState(server, {
        copied: true,
      });

      setTimeout(() => {
        updateServerState(server, {
          copied: false,
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy sample names:", error);
    }
  };

  const handleServerExportVCF = async (server) => {
    const serverState = serverStates[server];
    const apiInstance = genolinkGigwaApisRef.current[server];

    if (!serverState || !apiInstance) {
      return;
    }

    if (serverState.selectedCallSetDetails.length === 0) {
      alert("Please select a dataset before exporting.");
      return;
    }

    updateServerState(server, {
      isExporting: true,
    });

    const body = {
      variantList: serverState.variantList,
      selectedCallSetDetails: serverState.selectedCallSetDetails,
      variantPage: serverState.currentPage,
      linkagegroups: serverState.selectedGroup || "",
      start: serverState.posStart || -1,
      end: serverState.posEnd || -1,
    };

    try {
      await apiInstance.exportGigwaVCF(body);
    } catch (error) {
      console.error(`Export failed for ${server}:`, error);

      alert(`Export failed: ${error.message}`);
    } finally {
      updateServerState(server, {
        isExporting: false,
      });
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

  return (
    Array.isArray(searchResults) && (
      <div>
        <h3>Genotype Data</h3>
        <br />
        {isLoading && <LoadingComponent />}
        <div className={styles.genoSplit}>
          {/* LEFT: FILTERS */}
          <aside className={styles.filtersPane}>
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
              {selectedOption === "Gigwa" && (
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={combineServerResults}
                    onChange={(event) =>
                      setCombineServerResults(event.target.checked)
                    }
                  />
                  Combine server results
                </label>
              )}
              {!isGenomeSearchSubmit ? (
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  onClick={handleSearch}
                >
                  Lookup Data
                </button>
              ) : selectedOption !== "Gigwa" || combineServerResults ? (
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
              ) : null}
            </div>

            {!isGenomeSearchSubmit && (
              <div>
                {selectedGigwaServers.length > 0 && <h4>Server found:</h4>}
                {selectedGigwaServers.map((server, index) => (
                  <div key={server} style={{ marginBottom: "15px" }}>
                    <h5>{server?.replace(/^https?:\/\//, "")}</h5>
                    {REQUIRE_GIGWA_CREDENTIALS && (
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

            {selectedOption === "Gigwa" &&
              showDatasetSelector &&
              combineServerResults && (
                <div>
                  <h3>Search Summary</h3>
                  {selectedGigwaServers.map((server, index) => (
                    <div key={server} className={styles.serverSummaryBox}>
                      <h4>Server: {server?.replace(/^https?:\/\//, "")}</h4>
                      <h5>
                        {numberOfMappedAccessions[index]} of{" "}
                        {numberOfGenesysAccessions} accessions have sample name
                        mappings.
                      </h5>
                      <h5>
                        {numberOfPresentAccessions[index]} of{" "}
                        {numberOfGenesysAccessions} accessions have genotypes in
                        Gigwa.
                      </h5>
                    </div>
                  ))}
                  {!copied ? (
                    <button
                      type="button"
                      className={styles.copySampleButton}
                      onClick={handleCopyGermplasms}
                    >
                      <FontAwesomeIcon
                        icon={faCopy}
                        className={styles.copyIcon}
                      />{" "}
                      Copy Sample-Names
                    </button>
                  ) : (
                    <span className={styles.copySuccessText}>Copied!</span>
                  )}

                  <br />
                  <div className={styles.datasetSelectorContainer}>
                    <h4>Select Dataset:</h4>
                    {datasets &&
                      datasets.map((datasetGroup, groupIndex) => (
                        <fieldset
                          key={groupIndex}
                          className={styles.datasetGroupFieldset}
                        >
                          <legend>
                            Server:{" "}
                            {selectedGigwaServers[groupIndex]?.replace(
                              /^https?:\/\//,
                              "",
                            )}
                          </legend>
                          {datasetGroup.map((dataset) => (
                            <label key={dataset} className={styles.radioLabel}>
                              <input
                                type="radio"
                                name={`dataset-group-${groupIndex}`}
                                value={dataset}
                                checked={
                                  selectedDataset[groupIndex]?.[0] === dataset
                                }
                                onChange={() =>
                                  handleDatasetDetails(groupIndex, dataset)
                                }
                              />
                              {dataset}
                            </label>
                          ))}
                        </fieldset>
                      ))}
                  </div>
                </div>
              )}

            {/* Filters that depend on searchType */}
            {combineServerResults && (
              <>
                {showDatasetSelector && (
                  <select
                    value={searchType || ""}
                    onChange={(e) => handleSearchTypeChange(e.target.value)}
                    className={styles.filterTypeSelect}
                    disabled={selectedGigwaServers.some(
                      (_, index) =>
                        !datasets?.[index] ||
                        datasets[index].length === 0 ||
                        !selectedDataset?.[index] ||
                        selectedDataset[index].length === 0,
                    )}
                  >
                    <option value="" disabled>
                      Filter Type
                    </option>
                    <option value="PositionRange">PositionRange</option>
                    <option value="VariantIDs">VariantIDs</option>
                  </select>
                )}
              </>
            )}
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

            {selectedOption === "Germinate" && !showPrivacyRadio && (
              <>
                <PositionRangeFilter
                  posStart={posStart}
                  setPosStart={setPosStart}
                  posEnd={posEnd}
                  setPosEnd={setPosEnd}
                />
                <div>
                  <select
                    id="linkageGroupSelect"
                    className={styles.formControl}
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
            )}
          </aside>

          {/* RIGHT: RESULTS */}
          {selectedOption === "Gigwa" &&
            isGenomeSearchSubmit &&
            !combineServerResults && (
              <Tabs>
                <TabList>
                  {selectedGigwaServers.map((server) => (
                    <Tab key={server}>{server.replace(/^https?:\/\//, "")}</Tab>
                  ))}
                </TabList>

                {selectedGigwaServers.map((server, serverIndex) => {
                  const serverState = serverStates[server];

                  return (
                    <TabPanel key={server}>
                      {!serverState ? (
                        <p>No lookup data is available for this server.</p>
                      ) : (
                        <div>
                          <div className={styles.serverSummaryBox}>
                            <h3>Search Summary</h3>

                            <h4>
                              Server: {server.replace(/^https?:\/\//, "")}
                            </h4>

                            <p>
                              {serverState.numberOfMappedAccessions} of{" "}
                              {serverState.numberOfGenesysAccessions} accessions
                              have sample-name mappings.
                            </p>

                            <p>
                              {serverState.numberOfPresentAccessions} of{" "}
                              {serverState.numberOfGenesysAccessions} accessions
                              have genotypes in Gigwa.
                            </p>

                            <button
                              type="button"
                              className={styles.copySampleButton}
                              onClick={() => handleCopyServerGermplasms(server)}
                            >
                              <FontAwesomeIcon
                                icon={faCopy}
                                className={styles.copyIcon}
                              />

                              {serverState.copied
                                ? "Copied!"
                                : "Copy Sample-Names"}
                            </button>
                          </div>

                          <div className={styles.datasetSelectorContainer}>
                            <h4>Select Dataset:</h4>

                            <fieldset className={styles.datasetGroupFieldset}>
                              {serverState.datasets.length === 0 ? (
                                <p>No datasets were found on this server.</p>
                              ) : (
                                serverState.datasets.map((dataset) => (
                                  <label
                                    key={dataset}
                                    className={styles.radioLabel}
                                  >
                                    <input
                                      type="radio"
                                      name={`dataset-${serverIndex}`}
                                      value={dataset}
                                      checked={
                                        serverState.selectedDataset === dataset
                                      }
                                      onChange={() =>
                                        handleServerDatasetDetails(
                                          server,
                                          dataset,
                                        )
                                      }
                                    />{" "}
                                    {dataset}
                                  </label>
                                ))
                              )}
                            </fieldset>

                            <select
                              className={styles.filterTypeSelect}
                              value={serverState.searchType}
                              disabled={!serverState.selectedDataset}
                              onChange={(event) =>
                                handleServerSearchTypeChange(
                                  server,
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Filter Type</option>
                              <option value="PositionRange">
                                Position Range
                              </option>
                              <option value="VariantIDs">Variant IDs</option>
                            </select>

                            {serverState.searchType === "PositionRange" && (
                              <>
                                <select
                                  value={serverState.selectedGroup}
                                  onChange={(event) =>
                                    updateServerState(server, {
                                      selectedGroup: event.target.value,
                                      currentPage: 1,
                                      genomData: null,
                                      alleleData: null,
                                    })
                                  }
                                >
                                  <option value="">Select a chromosome</option>

                                  {serverState.linkageGroups.map((group) => (
                                    <option key={group} value={group}>
                                      {group}
                                    </option>
                                  ))}
                                </select>

                                <PositionRangeFilter
                                  posStart={serverState.posStart}
                                  setPosStart={(value) =>
                                    updateServerState(server, {
                                      posStart: value,
                                      currentPage: 1,
                                      genomData: null,
                                      alleleData: null,
                                    })
                                  }
                                  posEnd={serverState.posEnd}
                                  setPosEnd={(value) =>
                                    updateServerState(server, {
                                      posEnd: value,
                                      currentPage: 1,
                                      genomData: null,
                                      alleleData: null,
                                    })
                                  }
                                />
                              </>
                            )}

                            {serverState.searchType === "VariantIDs" && (
                              <VariantListFilter
                                id={`variant-ids-${serverIndex}`}
                                value={serverState.variantListInput}
                                onVariantListChange={({ rawValue, variants }) =>
                                  updateServerState(server, {
                                    variantListInput: rawValue,
                                    variantList: variants,
                                    currentPage: 1,
                                    genomData: null,
                                    alleleData: null,
                                  })
                                }
                              />
                            )}

                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                marginTop: "12px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                className={styles.buttonPrimary}
                                disabled={
                                  !serverState.selectedDataset ||
                                  serverState.isSearching
                                }
                                onClick={() => fetchServerData(server, 1)}
                              >
                                Search Genotype
                              </button>

                              <button
                                type="button"
                                className={styles.buttonSecondary}
                                onClick={() => handleServerReset(server)}
                              >
                                Reset
                              </button>

                              {serverState.genomData &&
                                serverState.alleleData && (
                                  <button
                                    type="button"
                                    className={styles.buttonSecondary}
                                    disabled={serverState.isExporting}
                                    onClick={() =>
                                      handleServerExportVCF(server)
                                    }
                                  >
                                    {serverState.isExporting
                                      ? "Exporting..."
                                      : "Export VCF"}
                                  </button>
                                )}
                            </div>
                          </div>

                          {serverState.sampleSourceData.length > 0 && (
                            <SampleSourceTable
                              sampleSourceData={serverState.sampleSourceData}
                            />
                          )}

                          {serverState.isSearching && <LoadingComponent />}

                          {!serverState.isSearching &&
                            serverState.genomData &&
                            serverState.alleleData && (
                              <GenotypeSearchResultsTable
                                variantPageSize={variantPageSize}
                                combineServerResults={false}
                                serverData={serverState.genomData}
                                serverAlleleData={serverState.alleleData}
                                serverSamples={serverState.completeNames}
                                currentPage={serverState.currentPage}
                                onPageChange={(page) =>
                                  handleServerPageChange(server, page)
                                }
                              />
                            )}
                        </div>
                      )}
                    </TabPanel>
                  );
                })}
              </Tabs>
            )}
          {(selectedOption !== "Gigwa" || combineServerResults) && (
            <>
              <main className={styles.resultsPane}>
                {isGenomDataLoading && <LoadingComponent />}

                {genomData.length > 0 &&
                alleleData &&
                !isGenomDataLoading &&
                selectedOption === "Gigwa" ? (
                  <>
                    <div className={styles.resultsArea}>
                      <div className={styles.tableScroll}>
                        <GenotypeSearchResultsTable
                          variantPageSize={variantPageSize}
                        />
                      </div>
                    </div>

                    {isExportGenomDataLoading && <LoadingComponent />}
                    {!isExportGenomDataLoading && (
                      <div className={styles.exportBar}>
                        <select
                          id="exportServerSelect"
                          value={exportServer}
                          onChange={(e) => setExportServer(e.target.value)}
                        >
                          <option value="" disabled>
                            Select server
                          </option>
                          {selectedGigwaServers.map((server) => (
                            <option key={server} value={server}>
                              {server}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleExportVCF}
                          style={{ marginLeft: "10px", padding: "3px 10px" }}
                          className={styles.buttonPrimary}
                        >
                          Export VCF
                        </button>
                      </div>
                    )}
                  </>
                ) : selectedOption === "Germinate" &&
                  genomData &&
                  !isGenomDataLoading ? (
                  <GenotypeSearchResultsTable />
                ) : null}
                {selectedOption === "Gigwa" &&
                  genomData.length == 0 &&
                  alleleData.length == 0 &&
                  Array.isArray(sampleSourceData) &&
                  sampleSourceData.length > 0 && (
                    <div className={styles.resultsArea}>
                      <div className={styles.tableScroll}>
                        <SampleSourceTable
                          sampleSourceData={sampleSourceData}
                        />
                      </div>
                    </div>
                  )}
              </main>
            </>
          )}
        </div>
      </div>
    )
  );
};

export default GenotypeExplorer;
