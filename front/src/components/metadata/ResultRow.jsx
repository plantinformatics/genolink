import React from "react";
import { useSelector, shallowEqual } from "react-redux";
import { renderMetadataCell } from "./MetadataColumns";

const ResultRow = React.memo(function ResultRow({
  item,
  index,
  isExpanded,
  onToggleCheckbox,
  onRowClick,
  visibleColumnIds,
  status,
  genotypeID,
  figsForAcc,
  formatDate,
  getSampleStatus,
  countryByCode,
}) {
  const checked = useSelector(
    (s) => !!s.passport.checkedAccessions[item.accessionNumber],
    shallowEqual,
  );

  const cellStyle = {
    overflow: isExpanded ? "visible" : "hidden",
    whiteSpace: isExpanded ? "normal" : "nowrap",
    textOverflow: isExpanded ? "clip" : "ellipsis",
  };

  const ctx = {
    status,
    genotypeID,
    figsForAcc,
    formatDate,
    getSampleStatus,
    countryByCode,
  };

  return (
    <tr
      key={item.uuid || item.id || index}
      style={{ backgroundColor: "white", cursor: "pointer" }}
      onClick={() => onRowClick(index)}
    >
      <td className="cell" style={cellStyle}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCheckbox(item, checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      <td className="cell" style={cellStyle}>
        {index + 1}
      </td>

      {visibleColumnIds.map((colId) => (
        <td key={colId} className="cell" style={cellStyle}>
          {renderMetadataCell(colId, item, ctx)}
      </td>
      ))}
    </tr>
  );
});

export default ResultRow;
