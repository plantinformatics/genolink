export const genolinkServer = import.meta.env.VITE_GENOLINK_SERVER;
export const genesysServer = import.meta.env.VITE_GENESYS_SERVER;
export const platforms = import.meta.env.VITE_PLATFORM?.split(",") || ["Gigwa"];
export const REQUIRE_GIGWA_CREDENTIALS =
  import.meta.env.VITE_REQUIRE_GIGWA_CREDENTIALS === "true";
export const DEFAULT_INSTITUTE_CODE =
  import.meta.env.VITE_DEFAULT_INSTITUTE_CODE || "AUS165";
export const GENOTYPE_FILTER_STATUS =
  import.meta.env.VITE_GENOTYPE_FILTER_STATUS || "yes";
