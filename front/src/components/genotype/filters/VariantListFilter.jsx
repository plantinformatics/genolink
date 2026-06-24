import { useState } from "react";
import { useDispatch } from "react-redux";

import { setVariantList } from "../../../redux/genotype/genotypeActions";
import styles from "./VariantListFilter.module.css";

const parseVariantList = (rawValue) =>
  rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const VariantListFilter = ({
  value,
  onVariantListChange,
  id = "variantIds",
  disabled = false,
  placeholder = "Enter variants, separated by commas",
}) => {
  const dispatch = useDispatch();

  const [internalValue, setInternalValue] = useState("");

  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const handleInputChange = (event) => {
    const rawValue = event.target.value;
    const variants = parseVariantList(rawValue);

    if (!isControlled) {
      setInternalValue(rawValue);
    }

    /*
     * Separate-server mode:
     * GenotypeExplorer controls the value for the individual server.
     */
    if (typeof onVariantListChange === "function") {
      onVariantListChange({
        rawValue,
        variants,
      });

      return;
    }

    /*
     * Existing combined-server mode:
     * Continue storing the list in Redux.
     */
    dispatch(setVariantList(variants));
  };

  return (
    <input
      id={id}
      type="text"
      className={`${styles.formControl} ${styles.variantInput}`}
      value={inputValue ?? ""}
      onChange={handleInputChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

export default VariantListFilter;