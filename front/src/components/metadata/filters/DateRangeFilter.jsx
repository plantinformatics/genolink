import { useState } from "react";
import {
  setCreationStartDate,
  setCreationEndDate,
} from "../../../redux/passport/passportActions";
import { useDispatch } from "react-redux";

const DateRangeFilter = ({ type }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const dispatch = useDispatch();

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    const dateValue = `${e.target.value}T00:00:00Z`;
    if (type === "start") dispatch(setCreationStartDate(dateValue));
    if (type === "end") dispatch(setCreationEndDate(dateValue));
  };

  return (
    <div>
      <div>
        <div>
          <label htmlFor="dateInput">Creation {type} date:</label>
          <input
            type="date"
            id="dateInput"
            className="form-control"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
