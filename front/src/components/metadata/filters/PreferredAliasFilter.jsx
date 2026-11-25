import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPreferredAliases } from "../../../redux/passport/passportActions";
import styles from "./GenotypeIdFilter.module.css";

const parsePreferredAliases = (value) =>
  value
    .replace(/[\n\t;|]+/g, ",")
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);

const PreferredAliasFilter = () => {
  const dispatch = useDispatch();
  const preferredAliases = useSelector(
    (state) => state.passport.preferredAliases,
  );
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(preferredAliases.join(", "));
  }, [preferredAliases]);

  const saveInput = () => {
    dispatch(setPreferredAliases(parsePreferredAliases(inputValue)));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      dispatch(setPreferredAliases(parsePreferredAliases(loadEvent.target.result)));
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onBlur={saveInput}
          className={styles.genotypeIdSearchBox}
          placeholder="Enter preferred aliases separated by commas..."
        />
      </div>
      <div>
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".txt"
          className={styles.inputFile}
        />
      </div>
    </>
  );
};

export default PreferredAliasFilter;
