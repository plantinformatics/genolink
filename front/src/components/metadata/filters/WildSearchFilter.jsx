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
    const v = (inputValue || "").trim();
    if (v !== (wildSearchValue || "")) dispatch(setWildSearchValue(v));
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
