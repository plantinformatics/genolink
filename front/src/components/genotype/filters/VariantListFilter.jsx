import { useState } from "react";

const VariantListFilter = ({ setVariantList }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Split the input string by commas and trim whitespace
    const variantArray = newValue.split(",").map((item) => item.trim());

    // Update the variantList in the parent component
    setVariantList(variantArray.filter((item) => item)); // Filter out empty strings
  };

  return (
    <div className="variant-list-filter">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter variants, separated by commas"
      />
    </div>
  );
};

export default VariantListFilter;
