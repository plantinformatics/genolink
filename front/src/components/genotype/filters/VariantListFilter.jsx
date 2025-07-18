import { useState } from "react";
import { setVariantList } from "../../../redux/genotype/genotypeActions";
import { useDispatch } from "react-redux";
import styles from "./VariantListFilter.module.css";

const VariantListFilter = () => {
  const [inputValue, setInputValue] = useState("");

  const dispatch = useDispatch();
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const variantArray = newValue.split(",").map((item) => item.trim());

    dispatch(setVariantList(variantArray.filter((item) => item)));
  };

  return (
    <input
      id="variantIds"
      type="text"
      className={`${styles.formControl} ${styles.variantInput}`}
      value={inputValue}
      onChange={handleInputChange}
      placeholder="Enter variants, separated by commas"
    />
  );
};

export default VariantListFilter;
