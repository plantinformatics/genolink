import React, { useState, useEffect, useMemo, useRef } from "react";
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

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

import GenolinkGigwaApi from "../../api/GenolinkGigwaApi";
import GenolinkGerminateApi from "../../api/GenolinkGerminateApi";
import { platforms } from "../../config/apiConfig";
import { genolinkServer } from "../../config/apiConfig";

const GenotypeExplorer = () => {
  const [genolinkGerminateApi, setGenolinkGerminateApi] = useState(
    new GenolinkGerminateApi()
  );
  const [copied, setCopied] = useState(false);
  const [posStart, setPosStart] = useState("");
  const [posEnd, setPosEnd] = useState("");
  const [isGenomDataLoading, setIsGenomDataLoading] = useState(false);
  const [isExportGenomDataLoading, setIsExportGenomDataLoading] =
    useState(false);
  const [usernames, setUsernames] = useState([]);
  const [passwords, setPasswords] = useState([]);
  const [accessMode, setAccessMode] = useState([]);
  const [showSearchTypeSelector, setShowSearchTypeSelector] = useState(false);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [gigwaServers, setGigwaServers] = useState({});
  const [selectedGigwaServers, setSelectedGigwaServers] = useState([]);
  const [searchSamplesInDatasetsResult, setSearchSamplesInDatasetsResult] =
    useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [exportServer, setExportServer] = useState("");

  const selectedOption = useSelector((state) => state.genotype.selectedOption);
  const genomData = useSelector((state) => state.genotype.genomData);
  const alleleData = useSelector((state) => state.genotype.alleleData);
  const datasets = useSelector((state) => state.genotype.datasets);
  const selectedDataset = useSelector(
    (state) => state.genotype.selectedDataset
  );
  const selectedStudyDbId = useSelector(
    (state) => state.genotype.selectedStudyDbId
  );
  const selectedVariantSetDbId = useSelector(
    (state) => state.genotype.selectedVariantSetDbId
  );
  const sampleDetails = useSelector((state) => state.genotype.sampleDetails);
  const variantSetDbIds = useSelector(
    (state) => state.genotype.variantSetDbIds
  );
  const sampleDbIds = useSelector((state) => state.genotype.sampleDbIds);
  const sampleNames = useSelector((state) => state.genotype.sampleNames);
  const sampleVcfNames = useSelector((state) => state.genotype.sampleVcfNames);
  const selectedSamplesDetails = useSelector(
    (state) => state.genotype.selectedSamplesDetails
  );
  const isGenomeSearchSubmit = useSelector(
    (state) => state.genotype.isGenomeSearchSubmit
  );
  const pagesPerServer = useSelector((state) => state.genotype.pagesPerServer);
  const genotypeCurrentPage = useSelector(
    (state) => state.genotype.genotypeCurrentPage
  );
  const pageLengths = useSelector((state) => state.genotype.pageLengths);
  const selectedGroups = useSelector((state) => state.genotype.selectedGroups);
  const linkageGroups = useSelector((state) => state.genotype.linkageGroups);
  const variantList = useSelector((state) => state.genotype.variantList);
  const numberOfGenesysAccessions = useSelector(
    (state) => state.genotype.numberOfGenesysAccessions
  );
  const numberOfPresentAccessions = useSelector(
    (state) => state.genotype.numberOfPresentAccessions
  );
  const numberOfMappedAccessions = useSelector(
    (state) => state.genotype.numberOfMappedAccessions
  );
  const resetTrigger = useSelector((state) => state.passport.resetTrigger);
  const searchResults = useSelector((state) => state.passport.searchResults);
  const checkedAccessionsObject = useSelector(
    (state) => state.passport.checkedAccessions
  );
  const checkedAccessionNamesObject = useSelector(
    (state) => state.passport.checkedAccessionNames
  );

  const genolinkGigwaApisRef = useRef({});
  const checkedAccessions = Object.keys(checkedAccessionsObject);
  const checkedResults = useMemo(() => {
    return Array.isArray(searchResults)
      ? searchResults.filter((item) =>
          checkedAccessions.includes(item.accessionNumber)
        )
      : [];
  }, [searchResults, checkedAccessions]);
  const dispatch = useDispatch();
  useEffect(() => {
    if (selectedOption === "Gigwa" && isGenomeSearchSubmit) {
      fetchData(genotypeCurrentPage);
    }
  }, [genotypeCurrentPage]);

  useEffect(() => {
    dispatch(genotypeActions.setGenomData([]));
  }, [selectedOption]);

  useEffect(() => {
    if (selectedGigwaServers.length > 0) {
      const defaultAccessModes = selectedGigwaServers.map(() => "private");
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
    const fetchGigwaServers = async () => {
      try {
        const response = await axios.get(
          `${genolinkServer}/api/gigwa/gigwaServers`
        );
        setGigwaServers(response.data);
      } catch (error) {
        console.error("Error fetching Gigwa servers:", error);
      }
    };
    fetchGigwaServers();
  }, []);

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
    genomData,
    selectedOption,
    selectedGigwaServers,
    selectedStudyDbId,
    checkedAccessionsObject,
  ]);
  const handleInputChange = (groupName) => {
    const updatedGroups = selectedGroups.includes(groupName)
      ? selectedGroups.filter((group) => group !== groupName)
      : [...selectedGroups, groupName];

    dispatch(genotypeActions.setSelectedGroups(updatedGroups));
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
      const instituteCodes = [
        ...new Set(checkedResults.map((item) => item.instituteCode)),
      ];
      const matchedServers = instituteCodes
        .map((code) => gigwaServers[code])
        .filter(Boolean);

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
            genolinkGigwaApisRef.current[server].token
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
      }
    } else {
      if (Object.keys(genolinkGigwaApisRef.current).length !== 0) {
        genolinkGigwaApisRef.current = {};
      }
      if (selectedGigwaServers.length !== 0) {
        setSelectedGigwaServers([]);
      }
    }
  }, [checkedResults, gigwaServers]);

  const handleDatasetDetails = (groupIndex, selectedValue) => {
    let updatedSelection = [...selectedDataset];

    updatedSelection[groupIndex] = [selectedValue];
    dispatch(genotypeActions.setSelectedDataset(updatedSelection));

    const selectedSamples = sampleDetails.map((innerArray, index) =>
      innerArray.filter((sample) =>
        updatedSelection[index]?.some((ds) => sample?.sampleName.includes(ds))
      )
    );

    const selectedVariantSetDbId = variantSetDbIds.map((innerArray, index) =>
      innerArray.filter((variantSetDbId) =>
        updatedSelection[index]?.some((ds) => variantSetDbId.includes(ds))
      )
    );
    const selectedSampleDbIds = searchSamplesInDatasetsResult.map(
      (server, groupIndex) =>
        server.response.result.data
          .filter((sample) =>
            updatedSelection[groupIndex]?.some((ds) =>
              sample.sampleName.includes(ds)
            )
          )
          .map((sample) => sample.sampleDbId)
    );

    const selectedAccessionPlusAccessionName =
      searchSamplesInDatasetsResult.map((server, groupIndex) => {
        const selectedDatasetValue = updatedSelection[groupIndex]?.[0] || "";
        const matchingGermplasmIds = server.response.result.data
          .filter((sample) => sample.sampleName.includes(selectedDatasetValue))
          .map((sample) => sample.germplasmDbId.split("§")[1]);

        return server.accessionPlusAccessionName.filter((item) =>
          matchingGermplasmIds.some((gid) => item.includes(gid))
        );
      });
    dispatch(genotypeActions.setSelectedVariantSetDbId(selectedVariantSetDbId));
    dispatch(genotypeActions.setSelectedSamplesDetails(selectedSamples));
    dispatch(
      genotypeActions.setSelectedStudyDbId([
        ...new Set(selectedSamples.flat().map((sample) => sample.studyDbId)),
      ])
    );

    dispatch(genotypeActions.setSampleDbIds(selectedSampleDbIds));
    dispatch(
      genotypeActions.setCompleteNames(selectedAccessionPlusAccessionName)
    );
  };
  const handleExportVCF = async () => {
    setIsExportGenomDataLoading(true);
    if (!exportServer) {
      alert("Please select a server for export.");
      return;
    }
    const apiInstance = genolinkGigwaApisRef.current[exportServer];
    if (!apiInstance) {
      alert("API instance for the selected server was not found.");
      return;
    }

    const exportIndex = selectedGigwaServers.findIndex(
      (srv) => srv === exportServer
    );
    const exportSamples =
      exportIndex !== -1 && selectedSamplesDetails[exportIndex]
        ? selectedSamplesDetails[exportIndex]
        : [];
    const body = {
      selectedGigwaServer: exportServer,
      variantList: variantList,
      selectedSamplesDetails: exportSamples,
      variantPage: genotypeCurrentPage,
      linkagegroups: selectedGroups.join(";"),
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
          }
        );

        if (hasMissingCredentials) {
          alert(
            "Please enter both username and password for all private servers."
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
            }
          );
          if (missingDatasetSelection) {
            alert("Please select a dataset for each server before continuing.");
            return;
          }
        }

        if (!isGenomeSearchSubmit) {
          const authResults = await Promise.all(
            selectedGigwaServers.map(async (server, index) => {
              const username =
                accessMode[index] === "private" ? usernames[index] : "";
              const password =
                accessMode[index] === "private" ? passwords[index] : "";

              try {
                await genolinkGigwaApisRef.current[server].getGigwaToken(
                  server,
                  username,
                  password
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
            })
          );

          const failed = authResults.filter((res) => !res.success);
          if (failed.length > 0) {
            const messages = failed
              .map(
                (f) =>
                  `Authentication failed for ${f.server?.replace(
                    /^https?:\/\//,
                    ""
                  )}: ${f.message}`
              )
              .join("\n");

            alert(messages);
            return;
          }

          const Accessions = checkedResults?.map(
            (item) => item.accessionNumber
          );

          const fetchRequests = Object.values(genolinkGigwaApisRef.current).map(
            (api, index) =>
              api.searchSamplesInDatasets(
                selectedGigwaServers[index],
                Accessions,
                checkedAccessionNamesObject
              )
          );

          const responses = await Promise.all(fetchRequests);

          let combinedResults = {
            responseData: [],
            variantSetDbIds: [],
            datasetNames: [],
            vcfSamples: [],
            numberOfGenesysAccessions: [],
            numberOfPresentAccessions: [],
            numberOfMappedAccessions: [],
            accessionPlusAccessionName: [],
          };

          responses.forEach(
            ({
              response,
              variantSetDbIds,
              datasetNames,
              vcfSamples,
              numberOfGenesysAccessions,
              numberOfPresentAccessions,
              numberOfMappedAccessions,
              accessionPlusAccessionName,
            }) => {
              combinedResults.responseData.push(response.result.data);
              combinedResults.variantSetDbIds.push(variantSetDbIds);
              combinedResults.datasetNames.push(datasetNames);
              combinedResults.vcfSamples.push(vcfSamples);
              combinedResults.numberOfGenesysAccessions.push(
                numberOfGenesysAccessions
              );
              combinedResults.numberOfPresentAccessions.push(
                numberOfPresentAccessions
              );
              combinedResults.numberOfMappedAccessions.push(
                numberOfMappedAccessions
              );
              combinedResults.accessionPlusAccessionName.push(
                accessionPlusAccessionName
              );
            }
          );

          setSearchSamplesInDatasetsResult(responses);

          const sampleNames = combinedResults.responseData.map((apiResponse) =>
            apiResponse.map((sample) => sample?.sampleName)
          );

          const totalNumberOfGenesysAccessions =
            combinedResults.numberOfGenesysAccessions[0];
          dispatch(
            genotypeActions.setNumberOfGenesysAccessions(
              totalNumberOfGenesysAccessions
            )
          );
          dispatch(
            genotypeActions.setNumberOfPresentAccessions(
              combinedResults.numberOfPresentAccessions
            )
          );
          dispatch(
            genotypeActions.setNumberOfMappedAccessions(
              combinedResults.numberOfMappedAccessions
            )
          );

          if (combinedResults.responseData.length === 0) {
            alert("No genotype data found across all Gigwa servers.");
            return;
          }

          const filteredDatasetNames = combinedResults.datasetNames.map(
            (datasetArr, index) =>
              datasetArr.filter((datasetName) =>
                sampleNames[index].some((sampleName) =>
                  sampleName.includes(datasetName)
                )
              )
          );

          const uniqueSampleNames = combinedResults.responseData.map(
            (apiResponse) =>
              Array.from(
                new Set(
                  apiResponse.map(
                    (sample) => sample.germplasmDbId.split("§")[1]
                  )
                )
              )
          );

          dispatch(
            genotypeActions.setVariantSetDbIds(combinedResults.variantSetDbIds)
          );
          dispatch(
            genotypeActions.setSampleVcfNames(combinedResults.vcfSamples)
          );
          dispatch(genotypeActions.setDatasets(filteredDatasetNames));
          dispatch(
            genotypeActions.setSampleDetails(combinedResults.responseData)
          );
          dispatch(genotypeActions.setSampleNames(uniqueSampleNames));
          dispatch(genotypeActions.setIsGenomeSearchSubmit(true));
          setShowSearchTypeSelector(true);
          setShowDatasetSelector(true);
        }

        if (selectedSamplesDetails.length > 0) {
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

  const toggleDrawer = () => {
    setIsDrawerOpen((prevState) => !prevState);
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
        const fetchVariantRequests = Object.values(
          genolinkGigwaApisRef.current
        ).map((api, index) => {
          if (
            pagesPerServer.length > 0 &&
            page > pagesPerServer[index].length
          ) {
            return Promise.resolve({ data: { count: 0, variants: [] } });
          }
          return api.fetchVariants({
            selectedGigwaServer: selectedGigwaServers[index],
            sampleVcfNames: sampleVcfNames[index],
            selectedSamplesDetails: selectedSamplesDetails[index],
            variantList,
            variantPage: page - 1,
            linkagegroups: selectedGroups.join(";"),
            posStart: posStart || -1,
            posEnd: posEnd || -1,
          });
        });

        let fetchAlleleRequests = [];
        if (posStart && posEnd) {
          fetchAlleleRequests = Object.values(genolinkGigwaApisRef.current).map(
            (api, index) => {
              if (
                pagesPerServer.length > 0 &&
                page > pagesPerServer[index].length
              ) {
                return Promise.resolve({
                  result: { dataMatrices: [{ dataMatrix: [] }] },
                });
              }
              return api.fetchAlleles({
                selectedGigwaServer: selectedGigwaServers[index],
                callSetDbIds: sampleDbIds[index],
                variantSetDbIds: selectedVariantSetDbId[index],
                positionRanges: selectedGroups.map(
                  (group) => `${group}:${posStart}-${posEnd}`
                ),
                dataMatrixAbbreviations: ["GT"],
                pagination: [
                  { dimension: "variants", page: page - 1, pageSize: 1000 },
                  { dimension: "callsets", page: 0, pageSize: 10000 },
                ],
              });
            }
          );
        } else if (variantList.length > 0) {
          fetchAlleleRequests = Object.values(genolinkGigwaApisRef.current).map(
            (api, index) => {
              if (
                pagesPerServer.length > 0 &&
                page > pagesPerServer[index].length
              ) {
                return Promise.resolve({
                  result: { dataMatrices: [{ dataMatrix: [] }] },
                });
              }
              return api.fetchAlleles({
                selectedGigwaServer: selectedGigwaServers[index],
                callSetDbIds: sampleDbIds[index],
                variantSetDbIds: selectedVariantSetDbId[index],
                variantDbIds: variantList.map(
                  (variant) =>
                    `${
                      selectedVariantSetDbId[index][0].split("§")[0]
                    }§${variant}`
                ),
                dataMatrixAbbreviations: ["GT"],
                pagination: [
                  { dimension: "variants", page: page - 1, pageSize: 1000 },
                  { dimension: "callsets", page: 0, pageSize: 10000 },
                ],
              });
            }
          );
        } else {
          fetchAlleleRequests = Object.values(genolinkGigwaApisRef.current).map(
            (api, index) => {
              if (
                pagesPerServer.length > 0 &&
                page > pagesPerServer[index].length
              ) {
                return Promise.resolve({
                  result: { dataMatrices: [{ dataMatrix: [] }] },
                });
              }
              return api.fetchAlleles({
                selectedGigwaServer: selectedGigwaServers[index],
                callSetDbIds: sampleDbIds[index],
                variantSetDbIds: selectedVariantSetDbId[index],
                dataMatrixAbbreviations: ["GT"],
                pagination: [
                  { dimension: "variants", page: page - 1, pageSize: 1000 },
                  { dimension: "callsets", page: 0, pageSize: 10000 },
                ],
              });
            }
          );
        }

        const allRequests = await Promise.all([
          ...fetchVariantRequests,
          ...fetchAlleleRequests,
        ]);

        const variantResponses = allRequests.slice(
          0,
          fetchVariantRequests.length
        );
        const alleleResponses = allRequests.slice(fetchVariantRequests.length);

        if (pagesPerServer.length === 0) {
          const newPagesPerServer = variantResponses.map((server) => {
            const count = server.data.count;
            const fullPages = Math.floor(count / 1000);
            const remainder = count % 1000;
            const pagesArr = [];
            for (let j = 0; j < fullPages; j++) {
              pagesArr.push(1000);
            }
            if (remainder > 0) pagesArr.push(remainder);
            return pagesArr;
          });
          dispatch(genotypeActions.setPagesPerServer(newPagesPerServer));

          const globalPageCount = Math.max(
            ...newPagesPerServer.map((arr) => arr.length)
          );

          const newGlobalPageLengths = Array.from(
            { length: globalPageCount },
            (_, i) =>
              newPagesPerServer.reduce((sum, pagesArr) => {
                if (pagesArr[i] !== undefined) {
                  return sum + (i < pagesArr.length - 1 ? 1000 : pagesArr[i]);
                }
                return sum;
              }, 0)
          );
          dispatch(genotypeActions.setPageLengths(newGlobalPageLengths));
        }

        dispatch((dispatch, getState) => {
          const state = getState();
          const prevPageLengths = state.genotype.pageLengths || [];

          let totalVariantsOnThisPage = 0;
          for (const variantResp of variantResponses) {
            totalVariantsOnThisPage += variantResp.data.variants.length;
          }

          const updated = [...prevPageLengths];
          updated[page - 1] = totalVariantsOnThisPage;
          dispatch(genotypeActions.setPageLengths(updated));
        });

        dispatch(genotypeActions.setGenomData(variantResponses));
        dispatch(genotypeActions.setAlleleData(alleleResponses));
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
        const callsetNames = responses.map((response) => response.sample);
        dispatch(genotypeActions.setSampleNames(callsetNames));
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
    setShowSearchTypeSelector(false);
    setShowDatasetSelector(false);
    setPosStart("");
    setPosEnd("");
    dispatch(genotypeActions.resetGenotype());
    dispatch(setWildSearchValue(""));
    // dispatch(genotypeActions.setSelectedStudyDbId([]));
    // dispatch(genotypeActions.setIsGenomeSearchSubmit(false));
    // dispatch(genotypeActions.setGenomData([]));
    // dispatch(genotypeActions.setAlleleData([]));
    // dispatch(genotypeActions.setVariantList([]));
    // dispatch(genotypeActions.setSelectedGroups([]));
    // dispatch(genotypeActions.setSelectedSamplesDetails([]));
    // dispatch(genotypeActions.setSelectedDataset(""));
    // setShowSearchTypeSelector(false);
    // setShowDatasetSelector(false);
    // setPosStart("");
    // setPosEnd("");
    // dispatch(setWildSearchValue(""));
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
      }
    }
    setSearchType(newType);
  };

  const handleCopySampleNames = () => {
    const flatSamples = sampleNames.flat();
    const samplesText = flatSamples.join("\n");
    navigator.clipboard
      .writeText(samplesText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy sample names: ", err);
      });
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
        <div className="geno-data">
          <h2>Genotype Data</h2>
          <br />
          {isGenomDataLoading && <LoadingComponent />}
          {!isGenomDataLoading && (
            <div>
              <div className="search-container">
                {platforms.length > 1 && (
                  <select
                    style={{ width: "1290px" }}
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
                {genomData.length === 0 ? (
                  <button
                    type="button"
                    className="button-primary"
                    onClick={handleSearch}
                  >
                    {isGenomeSearchSubmit ? "Search Genotype" : "Lookup Data"}
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

              {!isGenomeSearchSubmit && (
                <div>
                  {selectedGigwaServers.map((server, index) => (
                    <div key={server}>
                      <h4>{server?.replace(/^https?:\/\//, "")}</h4>

                      <div className="access-mode-toggle">
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

                      {/* Username and Password input fields for private access mode */}
                      {accessMode[index] === "private" && (
                        <>
                          <div className="input-group mb-3">
                            <span className="input-group-addon">
                              <FontAwesomeIcon icon={faUser} />
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Username"
                              value={usernames[index] || ""}
                              onChange={(e) =>
                                handleUsernameChange(index, e.target.value)
                              }
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
                              value={passwords[index] || ""}
                              onChange={(e) =>
                                handlePasswordChange(index, e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Show Search Summary */}
              {selectedOption === "Gigwa" && showDatasetSelector && (
                <div className="dataset-selector">
                  <div>
                    <h3>Search Summary</h3>
                    {selectedGigwaServers.map((server, index) => (
                      <div
                        key={server}
                        style={{
                          border: "1px solid #ccc",
                          margin: "8px 0",
                          padding: "8px",
                          borderRadius: "4px",
                        }}
                      >
                        <h4>Server: {server?.replace(/^https?:\/\//, "")}</h4>
                        <h5>
                          {numberOfMappedAccessions[index]} of{" "}
                          {numberOfGenesysAccessions} accessions have sample
                          name mappings.
                        </h5>
                        <h5>
                          {numberOfPresentAccessions[index]} of{" "}
                          {numberOfGenesysAccessions} accessions have genotypes
                          in Gigwa.
                        </h5>
                      </div>
                    ))}
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
                        <FontAwesomeIcon
                          icon={faCopy}
                          style={{ marginRight: "5px" }}
                        />
                        Copy Sample-Names
                      </button>
                    ) : (
                      <span style={{ color: "green", marginLeft: "10px" }}>
                        Copied!
                      </span>
                    )}
                  </div>

                  <br />
                  <div
                    style={{
                      backgroundColor: "beige",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <h4>Select Dataset:</h4>
                    {datasets &&
                      datasets.map((datasetGroup, groupIndex) => (
                        <fieldset
                          key={groupIndex}
                          style={{
                            marginBottom: "10px",
                            border: "1px solid #ccc",
                            padding: "10px",
                          }}
                        >
                          <legend>
                            Server:{" "}
                            {selectedGigwaServers[groupIndex]?.replace(
                              /^https?:\/\//,
                              ""
                            )}
                          </legend>
                          {datasetGroup.map((dataset) => (
                            <label
                              key={dataset}
                              style={{ display: "block", margin: "5px 0" }}
                            >
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

              {selectedOption === "Gigwa" && selectedDataset && (
                <>
                  {showSearchTypeSelector && (
                    <select
                      value={searchType || ""}
                      onChange={(e) => handleSearchTypeChange(e.target.value)}
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
                        <div>
                          <h2>Linkage Groups</h2>

                          {/* Button to toggle the drawer */}
                          <button
                            onClick={toggleDrawer}
                            className="select-style-button"
                          >
                            Chromosomes{" "}
                            <span
                              style={{ float: "right", marginLeft: "6.5px" }}
                            >
                              {"\u2304"}
                            </span>
                          </button>

                          {/* Drawer content */}
                          {isDrawerOpen && (
                            <div className="drawer">
                              <div>
                                {linkageGroups.map((group) => (
                                  <div key={group} className="form-check">
                                    <input
                                      className="form-check-input"
                                      type={
                                        selectedOption === "Germinate"
                                          ? "radio"
                                          : "checkbox"
                                      }
                                      id={group}
                                      name="linkageGroup"
                                      value={group}
                                      checked={selectedGroups.includes(group)}
                                      onChange={() => handleInputChange(group)}
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor={group}
                                    >
                                      {selectedOption === "Germinate"
                                        ? CHROMConverter(group)
                                        : group}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : searchType === "VariantIDs" ? (
                      <VariantListFilter />
                    ) : null)}
                </>
              )}
              {selectedOption === "Germinate" && !showPrivacyRadio && (
                <>
                  <PositionRangeFilter
                    posStart={posStart}
                    setPosStart={setPosStart}
                    posEnd={posEnd}
                    setPosEnd={setPosEnd}
                  />
                  <div>
                    <h2>Linkage Groups</h2>

                    {/* Button to toggle the drawer */}
                    <button
                      onClick={toggleDrawer}
                      className="select-style-button"
                    >
                      Chromosomes{" "}
                      <span style={{ float: "right", marginLeft: "6.5px" }}>
                        {"\u2304"}
                      </span>
                    </button>

                    {/* Drawer content */}
                    {isDrawerOpen && (
                      <div className="drawer">
                        <div>
                          {linkageGroups.map((group) => (
                            <div key={group} className="form-check">
                              <input
                                className="form-check-input"
                                type={
                                  selectedOption === "Germinate"
                                    ? "radio"
                                    : "checkbox"
                                }
                                id={group}
                                name="linkageGroup"
                                value={group}
                                checked={selectedGroups.includes(group)}
                                onChange={() => handleInputChange(group)}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={group}
                              >
                                {selectedOption === "Germinate"
                                  ? CHROMConverter(group)
                                  : group}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {isGenomDataLoading && <LoadingComponent />}
              {genomData.length > 0 &&
              alleleData &&
              !isGenomDataLoading &&
              selectedOption === "Gigwa" ? (
                <>
                  <GenotypeSearchResultsTable
                  // data={genomData}
                  // alleles={alleleData}
                  // currentPage={currentPage}
                  // setCurrentPage={setCurrentPage}
                  // samples={completeNames}
                  // platform={selectedOption}
                  // pageLengths={pageLengths}
                  />

                  {isExportGenomDataLoading && <LoadingComponent />}
                  {!isExportGenomDataLoading && (
                    <>
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
                        style={{ marginLeft: "10px" }}
                      >
                        Export VCF
                      </button>
                    </>
                  )}
                </>
              ) : selectedOption === "Germinate" &&
                genomData &&
                !isGenomDataLoading ? (
                <GenotypeSearchResultsTable />
              ) : null}
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default GenotypeExplorer;
