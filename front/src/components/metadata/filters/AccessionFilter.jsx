import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAccessionNumbers } from "../../../redux/passport/passportActions";
import styles from "./AccessionFilter.module.css";

const AccessionFilter = () => {
  const dispatch = useDispatch();
  const reduxAccessionNumbers = useSelector(
    (state) => state.passport.accessionNumbers
  );
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(reduxAccessionNumbers.join(", "));
  }, [reduxAccessionNumbers]);

  const onChangeAccession = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const trimmedAccessions = inputValue
      .split(",")
      .map((acc) => acc.trim())
      .filter((acc) => acc !== "");
    dispatch(setAccessionNumbers(trimmedAccessions));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContents = e.target.result;
        const fileAccessions = fileContents
          .replace(/[\n\t;|]+/g, ",")
          .split(",")
          .map((acc) => acc.trim())
          .filter((acc) => acc !== "");

        dispatch(setAccessionNumbers(fileAccessions));
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
          onChange={onChangeAccession}
          onBlur={handleBlur}
          className={styles.accessionSearchBox}
          placeholder="Enter Accession Numbers separated by commas..."
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

export default AccessionFilter;
