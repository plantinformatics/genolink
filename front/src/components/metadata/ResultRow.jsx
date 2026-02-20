import React from "react";
import { useSelector, shallowEqual } from "react-redux";
import { genesysServer } from "../../config/apiConfig";

import { germplasmStorageMapping } from "../metadata/filters/MultiSelectFilter";

const ResultRow = React.memo(function ResultRow({
  item,
  index,
  isExpanded,
  onToggleCheckbox,
  onRowClick,
  status,
  genotypeID,
  figsForAcc,
  formatDate,
  getSampleStatus,
  countryByCode,
}) {
  // Subscribe ONLY to this accession’s checked flag
  const checked = useSelector(
    (s) => !!s.passport.checkedAccessions[item.accessionNumber],
    shallowEqual
  );

  return (
    <tr
      key={item.uuid || item.id || index}
      style={{ backgroundColor: "white", cursor: "pointer" }}
      onClick={() => onRowClick(index)}
    >
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
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
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {index + 1}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item.instituteCode || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item["institute.fullName"] ? item["institute.fullName"] : "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        <a
          href={`${genesysServer.replace("//api.", "//")}/a/${item.uuid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.accessionNumber || "N/A"}
        </a>
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item.accessionName || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item.aliases && item.aliases.length > 1
          ? item.aliases
              .filter((alias) => alias.aliasType !== "ACCENAME")
              .map(
                (alias) =>
                  `${alias.name}${alias.usedBy ? ` ${alias.usedBy}` : ""}`
              )
              .join(", ")
          : "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item["remarks.remark"] || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item["taxonomy.taxonName"] || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item.cropName || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item["taxonomy.genus"] || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item["taxonomy.species"] || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item["storage"]
          ? item["storage"]
              .toString()
              .match(/.{1,2}/g)
              ?.map((code) => germplasmStorageMapping[parseInt(code)])
              .filter(Boolean)
              .join(", ") || "N/A"
          : "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {getSampleStatus(item.sampStat) || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item.donorName && item.donorCode
          ? `${item.donorName}, ${item.donorCode}`
          : item.donorName
          ? item.donorName
          : item.donorCode || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item["countryOfOrigin.name"] || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {countryByCode.get(String(item["countryOfOrigin.codeNum"]))?.region ||
          "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {countryByCode.get(String(item["countryOfOrigin.codeNum"]))
          ?.subRegion || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {formatDate(item.acquisitionDate)}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item.doi || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {item.lastModifiedDate || "N/A"}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {status}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {genotypeID}
      </td>
      <td
        className="cell"
        style={{
          overflow: isExpanded ? "visible" : "hidden",
          whiteSpace: isExpanded ? "normal" : "nowrap",
        }}
      >
        {figsForAcc?.length > 0 ? figsForAcc.join(", ") : "N/A"}
      </td>
    </tr>
  );
});

export default ResultRow;
