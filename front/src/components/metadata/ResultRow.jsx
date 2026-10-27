import React from "react";
import { useSelector, shallowEqual } from "react-redux";
import { renderMetadataCell } from "./MetadataColumns";
import styles from "./MetadataSearchResultTable.module.css";

const ResultRow = React.memo(function ResultRow({
  item,
  index,
  isExpanded,
  onToggleCheckbox,
  onRowClick,
  visibleColumnIds,
  status,
  genotypeID,
  datasetInfoForAcc,
  datasetInfoLoading,
  preferredAlias,
  preferredAliasLoading,
  formatDate,
  countryByCode,
}) {
  const checked = useSelector(
    (s) => !!s.passport.checkedAccessions[item.accessionNumber],
    shallowEqual,
  );

  const ctx = {
    status,
    genotypeID,
    datasetInfoForAcc,
    datasetInfoLoading,
    preferredAlias,
    preferredAliasLoading,
    formatDate,
    countryByCode,
  };

  const cellClassName = `cell ${styles.metadataCell}${
    isExpanded ? ` ${styles.expandedCell}` : ""
  }`;

  return (
    <tr
      key={item.uuid || item.id || index}
      style={{ backgroundColor: "white", cursor: "pointer" }}
      onClick={() => onRowClick(index)}
    >
      <td className={cellClassName}>
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

      <td className={cellClassName}>
        {index + 1}
      </td>

      {visibleColumnIds.map((colId) => (
        <td key={colId} className={cellClassName}>
          {renderMetadataCell(colId, item, ctx)}
      </td>
      ))}
    </tr>
  );
});

export default ResultRow;
