import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setGenotypeIds } from "../../../redux/passport/passportActions";
import styles from "./GenotypeIdFilter.module.css";

const GenotypeIdFilter = () => {
  const dispatch = useDispatch();
  const reduxGenotypeIds = useSelector((state) => state.passport.genotypeIds);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(reduxGenotypeIds.join(", "));
  }, [reduxGenotypeIds]);

  const onChangeGenotypeId = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const trimmedGenotypeIds = inputValue
      .split(",")
      .map((acc) => acc.trim())
      .filter((acc) => acc !== "");
    dispatch(setGenotypeIds(trimmedGenotypeIds));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContents = e.target.result;
        const fileGenotypeIds = fileContents
          .replace(/[\n\t;|]+/g, ",")
          .split(",")
          .map((acc) => acc.trim())
          .filter((acc) => acc !== "");

        dispatch(setGenotypeIds(fileGenotypeIds));
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={onChangeGenotypeId}
          onBlur={handleBlur}
          className={styles.genotypeIdSearchBox}
          placeholder="Enter GenotypeIds separated by commas..."
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

export default GenotypeIdFilter;
