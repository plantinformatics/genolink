import { useState } from "react";

const VariantListFilter = ({ setVariantList }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const variantArray = newValue.split(",").map((item) => item.trim());

    setVariantList(variantArray.filter((item) => item)); 
  };

  return (
    <div className="variant-list-filter">
      <br/>
      <label htmlFor="variantIds" className="form-label" >Variant IDs:</label>
      <input
        id="variantIds"
        type="text"
        className="form-control"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter variants, separated by commas"
        style={{width:"282px"}}
      />
    </div>
  );
};

export default VariantListFilter;
