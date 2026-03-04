import { genesysServer } from "../../config/apiConfig";
import { germplasmStorageMapping } from "./filters/MultiSelectFilter";

export const METADATA_FIELDS_STORAGE_KEY =
  "genolink.metadata.selectedFields.v1";

/**
 * Columns user can show/hide.
 * apiParams are the Genesys select fields required to render the column.
 * If apiParams is [], it means "computed locally", no Genesys select needed.
 */
export const METADATA_COLUMNS = [
  {
    id: "instituteCode",
    label: "Institute Code",
    apiParams: ["instituteCode"],
  },
  {
    id: "holdingInstitute",
    label: "Holding Institute",
    apiParams: ["institute.fullName"],
  },
  {
    id: "accessionNumber",
    label: "Accession Number",
    apiParams: ["accessionNumber", "uuid"],
  },
  {
    id: "accessionName",
    label: "Accession Name",
    apiParams: ["accessionName"],
  },
  { id: "aliases", label: "Aliases", apiParams: ["aliases"] },
  { id: "remarks", label: "Remarks", apiParams: ["remarks.remark"] },
  { id: "taxonomy", label: "Taxonomy", apiParams: ["taxonomy.taxonName"] },
  { id: "cropName", label: "Crop Name", apiParams: ["cropName"] },
  { id: "genus", label: "Genus", apiParams: ["taxonomy.genus"] },
  { id: "species", label: "Species", apiParams: ["taxonomy.species"] },
  { id: "storage", label: "Type of germplasm storage", apiParams: ["storage"] },
  {
    id: "sampStat",
    label: "Biological status of accession",
    apiParams: ["sampStat"],
  },
  {
    id: "donorInstitute",
    label: "Donor Institute",
    apiParams: ["donorName", "donorCode"],
  },
  {
    id: "provenance",
    label: "Provenance of Material",
    apiParams: ["countryOfOrigin.name"],
  },
  { id: "region", label: "Region", apiParams: ["countryOfOrigin.codeNum"] },
  {
    id: "subRegion",
    label: "Sub-Region",
    apiParams: ["countryOfOrigin.codeNum"],
  },
  {
    id: "acquisitionDate",
    label: "Acquisition Date",
    apiParams: ["acquisitionDate"],
  },
  { id: "doi", label: "DOI", apiParams: ["doi"] },
  {
    id: "available",
    label: "Available for Distribution",
    apiParams: ["available"],
  },
  { id: "curationType", label: "Curation Type", apiParams: ["curationType"] },
  { id: "lastUpdated", label: "Last Updated", apiParams: ["lastModifiedDate"] },

  // computed / local-only (no Genesys select needed)
  { id: "genotypeStatus", label: "Genotype Status", apiParams: [] },
  { id: "genotypeId", label: "GenotypeID", apiParams: [] },
  { id: "figsSet", label: "FIGS set", apiParams: [] },
];

// Always fetched (even if user hides those columns)
export const REQUIRED_GENESYS_SELECT_FIELDS = [
  "uuid",
  "accessionNumber",
  "accessionName",
];

// Default = all columns
export const DEFAULT_SELECTED_METADATA_COLUMNS = METADATA_COLUMNS.map(
  (c) => c.id,
);

export function sanitizeSelectedColumns(selectedIds) {
  const allowed = new Set(METADATA_COLUMNS.map((c) => c.id));
  const ids = Array.isArray(selectedIds)
    ? selectedIds.filter((id) => allowed.has(id))
    : [];
  return ids.length > 0 ? ids : DEFAULT_SELECTED_METADATA_COLUMNS;
}

export function loadSelectedColumnsFromStorage() {
  try {
    const raw = localStorage.getItem(METADATA_FIELDS_STORAGE_KEY);
    if (!raw) return DEFAULT_SELECTED_METADATA_COLUMNS;
    const parsed = JSON.parse(raw);
    return sanitizeSelectedColumns(parsed);
  } catch {
    return DEFAULT_SELECTED_METADATA_COLUMNS;
  }
}

export function saveSelectedColumnsToStorage(selectedIds) {
  localStorage.setItem(
    METADATA_FIELDS_STORAGE_KEY,
    JSON.stringify(selectedIds),
  );
}

/**
 * Build Genesys select string from selected column IDs.
 * Always includes REQUIRED_GENESYS_SELECT_FIELDS.
 */
export function buildGenesysSelect(selectedIds) {
  const selected = sanitizeSelectedColumns(selectedIds);
  const byId = new Map(METADATA_COLUMNS.map((c) => [c.id, c]));

  const selectSet = new Set(REQUIRED_GENESYS_SELECT_FIELDS);

  for (const id of selected) {
    const col = byId.get(id);
    if (!col) continue;
    (col.apiParams || []).forEach((p) => selectSet.add(p));
  }

  return Array.from(selectSet).join(",");
}

export function renderMetadataCell(colId, item, ctx) {
  switch (colId) {
    case "instituteCode":
      return item.instituteCode || "N/A";

    case "holdingInstitute":
      return item["institute.fullName"] || "N/A";

    case "accessionNumber":
      return (
        <a
          href={`${genesysServer.replace("//api.", "//")}/a/${item.uuid}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {item.accessionNumber || "N/A"}
        </a>
      );

    case "accessionName":
      return item.accessionName || "N/A";

    case "aliases":
      return item.aliases && item.aliases.length > 1
        ? item.aliases
            .filter((alias) => alias.aliasType !== "ACCENAME")
            .map(
              (alias) =>
                `${alias.name}${alias.usedBy ? ` ${alias.usedBy}` : ""}`,
            )
            .join(", ")
        : "N/A";

    case "remarks":
      return item["remarks.remark"] || "N/A";

    case "taxonomy":
      return item["taxonomy.taxonName"] || "N/A";

    case "cropName":
      return item.cropName || "N/A";

    case "genus":
      return item["taxonomy.genus"] || "N/A";

    case "species":
      return item["taxonomy.species"] || "N/A";

    case "storage": {
      const s = item["storage"];
      return s
        ? s
            .toString()
            .match(/.{1,2}/g)
            ?.map((code) => germplasmStorageMapping[parseInt(code)])
            .filter(Boolean)
            .join(", ") || "N/A"
        : "N/A";
    }

    case "sampStat":
      return ctx.getSampleStatus(item.sampStat) || "N/A";

    case "donorInstitute": {
      const name = item.donorName || "";
      const code = item.donorCode || "";
      if (name && code) return `${name}, ${code}`;
      if (name) return name;
      if (code) return code;
      return "N/A";
    }

    case "provenance":
      return item["countryOfOrigin.name"] || "N/A";

    case "region":
      return (
        ctx.countryByCode.get(String(item["countryOfOrigin.codeNum"]))
          ?.region || "N/A"
      );

    case "subRegion":
      return (
        ctx.countryByCode.get(String(item["countryOfOrigin.codeNum"]))
          ?.subRegion || "N/A"
      );

    case "acquisitionDate":
      return ctx.formatDate(item.acquisitionDate);

    case "doi":
      return item.doi || "N/A";

    case "available":
      return item.available === true
        ? "True"
        : item.available === false
          ? "False"
          : "N/A";

    case "curationType":
      return item.curationType ? item.curationType : "N/A";

    case "lastUpdated":
      return item.lastModifiedDate || "N/A";

    case "genotypeStatus": {
      const acc = item.accessionNumber;
      return (
        ctx.statusByAcc.get(acc) ?? (acc?.startsWith("AGG") ? "TBC" : "N/A")
      );
    }

    case "genotypeId":
      return ctx.genotypeIdMapping[item.accessionNumber] || "N/A";

    case "figsSet": {
      const figs = ctx.figMapping[item.accessionNumber];
      return figs?.length > 0 ? figs.join(", ") : "N/A";
    }

    default:
      return "N/A";
  }
}
