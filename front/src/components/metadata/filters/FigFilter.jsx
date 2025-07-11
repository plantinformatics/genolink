import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFigs } from "../../../redux/passport/passportActions";

const FigFilter = () => {
  const dispatch = useDispatch();
  const reduxFigs = useSelector((state) => state.passport.figs);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(reduxFigs.join(", "));
  }, [reduxFigs]);

  const onChangeFig = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const trimmedFigs = inputValue
      .split(",")
      .map((fig) => fig.trim())
      .filter((fig) => fig !== "");
    dispatch(setFigs(trimmedFigs));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContents = e.target.result;
        const fileFigs = fileContents
          .replace(/[\n\t;|]+/g, ",")
          .split(",")
          .map((fig) => fig.trim())
          .filter((fig) => fig !== "");

        dispatch(setFigs(fileFigs));
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
          onChange={onChangeFig}
          onBlur={handleBlur}
          style={{ width: "500px", padding: "8px", marginLeft: "150px" }}
          placeholder="Enter Figs separated by commas..."
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

export default FigFilter;
