import { useDispatch, useSelector } from "react-redux";
import { setSelectedFig } from "../../../redux/passport/passportActions";
import styles from "./FigFilter.module.css";

const FigFilter = () => {
  const dispatch = useDispatch();
  const reduxFigs = useSelector((state) => state.passport.figs);
  const selectedFig = useSelector((state) => state.passport.selectedFig);

  const handleClick = (fig) => {
    if (selectedFig === fig) {
      dispatch(setSelectedFig("")); // unselect
    }
  };

  const handleChange = (e) => {
    dispatch(setSelectedFig(e.target.value));
  };

  return (
    <div className={styles.figRadioGroup}>
      {reduxFigs.length === 0 ? (
        <p>No figs available.</p>
      ) : (
        reduxFigs.map((fig, index) => (
          <label key={index} className={styles.figRadioLabel}>
            <input
              type="radio"
              name="figOption"
              value={fig}
              checked={selectedFig === fig}
              onChange={handleChange}
              onClick={() => handleClick(fig)}
              className={styles.figRadioInput}
            />
            {fig}
          </label>
        ))
      )}
    </div>
  );
};

export default FigFilter;
