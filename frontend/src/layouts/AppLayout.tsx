import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { DemoModeBanner } from '../components/DemoModeBanner';
import { ResetDemoModal } from '../components/ResetDemoModal';
import { api } from '../services/api';
import { Farm, Field } from '../types';

export interface AppContextType {
  farms: Farm[];
  fields: Field[];
  selectedFarmId: number | null;
  selectedFieldId: number | null;
  setSelectedFarmId: (id: number) => void;
  setSelectedFieldId: (id: number) => void;
  openResetModal: () => void;
  refreshAppData: () => Promise<void>;
  isConnected: boolean;
}

export const AppContext = React.createContext<AppContextType | null>(null);

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [farmList, fieldList] = await Promise.all([
        api.getFarms(),
        api.getFields(),
      ]);
      setFarms(farmList);
      setFields(fieldList);
      if (farmList.length > 0 && selectedFarmId === null) {
        setSelectedFarmId(farmList[0].id);
      }
      if (fieldList.length > 0 && selectedFieldId === null) {
        setSelectedFieldId(fieldList[0].id);
      }
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching layout data:', err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    loadData();
    // Health check heartbeat every 15 seconds
    const interval = setInterval(() => {
      api.checkHealth()
        .then(() => setIsConnected(true))
        .catch(() => setIsConnected(false));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectFarm = (id: number) => {
    setSelectedFarmId(id);
    const relatedFields = fields.filter((f) => f.farm_id === id);
    if (relatedFields.length > 0) {
      setSelectedFieldId(relatedFields[0].id);
    }
  };

  const handleConfirmReset = async () => {
    await api.resetDemoData(true);
    await loadData();
  };

  return (
    <AppContext.Provider
      value={{
        farms,
        fields,
        selectedFarmId,
        selectedFieldId,
        setSelectedFarmId: handleSelectFarm,
        setSelectedFieldId,
        openResetModal: () => setIsResetModalOpen(true),
        refreshAppData: loadData,
        isConnected,
      }}
    >
      <div className="min-h-screen bg-jet-black text-pure-white flex flex-col font-sans">
        {/* Navigation Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Main Content Viewport */}
        <div className={`flex-1 flex flex-col transition-all duration-200 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <TopBar
            farms={farms}
            fields={fields}
            selectedFarmId={selectedFarmId}
            selectedFieldId={selectedFieldId}
            onSelectFarm={handleSelectFarm}
            onSelectField={setSelectedFieldId}
            isConnected={isConnected}
          />

          <DemoModeBanner />

          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>

        {/* Global Reset Modal */}
        <ResetDemoModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onConfirmReset={handleConfirmReset}
        />
      </div>
    </AppContext.Provider>
  );
};
