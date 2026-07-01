export const genolinkServer = import.meta.env.VITE_GENOLINK_SERVER;
export const genesysServer = import.meta.env.VITE_GENESYS_SERVER;
const fallbackInstituteCode = "AUS165";
const envInstituteCode = import.meta.env.VITE_DEFAULT_INSTITUTE_CODE?.trim()
  .toUpperCase();

export const defaultInstituteCode = /^[A-Z]{3}\d+$/.test(envInstituteCode)
  ? envInstituteCode
  : fallbackInstituteCode;
export const platforms = import.meta.env.VITE_PLATFORM?.split(",") || ["Gigwa"];
export const REQUIRE_GIGWA_CREDENTIALS =
  import.meta.env.VITE_REQUIRE_GIGWA_CREDENTIALS === "true";

const allowedGenotypeMappingSources = [
  "internal",
  "genesys",
  "hybrid_internal_first",
  "hybrid_genesys_first",
];

const defaultGenotypeMappingSource = "hybrid_internal_first";

export const genotypeMappingSource = allowedGenotypeMappingSources.includes(
  import.meta.env.VITE_GENOTYPE_MAPPING_SOURCE,
)
  ? import.meta.env.VITE_GENOTYPE_MAPPING_SOURCE
  : defaultGenotypeMappingSource;
