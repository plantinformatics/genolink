import { useState } from "react";
import {
  setCreationStartDate,
  setCreationEndDate,
  setAcquisitionStartDate,
  setAcquisitionEndDate,
} from "../../../redux/passport/passportActions";
import { useDispatch } from "react-redux";
import styles from "./DateRangeFilter.module.css";

const DateRangeFilter = ({ type }) => {
  const [selectedDate, setSelectedDate] = useState("");
  const dispatch = useDispatch();

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    if (type === "Creation Start Date" || type === "Creation End Date") {
      const dateValue = `${e.target.value}T00:00:00Z`;
      if (type === "Creation Start Date")
        dispatch(setCreationStartDate(dateValue));
      if (type === "Creation End Date") dispatch(setCreationEndDate(dateValue));
    } else if (
      type === "Acquisition Start Date" ||
      type === "Acquisition End Date"
    ) {
      const dateValue = e.target.value.replaceAll("-", "");
      if (type === "Acquisition Start Date")
        dispatch(setAcquisitionStartDate(dateValue));
      if (type === "Acquisition End Date")
        dispatch(setAcquisitionEndDate(dateValue));
    }
  };

  return (
    <div>
      <div>
        <div>
          <label htmlFor="dateInput">{type}:</label>
          <input
            type="date"
            id="dateInput"
            className={styles.formControl}
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
