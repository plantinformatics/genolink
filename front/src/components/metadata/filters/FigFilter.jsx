import { useDispatch, useSelector } from "react-redux";
import { setSelectedFig } from "../../../redux/passport/passportActions";

const FigFilter = () => {
  const dispatch = useDispatch();
  const reduxFigs = useSelector((state) => state.passport.figs);
  const selectedFig = useSelector((state) => state.passport.selectedFig);

  const handleFigChange = (e) => {
    dispatch(setSelectedFig(e.target.value));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "40px",
      }}
    >
      {reduxFigs.length === 0 ? (
        <p>No figs available.</p>
      ) : (
        reduxFigs.map((fig, index) => (
          <label
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
            }}
          >
            <input
              type="radio"
              name="figOption"
              value={fig}
              checked={selectedFig === fig}
              onChange={handleFigChange}
              style={{
                marginRight: "8px",
              }}
            />
            {fig}
          </label>
        ))
      )}
    </div>
  );
};

export default FigFilter;
