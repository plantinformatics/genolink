import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";



const LinkageGroupFilter = ({
  selectedGroups,
  setSelectedGroups,
  selectedStudyDbId,
  genolinkGigwaApi,
  genolinkGerminateApi,
}) => {
  const [linkageGroups, setLinkageGroups] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const buttonClickedRef = useRef(false);
  const platform = useSelector((state) => state.platform);
  const [showFileInput, setShowFileInput] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (platform === "Gigwa") {
          const groups = await genolinkGigwaApi.fetchGigwaLinkageGroups(
            selectedStudyDbId
          );
          setLinkageGroups(groups);
        } else if (platform === "Germinate") {
          const groups = await genolinkGerminateApi.fetchGerminateLinkageGroups(username, password);
          setLinkageGroups(groups);
        }
      } catch (error) {
        console.error("Error fetching linkage groups:", error);
      }
    };

    fetchData();
  }, [platform, selectedStudyDbId]);

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
                  {group}
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
