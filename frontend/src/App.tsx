import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { FarmsFieldsPage } from './pages/FarmsFieldsPage';
import { IrrigationControlPage } from './pages/IrrigationControlPage';
import { WaterPredictionsPage } from './pages/WaterPredictionsPage';
import { IrrigationSchedulePage } from './pages/IrrigationSchedulePage';
import { AnalyticsReportsPage } from './pages/AnalyticsReportsPage';
import { AlertsEventsPage } from './pages/AlertsEventsPage';
import { SensorManagementPage } from './pages/SensorManagementPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="monitoring" element={<LiveMonitoringPage />} />
          <Route path="farms-fields" element={<FarmsFieldsPage />} />
          <Route path="irrigation-control" element={<IrrigationControlPage />} />
          <Route path="water-predictions" element={<WaterPredictionsPage />} />
          <Route path="schedules" element={<IrrigationSchedulePage />} />
          <Route path="analytics" element={<AnalyticsReportsPage />} />
          <Route path="alerts" element={<AlertsEventsPage />} />
          <Route path="sensors" element={<SensorManagementPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
