import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setAccessionNameSearchValue,
  setAliasSearchMode,
} from "../../../redux/passport/passportActions";
import styles from "./AccessionFilter.module.css";

const aliasModes = [
  {
    key: "eq",
    label: "Exact match",
    placeholder: "Example: OSIRIS",
    help: "The complete alias must match.",
  },
  {
    key: "sw",
    label: "Starts with",
    placeholder: "Example: OSIRIS",
    help: "Matches OSIRIS, OSIRIS 1, and similar aliases.",
  },
  {
    key: "contains",
    label: "Contains",
    placeholder: "Example: SIRIS",
    help: "Matches the text anywhere; broad searches may be slower.",
  },
];

const AliasSearchFilter = () => {
  const dispatch = useDispatch();
  const aliasSearchValue = useSelector(
    (state) => state.passport.accessionNameSearchValue,
  );
  const aliasSearchMode = useSelector(
    (state) => state.passport.aliasSearchMode,
  );
  const [values, setValues] = useState({ eq: "", sw: "", contains: "" });

  useEffect(() => {
    setValues({
      eq: aliasSearchMode === "eq" ? aliasSearchValue || "" : "",
      sw: aliasSearchMode === "sw" ? aliasSearchValue || "" : "",
      contains: aliasSearchMode === "contains" ? aliasSearchValue || "" : "",
    });
  }, [aliasSearchMode, aliasSearchValue]);

  const activeMode = useMemo(
    () => aliasModes.find(({ key }) => values[key].length > 0)?.key || null,
    [values],
  );

  const commitValue = (mode) => {
    const normalized = values[mode].trim();

    if (!normalized) {
      if (aliasSearchMode === mode && aliasSearchValue) {
        dispatch(setAccessionNameSearchValue(""));
      }
      return;
    }

    if (aliasSearchMode !== mode) {
      dispatch(setAliasSearchMode(mode));
    }
    if (aliasSearchValue !== normalized) {
      dispatch(setAccessionNameSearchValue(normalized));
    }
  };

  return (
    <div className={styles.aliasSearchFields}>
      {aliasModes.map(({ key, label, placeholder, help }) => (
        <label key={key} className={styles.aliasSearchField}>
          <span>{label}</span>
          <input
            type="text"
            value={values[key]}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [key]: event.target.value,
              }))
            }
            onBlur={() => commitValue(key)}
            disabled={activeMode !== null && activeMode !== key}
            className={styles.accessionSearchBox}
            placeholder={placeholder}
            aria-label={`Alias search: ${label}`}
          />
          <small>{help}</small>
        </label>
      ))}
    </div>
  );
};

export default AliasSearchFilter;
