import { useDispatch, useSelector } from "react-redux";
import { setHistoricalAccessionsCheckedBoxes } from "../../../redux/passport/passportActions";
import styles from "./MultiSelectFilter.module.css";

export const historicalSelectionsToRequestValue = (selections) => {
  if (selections.includes("true") && selections.includes("false")) return null;
  return selections.includes("true");
};

const HistoricalAccessionsFilter = ({ options = [] }) => {
  const dispatch = useDispatch();
  const checked = useSelector(
    (state) => state.passport.historicalAccessionsCheckedBoxes,
  );
  const counts = new Map(options.map(([value, count]) => [String(value), count]));

  const toggle = (value, isChecked) => {
    if (!isChecked && checked.length === 1 && checked[0] === value) return;

    dispatch(
      setHistoricalAccessionsCheckedBoxes(
        isChecked
          ? [...new Set([...checked, value])]
          : checked.filter((item) => item !== value),
      ),
    );
  };

  return (
    <div className={styles.passportFilterContainer}>
      <div className={styles.passportFilterSubContainer}>
        {[
          ["true", "Yes"],
          ["false", "No"],
        ].map(([value, label]) => (
          <label key={value} className={styles.formCheck}>
            <input
              className={styles.formCheckInput}
              type="checkbox"
              checked={checked.includes(value)}
              onChange={(event) => toggle(value, event.target.checked)}
            />
            <div className={styles.whiteSpace}>
              {label}
              {counts.has(value) ? `                  ${counts.get(value)}` : ""}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default HistoricalAccessionsFilter;
