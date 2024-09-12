import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { fetchGigwaLinkageGroups } from "../../../api/genolinkGigwaApi";
import { fetchGerminateLinkageGroups } from "../../../api/genolinkGerminateApi";

const LinkageGroupFilter = ({
  selectedGroups,
  setSelectedGroups,
  selectedStudyDbId,
  username,
  password,
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
          const groups = await fetchGigwaLinkageGroups(
            username,
            password,
            selectedStudyDbId
          );
          setLinkageGroups(groups);
        } else if (platform === "Germinate") {
          const groups = await fetchGerminateLinkageGroups(username, password);
          setLinkageGroups(groups);
        }
      } catch (error) {
        console.error("Error fetching linkage groups:", error);
      }
    };

    fetchData();
  }, [platform, username, password, selectedStudyDbId]);

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
    <div className="linkage-group-filter">
      <button onClick={handleButtonClick} style={{
        display: "inline-block", width: "280px", height:"38px", textAlign: "left", position: "relative", border: "2px solid #ebba35", margin: "15px 0 5px 0", backgroundColor: "beige"
      }}>
        Chromosomes <span style={{ float: "right" }}>{showFileInput ? "\u25B2" : "\u25BC"}</span>
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
