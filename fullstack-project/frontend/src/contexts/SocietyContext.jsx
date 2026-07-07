import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, fetchPublicSocieties } from "../services/authApi";

const SocietyContext = createContext(null);
const SELECTED_SOCIETY_ID_KEY = "selectedSocietyId";
const SELECTED_SOCIETY_NAME_KEY = "selectedSocietyName";
const RECENT_SOCIETIES_KEY = "recentSocieties";
const FAVORITE_SOCIETIES_KEY = "favoriteSocieties";

const fallbackSocieties = [
  {
    id: "GREEN-01",
    code: "GREEN-01",
    name: "Green Heights Society",
    status: "active",
    logo_url: "",
    banner_url: "",
    resident_count: 1240,
    occupancy_rate: 92,
    pending_complaints: 18,
    monthly_collections: 840000,
  },
  {
    id: "PALM-02",
    code: "PALM-02",
    name: "Palm Residency",
    status: "active",
    logo_url: "",
    banner_url: "",
    resident_count: 860,
    occupancy_rate: 88,
    pending_complaints: 9,
    monthly_collections: 560000,
  },
  {
    id: "SKY-03",
    code: "SKY-03",
    name: "Skyline Enclave",
    status: "trial",
    logo_url: "",
    banner_url: "",
    resident_count: 2130,
    occupancy_rate: 96,
    pending_complaints: 24,
    monthly_collections: 1280000,
  },
];

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeSociety(rawSociety) {
  const id = rawSociety?.id || rawSociety?.society_id || rawSociety?.code || rawSociety?.society_code;
  const code = rawSociety?.code || rawSociety?.society_code || id;
  return {
    ...rawSociety,
    id: String(id),
    code: String(code),
    name: rawSociety?.name || rawSociety?.society_name || `Society ${code}`,
    status: rawSociety?.status || "active",
    logo_url: rawSociety?.logo_url || rawSociety?.logoUrl || "",
    banner_url: rawSociety?.banner_url || rawSociety?.bannerUrl || "",
    resident_count: Number(rawSociety?.resident_count ?? rawSociety?.residentCount ?? rawSociety?.user_count ?? 0),
    occupancy_rate: Number(rawSociety?.occupancy_rate ?? rawSociety?.occupancyRate ?? 0),
    pending_complaints: Number(rawSociety?.pending_complaints ?? rawSociety?.pendingComplaints ?? 0),
    monthly_collections: Number(rawSociety?.monthly_collections ?? rawSociety?.monthlyCollections ?? 0),
  };
}

export function SocietyProvider({ children }) {
  const [societies, setSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SELECTED_SOCIETY_ID_KEY) || localStorage.getItem("societyId") || null;
  });
  const [selectedSocietyName, setSelectedSocietyName] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SELECTED_SOCIETY_NAME_KEY) || localStorage.getItem("societyName") || null;
  });
  const [recentSocietyIds, setRecentSocietyIds] = useState(() => readJson(RECENT_SOCIETIES_KEY, []));
  const [favoriteSocietyIds, setFavoriteSocietyIds] = useState(() => readJson(FAVORITE_SOCIETIES_KEY, []));
  const [loading, setLoading] = useState(false);

  const selectedSociety = useMemo(() => {
    const selected = societies.find((item) => String(item.id) === String(selectedSocietyId));
    if (selected) {
      return selected;
    }
    if (selectedSocietyId) {
      return { id: selectedSocietyId, name: selectedSocietyName || "Selected society" };
    }
    return null;
  }, [societies, selectedSocietyId, selectedSocietyName]);

  useEffect(() => {
    setLoading(true);
    const privateSocieties = api.get("/societies");
    const publicSocieties = fetchPublicSocieties();

    Promise.any([privateSocieties, publicSocieties])
      .then((res) => {
        const rawList = res?.data?.data || res?.data || res?.societies || res?.data?.societies || [];
        const list = Array.isArray(rawList) && rawList.length ? rawList.map(normalizeSociety) : fallbackSocieties;
        setSocieties(list);
        if (!selectedSocietyId && list && list.length > 0) {
          setSelectedSocietyId(String(list[0].id));
          setSelectedSocietyName(list[0].name || null);
        }
      })
      .catch(() => {
        setSocieties(fallbackSocieties);
        if (!selectedSocietyId) {
          setSelectedSocietyId(fallbackSocieties[0].id);
          setSelectedSocietyName(fallbackSocieties[0].name);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      if (selectedSocietyId) {
        localStorage.setItem(SELECTED_SOCIETY_ID_KEY, selectedSocietyId);
        localStorage.setItem("societyId", selectedSocietyId);
        if (selectedSocietyName) {
          localStorage.setItem(SELECTED_SOCIETY_NAME_KEY, selectedSocietyName);
          localStorage.setItem("societyName", selectedSocietyName);
        }
        window.dispatchEvent(new CustomEvent("society:changed", { detail: { societyId: selectedSocietyId, societyName: selectedSocietyName } }));
      } else {
        localStorage.removeItem(SELECTED_SOCIETY_ID_KEY);
        localStorage.removeItem(SELECTED_SOCIETY_NAME_KEY);
      }
    } catch (e) {}
  }, [selectedSocietyId, selectedSocietyName]);

  useEffect(() => writeJson(RECENT_SOCIETIES_KEY, recentSocietyIds), [recentSocietyIds]);
  useEffect(() => writeJson(FAVORITE_SOCIETIES_KEY, favoriteSocietyIds), [favoriteSocietyIds]);

  function setSelectedSociety(society) {
    if (!society) {
      setSelectedSocietyId(null);
      setSelectedSocietyName(null);
      return;
    }

    setSelectedSocietyId(String(society.id));
    setSelectedSocietyName(society.name || String(society.id));
    setRecentSocietyIds((current) => [String(society.id), ...current.filter((id) => String(id) !== String(society.id))].slice(0, 5));
  }

  function toggleFavoriteSociety(societyId) {
    setFavoriteSocietyIds((current) => {
      const normalized = String(societyId);
      return current.includes(normalized) ? current.filter((id) => id !== normalized) : [normalized, ...current].slice(0, 8);
    });
  }

  const recentSocieties = useMemo(
    () => recentSocietyIds.map((id) => societies.find((society) => String(society.id) === String(id))).filter(Boolean),
    [recentSocietyIds, societies]
  );

  const favoriteSocieties = useMemo(
    () => favoriteSocietyIds.map((id) => societies.find((society) => String(society.id) === String(id))).filter(Boolean),
    [favoriteSocietyIds, societies]
  );

  return (
    <SocietyContext.Provider
      value={{
        societies,
        selectedSociety,
        selectedSocietyId,
        recentSocieties,
        favoriteSocieties,
        favoriteSocietyIds,
        setSelectedSociety,
        toggleFavoriteSociety,
        loading,
      }}
    >
      {children}
    </SocietyContext.Provider>
  );
}

export function useSociety() {
  const ctx = useContext(SocietyContext);
  if (!ctx) throw new Error("useSociety must be used within SocietyProvider");
  return ctx;
}

export default SocietyContext;
