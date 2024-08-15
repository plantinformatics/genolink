import { useSelector } from "react-redux";
import {
  setInstituteCheckedBoxes,
  setCropCheckedBoxes,
  setTaxonomyCheckedBoxes,
  setOriginOfMaterialCheckedBoxes,
} from "../../../actions";
import { useDispatch } from "react-redux";

const MultiSelectFilter = ({ options, type }) => {
  const dispatch = useDispatch();
  const instituteCheckedBoxes = useSelector(
    (state) => state.instituteCheckedBoxes
  );
  const cropCheckedBoxes = useSelector((state) => state.cropCheckedBoxes);
  const taxonomyCheckedBoxes = useSelector(
    (state) => state.taxonomyCheckedBoxes
  );
  const originOfMaterialCheckedBoxes = useSelector(
    (state) => state.originOfMaterialCheckedBoxes
  );

  const handleCheckedBox = (option, checked) => {
    if (type === "institueCheckedBoxes")
      if (checked) {
        dispatch(setInstituteCheckedBoxes([...instituteCheckedBoxes, option]));
      } else {
        dispatch(
          setInstituteCheckedBoxes(
            instituteCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    else if (type === "cropCheckedBoxes")
      if (checked) {
        dispatch(setCropCheckedBoxes([...cropCheckedBoxes, option]));
      } else {
        dispatch(
          setCropCheckedBoxes(
            cropCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    else if (type === "taxonomyCheckedBoxes")
      if (checked) {
        dispatch(setTaxonomyCheckedBoxes([...taxonomyCheckedBoxes, option]));
      } else {
        dispatch(
          setTaxonomyCheckedBoxes(
            taxonomyCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
    else if (type === "originOfMaterialCheckedBoxes")
      if (checked) {
        dispatch(
          setOriginOfMaterialCheckedBoxes([
            ...originOfMaterialCheckedBoxes,
            option,
          ])
        );
      } else {
        dispatch(
          setOriginOfMaterialCheckedBoxes(
            originOfMaterialCheckedBoxes.filter((item) => item !== option)
          )
        );
      }
  };

  return (
    <div className="container-fluid mt-2">
      {options && (
        <div className="d-flex flex-column">
          {options.map((option) => (
            <label key={option[0]} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                value={option[0]}
                checked={
                  type === "institueCheckedBoxes"
                    ? instituteCheckedBoxes.includes(option[0])
                    : type === "cropCheckedBoxes"
                    ? cropCheckedBoxes.includes(option[0])
                    : type === "taxonomyCheckedBoxes"
                    ? taxonomyCheckedBoxes.includes(option[0])
                    : type === "originOfMaterialCheckedBoxes"
                    ? originOfMaterialCheckedBoxes.includes(option[0])
                    : null
                }
                onChange={(e) => handleCheckedBox(option[0], e.target.checked)}
              />
              {
                <div
                  style={{ whiteSpace: "pre" }}
                  key={option[0] + "-" + option[1]}
                >
                  {option[0] + "                  " + option[1]}
                </div>
              }
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
