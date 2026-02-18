import { useState } from "react";

const fieldsMapping = {
  "Institute Code": { apiParam: "instituteCode", tsvHeader: "Institute Code" },
  "Holding Institute": {
    apiParam: "institute.fullName",
    tsvHeader: "Holding Institute",
  },
  "Accession Number": {
    apiParam: "accessionNumber",
    tsvHeader: "Accession Number",
  },
  "Accession Name": { apiParam: "accessionName", tsvHeader: "Accession Name" },
  Aliases: { apiParam: "aliases", tsvHeader: "Aliases" },
  Remarks: { apiParam: "remarks.remark", tsvHeader: "Remarks" },
  Taxonomy: { apiParam: "taxonomy.taxonName", tsvHeader: "Taxonomy" },
  "Crop Name": { apiParam: "cropName", tsvHeader: "Crop Name" },
  Genus: { apiParam: "taxonomy.genus", tsvHeader: "Genus" },
  Species: { apiParam: "taxonomy.species", tsvHeader: "Species" },
  "Biological status of accession": {
    apiParam: "sampStat",
    tsvHeader: "Biological status of accession",
  },
  "Donor Institute": {
    apiParam: "donorCombined",
    tsvHeader: "Donor Institute",
  },
  "Provenance of Material": {
    apiParam: "countryOfOrigin.name",
    tsvHeader: "Provenance of Material",
  },
  Region: { apiParam: "region", tsvHeader: "Region" },
  "Sub-Region": { apiParam: "sub-region", tsvHeader: "Sub-Region" },
  "Acquisition Date": {
    apiParam: "acquisitionDate",
    tsvHeader: "Acquisition Date",
  },
  DOI: { apiParam: "doi", tsvHeader: "DOI" },
  "Last Updated": { apiParam: "lastModifiedDate", tsvHeader: "Last Updated" },
  "Genotype Status": { apiParam: "status", tsvHeader: "Genotype Status" },
  GenotypeID: { apiParam: "GenotypeID", tsvHeader: "GenotypeID" },
  "FIGs Set": { apiParam: "figsSet", tsvHeader: "FIGs Set" },
  "Country Code": {
    apiParam: "countryOfOrigin.codeNum",
    tsvHeader: "Country Code",
  },
};

const ExportFieldsModal = ({ isVisible, onClose, onExport }) => {
  const [selectedMappings, setSelectedMappings] = useState({
    "Accession Number": fieldsMapping["Accession Number"],
    "Country Code": fieldsMapping["Country Code"],
  });

  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAllChange = () => {
    if (!selectAll) {
      const allFields = Object.keys(fieldsMapping)
        .filter(
          (field) => field !== "Accession Number" && field !== "Country Code",
        )
        .reduce((acc, field) => {
          acc[field] = fieldsMapping[field];
          return acc;
        }, {});
      setSelectedMappings((prevState) => ({
        "Accession Number": fieldsMapping["Accession Number"],
        "Country Code": fieldsMapping["Country Code"],
        ...allFields,
      }));
    } else {
      setSelectedMappings({
        "Accession Number": fieldsMapping["Accession Number"],
        "Country Code": fieldsMapping["Country Code"],
      });
    }
    setSelectAll(!selectAll);
  };

  const handleCheckboxChange = (event) => {
    const field = event.target.value;
    const fieldMapping = fieldsMapping[field];

    setSelectedMappings((prevSelected) => {
      if (prevSelected[field]) {
        const updatedMappings = { ...prevSelected };
        delete updatedMappings[field];
        return updatedMappings;
      } else {
        return { ...prevSelected, [field]: fieldMapping };
      }
    });
  };

  const handleExportClick = () => {
    if (Object.keys(selectedMappings).length === 0) {
      alert("Please select at least one field.");
    } else {
      onExport(selectedMappings);
      onClose();
    }
  };

  return (
    isVisible && (
      <div className="modal">
        <div className="modal-content">
          <h3>Select Fields to Export</h3>
          <div>
            <label>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAllChange}
              />
              Select All
            </label>
          </div>
          {Object.keys(fieldsMapping).map((field) => {
            if (field === "Accession Number" || field === "Country Code")
              return null;

            return (
              <div key={field}>
                <label>
                  <input
                    type="checkbox"
                    value={field}
                    checked={selectedMappings[field] !== undefined}
                    onChange={handleCheckboxChange}
                  />
                  {fieldsMapping[field].tsvHeader}
                </label>
              </div>
            );
          })}
          <button onClick={handleExportClick}>Download</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    )
  );
};

export default ExportFieldsModal;
