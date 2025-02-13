import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";



const LinkageGroupFilter = ({
  selectedGroups,
  setSelectedGroups,
  selectedStudyDbId,
  genolinkGigwaApi,
  genolinkGerminateApi,
  germinateUsername,
  germinatePassword
}) => {
  const [linkageGroups, setLinkageGroups] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const buttonClickedRef = useRef(false);
  const platform = useSelector((state) => state.platform);
  const [showFileInput, setShowFileInput] = useState(false);

  const checkedAccessionsObject = useSelector(
    (state) => state.checkedAccessions
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (platform === "Gigwa") {
          const groups = await genolinkGigwaApi.fetchGigwaLinkageGroups(
            selectedStudyDbId
          );
          setLinkageGroups(groups);
        } else if (platform === "Germinate") {
          const accession = Object.keys(checkedAccessionsObject)[0];
          const groups = await genolinkGerminateApi.fetchGerminateLinkageGroups(germinateUsername, germinatePassword, accession);
          setLinkageGroups(groups);
        }
      } catch (error) {
        console.error("Error fetching linkage groups:", error);
      }
    };

    fetchData();
  }, [platform, selectedStudyDbId]);

  const CHROMConverter = (CHROM) => {
    const mapping = {
      1: "chr1A",
      2: "chr1B",
      3: "chr1D",
      4: "chr2A",
      5: "chr2B",
      6: "chr2D",
      7: "chr3A",
      8: "chr3B",
      9: "chr3D",
      10: "chr4A",
      11: "chr4B",
      12: "chr4D",
      13: "chr5A",
      14: "chr5B",
      15: "chr5D",
      16: "chr6A",
      17: "chr6B",
      18: "chr6D",
      19: "chr7A",
      20: "chr7B",
      21: "chr7D",
    };
    return mapping[CHROM] || null;
  };

  const handleInputChange = (groupName) => {
    setSelectedGroups((prevSelectedGroups) =>
      prevSelectedGroups.includes(groupName)
        ? prevSelectedGroups.filter((group) => group !== groupName)
        : [...prevSelectedGroups, groupName]
    );
  };

  const toggleDrawer = () => {
    buttonClickedRef.current = true;
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleButtonClick = () => {
    toggleDrawer();
    setShowFileInput(!showFileInput);
  };

  return (
    <div>
      <button onClick={handleButtonClick} className="select-style-button">
        Chromosomes <span style={{ float: "right", marginLeft: "6.5px" }}>{"\u2304"}</span>
      </button>
      {isDrawerOpen && (
        <div ref={drawerRef} >
          <div>
            {linkageGroups.map((group) => (
              <div key={group} className="form-check">
                <input
                  className="form-check-input"
                  type={platform === "Germinate" ? "radio" : "checkbox"}
                  id={group}
                  name="linkageGroup"
                  value={group}
                  checked={selectedGroups.includes(group)}
                  onChange={() => handleInputChange(group)}
                />
                <label className="form-check-label" htmlFor={group}>
                {platform === "Germinate" ? CHROMConverter(group) : group}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkageGroupFilter;
