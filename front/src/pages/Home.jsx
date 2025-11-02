import { useEffect, useRef, useState } from "react";
import GenesysApi from "../api/GenesysApi";
import SearchFilters from "../components/metadata/filters/SearchFilters";
import GenolinkGigwaApi from "../api/GenolinkGigwaApi";
import GenolinkInternalApi from "../api/GenolinkInternalApi";

export const genesysApi = new GenesysApi();
export const genolinkGigwaApi = new GenolinkGigwaApi();
export const genolinkInternalApi = new GenolinkInternalApi();

const TOKEN_EXPIRES_IN_SECONDS = 259_199;
const REFRESH_BUFFER_SECONDS = 600; // refresh 10 min early

const Home = () => {
  const [tokenReady, setTokenReady] = useState(false);
  const [token, setToken] = useState(null);
  const refreshTimer = useRef(null);

  // schedule a refresh before expiry
  const scheduleRefresh = (expiresInSec) => {
    const waitMs = Math.max(
      1000,
      (expiresInSec - REFRESH_BUFFER_SECONDS) * 1000
    );
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        await genesysApi.fetchAndSetToken();
        setToken(genesysApi.getToken()); // re-render + remount child via key
        scheduleRefresh(TOKEN_EXPIRES_IN_SECONDS);
      } catch (e) {
        console.error("Token refresh failed:", e);
        // fallback: try again in 1 minute
        refreshTimer.current = setTimeout(async () => {
          try {
            await genesysApi.fetchAndSetToken();
            setToken(genesysApi.getToken());
            scheduleRefresh(TOKEN_EXPIRES_IN_SECONDS);
          } catch (err) {
            console.error("Retry refresh failed:", err);
          }
        }, 60 * 1000);
      }
    }, waitMs);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await genesysApi.fetchAndSetToken();
        if (cancelled) return;
        setToken(genesysApi.getToken());

        const { rows } = await genolinkInternalApi.getAllGenotypeStatus();
        if (cancelled) return;

        const safeRows = Array.isArray(rows) ? rows : [];

        genesysApi.setGenotypeStatus(safeRows);
        genesysApi.setGenotypedAccessions(
          safeRows
            .filter((r) => r.Status === "Completed")
            .map((r) => r.Accession)
        );
        genesysApi.setGenotypedSamples(
          safeRows.filter((r) => r.Status === "Completed").map((r) => r.Sample)
        );

        setTokenReady(true);

        // schedule refresh ~10 min before expiry
        scheduleRefresh(TOKEN_EXPIRES_IN_SECONDS);
      } catch (e) {
        console.error("Init error:", e);
      }
    })();

    return () => {
      cancelled = true;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  return <SearchFilters key={token || "no-token"} tokenReady={tokenReady} />;
};

export default Home;
