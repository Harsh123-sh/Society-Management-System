import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api } from "../services/authApi";

const SocietyContext = createContext(null);

export function SocietyProvider({ children }) {
  const [societies, setSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("selectedSocietyId") || null;
  });
  const [selectedSocietyName, setSelectedSocietyName] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("selectedSocietyName") || null;
  });
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
    api
      .get("/societies")
      .then((res) => {
        const list = res?.data?.data || [];
        setSocieties(list);
        if (!selectedSocietyId && list && list.length > 0) {
          setSelectedSocietyId(String(list[0].id));
          setSelectedSocietyName(list[0].name || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      if (selectedSocietyId) {
        localStorage.setItem("selectedSocietyId", selectedSocietyId);
        if (selectedSocietyName) {
          localStorage.setItem("selectedSocietyName", selectedSocietyName);
        }
      } else {
        localStorage.removeItem("selectedSocietyId");
        localStorage.removeItem("selectedSocietyName");
      }
    } catch (e) {}
  }, [selectedSocietyId, selectedSocietyName]);

  function setSelectedSociety(society) {
    if (!society) {
      setSelectedSocietyId(null);
      setSelectedSocietyName(null);
      return;
    }

    setSelectedSocietyId(String(society.id));
    setSelectedSocietyName(society.name || String(society.id));
  }

  return (
    <SocietyContext.Provider value={{ societies, selectedSociety, setSelectedSociety, loading }}>
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
