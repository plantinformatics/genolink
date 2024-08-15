import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { fetchGigwaLinkageGroups } from "../../../api/genolinkGigwaApi";
import { fetchGerminateLinkageGroups } from "../../../api/genolinkGerminateApi";

const LinkageGroupFilter = ({
  selectedGroups,
  setSelectedGroups,
  selectedDataset,
  username,
  password,
}) => {
  const [linkageGroups, setLinkageGroups] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const buttonClickedRef = useRef(false);
  const platform = useSelector((state) => state.platform);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (platform === "Gigwa") {
          const groups = await fetchGigwaLinkageGroups(
            username,
            password,
            selectedDataset
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
  }, [platform, username, password, selectedDataset]);

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

  return (
    <div className="linkage-group-filter">
      <button className="button-primary" onClick={toggleDrawer}>
        Chromosomes
      </button>
      {isDrawerOpen && (
        <div ref={drawerRef} className="card mt-1">
          <div className="card-body">
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
