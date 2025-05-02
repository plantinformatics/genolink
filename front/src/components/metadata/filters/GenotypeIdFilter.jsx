import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setGenotypeIds } from "../../../actions";

const GenotypeIdFilter = () => {
  const dispatch = useDispatch();
  const reduxGenotypeIds = useSelector((state) => state.genotypeIds);
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
          style={{ width: "500px", padding: "8px", marginLeft: "150px" }}
          placeholder="Enter GenotypeIds separated by commas..."
        />
      </div>
      <div>
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".txt"
          style={{ padding: "4px", width: "250px" }}
        />
      </div>
    </>
  );
};

export default GenotypeIdFilter;
