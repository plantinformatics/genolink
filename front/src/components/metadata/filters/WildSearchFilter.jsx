import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setWildSearchValue } from "../../../redux/passport/passportActions";
import styles from "./AccessionFilter.module.css";

const WildSearchFilter = () => {
  const dispatch = useDispatch();
  const wildSearchValue = useSelector(
    (state) => state.passport.wildSearchValue
  );
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(wildSearchValue || "");
  }, [wildSearchValue]);

  const onChangeAccession = (e) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const raw = (inputValue || "").trim();

    if (!raw) {
      if ((wildSearchValue || "") !== "") {
        dispatch(setWildSearchValue(""));
      }
      return;
    }

    // Split on commas that are OUTSIDE quotes
    const hasCommaOutsideQuotes = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/.test(raw);
    if (!hasCommaOutsideQuotes) {
      // No comma to normalize → keep exactly what the user typed
      if (raw !== (wildSearchValue || "")) {
        dispatch(setWildSearchValue(raw));
      }
      return;
    }

    // Actually split on commas outside quotes
    const parts = raw.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);

    const normalized = parts
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" | ");

    if (normalized !== (wildSearchValue || "")) {
      dispatch(setWildSearchValue(normalized));
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
          placeholder="Wild Search"
        />
      </div>
    </>
  );
};

export default WildSearchFilter;
