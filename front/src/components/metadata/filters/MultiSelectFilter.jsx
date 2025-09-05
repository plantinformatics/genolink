import { useSelector } from "react-redux";
import {
  setCropCheckedBoxes,
  setGenusCheckedBoxes,
  setGenusSpeciesCheckedBoxes,
  setSpeciesCheckedBoxes,
  setOriginOfMaterialCheckedBoxes,
  setSampStatCheckedBoxes,
  setGermplasmStorageCheckedBoxes,
} from "../../../redux/passport/passportActions";
import { useDispatch } from "react-redux";
import styles from "./MultiSelectFilter.module.css";

const sampStatMapping = {
  100: "Wild",
  110: "Natural",
  120: "Semi-natural/wild",
  130: "Semi-natural/sown",
  200: "Weedy",
  300: "Traditional cultivar/Landrace",
  400: "Breeding/Research Material",
  410: "Breeders Line",
  411: "Synthetic population",
  412: "Hybrid",
  413: "Founder stock/base population",
  414: "Inbred line",
  415: "Segregating population",
  416: "Clonal selection",
  420: "Genetic stock",
  421: "Mutant",
  422: "Cytogenetic stocks",
  423: "Other genetic stocks",
  500: "Advanced/improved cultivar",
  600: "GMO",
  999: "Other",
};

const germplasmStorageMapping = {
  10: "Seed collection",
  11: "Short term seed collection",
  12: "Medium term seed collection",
  13: "Long term seed collection",
  20: "Field collection",
  30: "In vitro collection",
  40: "Cryopreserved collection",
  50: "DNA collection",
  99: "Other",
};

const hierarchy1 = {
  100: ["110", "120", "130"],
  400: [
    "410",
    "411",
    "412",
    "413",
    "414",
    "415",
    "416",
    "420",
    "421",
    "422",
    "423",
  ],
  410: ["411", "412", "413", "414", "415", "416"],
  420: ["421", "422", "423"],
  10: ["11", "12", "13"],
};
const hierarchy2 = {
  parent: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "999",
    "10",
    "20",
    "30",
    "40",
    "50",
    "99",
  ],
  child: ["110", "120", "130", "410", "420", "11", "12", "13"],
  "grand-child": [
    "411",
    "412",
    "413",
    "414",
    "415",
    "416",
    "421",
    "422",
    "423",
  ],
};

const MultiSelectFilter = ({ options, type }) => {
  const dispatch = useDispatch();
  const instituteCheckedBoxes = useSelector(
    (state) => state.passport.instituteCheckedBoxes
  );
  const cropCheckedBoxes = useSelector(
    (state) => state.passport.cropCheckedBoxes
  );
  const genusCheckedBoxes = useSelector(
    (state) => state.passport.genusCheckedBoxes
  );
  const genusSpeciesCheckedBoxes = useSelector(
    (state) => state.passport.genusSpeciesCheckedBoxes
  );
  const speciesCheckedBoxes = useSelector(
    (state) => state.passport.speciesCheckedBoxes
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
  const getIndentation = (optionKey) => {
    if (
      type !== "sampStatCheckedBoxes" &&
      type !== "germplasmStorageCheckedBoxes"
    )
      return "";

    if (hierarchy2["parent"].includes(optionKey)) {
      return "0px";
    } else if (hierarchy2["child"].includes(optionKey)) {
      return "20px";
    } else if (hierarchy2["grand-child"].includes(optionKey)) {
      return "40px";
    }

    return "0px";
  };

  const handleCheckedBox = (option, checked) => {
    if (type === "institueCheckedBoxes")
      if (checked) {
        dispatch(setInstituteCheckedBoxes([...instituteCheckedBoxes, option]));
      } else {
        dispatch(
          setInstituteCheckedBoxes(
            instituteCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    else if (type === "cropCheckedBoxes")
      if (checked) {
        dispatch(setCropCheckedBoxes([...cropCheckedBoxes, option]));
      } else {
        dispatch(
          setCropCheckedBoxes(
            cropCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    else if (type === "genusCheckedBoxes") {
      if (checked) {
        dispatch(setGenusCheckedBoxes([...genusCheckedBoxes, option]));
      } else {
        dispatch(
          setGenusCheckedBoxes(
            genusCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    } else if (type === "genusSpeciesCheckedBoxes") {
      if (checked) {
        dispatch(
          setGenusSpeciesCheckedBoxes([...genusSpeciesCheckedBoxes, option])
        );
      } else {
        dispatch(
          setGenusSpeciesCheckedBoxes(
            genusSpeciesCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    } else if (type === "speciesCheckedBoxes") {
      if (checked) {
        dispatch(setSpeciesCheckedBoxes([...speciesCheckedBoxes, option]));
      } else {
        dispatch(
          setSpeciesCheckedBoxes(
            speciesCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    } else if (type === "originOfMaterialCheckedBoxes")
      if (checked) {
        dispatch(
          setOriginOfMaterialCheckedBoxes([
            ...originOfMaterialCheckedBoxes,
            option,
          ])
        );
      } else {
        dispatch(
          setOriginOfMaterialCheckedBoxes(
            originOfMaterialCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    else if (type === "sampStatCheckedBoxes") {
      let newCheckedBoxes = [...sampStatCheckedBoxes];

      if (hierarchy1[option]) {
        hierarchy1[option].forEach((subset) => {
          if (checked) {
            if (!newCheckedBoxes.includes(subset)) {
              newCheckedBoxes.push(subset);
            }
          } else {
            newCheckedBoxes = newCheckedBoxes.filter((item) => item !== subset);
          }
        });
      }

      if (checked) {
        if (!newCheckedBoxes.includes(option)) {
          newCheckedBoxes.push(option);
        }
      } else {
        newCheckedBoxes = newCheckedBoxes.filter((item) => item !== option);
      }

      dispatch(setSampStatCheckedBoxes(newCheckedBoxes));
    } else if (type === "germplasmStorageCheckedBoxes") {
      let newCheckedBoxes = [...germplasmStorageCheckedBoxes];

      if (hierarchy1[option]) {
        hierarchy1[option].forEach((subset) => {
          if (checked) {
            if (!newCheckedBoxes.includes(subset)) {
              newCheckedBoxes.push(subset);
            }
          } else {
            newCheckedBoxes = newCheckedBoxes.filter((item) => item !== subset);
          }
        });
      }

      if (checked) {
        if (!newCheckedBoxes.includes(option)) {
          newCheckedBoxes.push(option);
        }
      } else {
        newCheckedBoxes = newCheckedBoxes.filter((item) => item !== option);
      }

      dispatch(setGermplasmStorageCheckedBoxes(newCheckedBoxes));
    }
  };

  return (
    <div className={styles.passportFilterContainer}>
      {options && (
        <div className={styles.passportFilterSubContainer}>
          {options
            .filter((option) => option[0] !== "101")
            .sort((a, b) => {
              if (
                type === "sampStatCheckedBoxes" ||
                type === "germplasmStorageCheckedBoxes"
              ) {
                return parseInt(a[0]) - parseInt(b[0]);
              }
              return 0;
            })
            .map((option) => {
              const indentation = getIndentation(option[0]);

              return (
                <label
                  key={option[0]}
                  className={styles.formCheck}
                  style={{ marginLeft: indentation }}
                >
                  <input
                    className={styles.formCheckInput}
                    type="checkbox"
                    value={option[0]}
                    checked={
                      type === "genusCheckedBoxes"
                        ? genusCheckedBoxes.includes(option[0])
                        : type === "genusSpeciesCheckedBoxes"
                        ? genusSpeciesCheckedBoxes.includes(option[0])
                        : type === "speciesCheckedBoxes"
                        ? speciesCheckedBoxes.includes(option[0])
                        : type === "cropCheckedBoxes"
                        ? cropCheckedBoxes.includes(option[0])
                        : type === "originOfMaterialCheckedBoxes"
                        ? originOfMaterialCheckedBoxes.includes(option[0])
                        : type === "sampStatCheckedBoxes"
                        ? sampStatCheckedBoxes.includes(option[0])
                        : type === "germplasmStorageCheckedBoxes"
                        ? germplasmStorageCheckedBoxes.includes(option[0])
                        : null
                    }
                    onChange={(e) =>
                      handleCheckedBox(option[0], e.target.checked)
                    }
                  />
                  <div
                    className={styles.whiteSpace}
                    key={option[0] + "-" + option[1]}
                  >
                    {type === "sampStatCheckedBoxes"
                      ? sampStatMapping[option[0]] +
                        "                  " +
                        option[1]
                      : type === "germplasmStorageCheckedBoxes"
                      ? germplasmStorageMapping[option[0]] +
                        "                  " +
                        option[1]
                      : option[0] + "                  " + option[1]}
                  </div>
                </label>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
