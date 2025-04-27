import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Patient } from "@/types/patient";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load patients from localStorage
  useEffect(() => {
    const storedPatients = localStorage.getItem("kenya-chw-patients");
    if (storedPatients) {
      setPatients(JSON.parse(storedPatients));
    }
  }, []);

  // Filter patients based on search query
  useEffect(() => {
    if (query.trim() === "") {
      setFilteredPatients([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = patients.filter(
      patient => 
        patient.name.toLowerCase().includes(lowerQuery) || 
        patient.id.toLowerCase().includes(lowerQuery) ||
        (patient.village && patient.village.toLowerCase().includes(lowerQuery))
    );
    setFilteredPatients(filtered.slice(0, 5)); // Show maximum 5 results
  }, [query, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handlePatientSelect = (patientId: string) => {
    navigate(`/patients/${patientId}`);
    setShowDropdown(false);
    setQuery("");
  };
  
  return (
    <div className="relative w-full" ref={searchRef}>
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        onFocus={() => setShowDropdown(true)}
        placeholder="Search patients..."
        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      
      {showDropdown && filteredPatients.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md z-10 max-h-60 overflow-y-auto">
          {filteredPatients.map(patient => (
            <div 
              key={patient.id}
              onClick={() => handlePatientSelect(patient.id)}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="font-medium">{patient.name}</div>
              <div className="text-xs text-gray-500 flex justify-between">
                <span>ID: {patient.id}</span>
                {patient.village && <span>Village: {patient.village}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
