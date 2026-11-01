import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../layouts/AppLayout';
import { api } from '../services/api';
import { Field } from '../types';
import { MapPin, Sliders, Check, Edit3 } from 'lucide-react';

export const FarmsFieldsPage: React.FC = () => {
  const context = useContext(AppContext);
  const [fields, setFields] = useState<Field[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [lowerTh, setLowerTh] = useState<number>(40);
  const [upperTh, setUpperTh] = useState<number>(65);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const loadFields = async () => {
    try {
      const data = await api.getFields(context?.selectedFarmId || undefined);
      setFields(data);
    } catch (err) {
      console.error('Failed to load fields:', err);
    }
  };

  useEffect(() => {
    loadFields();
  }, [context?.selectedFarmId]);

  const handleStartEdit = (field: Field) => {
    setEditingFieldId(field.id);
    setLowerTh(field.lower_moisture_threshold);
    setUpperTh(field.upper_moisture_threshold);
  };

  const handleSaveThresholds = async (fieldId: number) => {
    if (lowerTh >= upperTh) {
      setSaveStatus('Lower threshold must be strictly less than upper threshold.');
      return;
    }
    try {
      await api.updateFieldThresholds(fieldId, lowerTh, upperTh);
      setSaveStatus('Thresholds successfully persisted to database.');
      setEditingFieldId(null);
      loadFields();
      context?.refreshAppData();
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      setSaveStatus(`Failed to update: ${err.message}`);
    }
  };

  const selectedFarm = context?.farms.find((f) => f.id === context.selectedFarmId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">Farms & Field Configuration</h1>
          <p className="text-xs text-slate-gray">
            Crop-specific agronomic profiles & soil moisture threshold calibration
          </p>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 rounded bg-graphite border border-cerulean/40 text-xs text-pure-white flex items-center justify-between">
          <span>{saveStatus}</span>
          <button onClick={() => setSaveStatus(null)} className="text-slate-gray hover:text-pure-white">
            Dismiss
          </button>
        </div>
      )}

      {selectedFarm && (
        <div className="bg-graphite border border-border-gray rounded-md p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded bg-obsidian border border-border-gray text-cerulean">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-pure-white">{selectedFarm.name}</h2>
                <span className="text-xs text-slate-gray">{selectedFarm.location}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-slate-gray">
              <div>
                Total Area: <span className="text-pure-white font-medium">{selectedFarm.total_area_sqm.toLocaleString()} m²</span>
              </div>
              <div>
                Fields Count: <span className="text-pure-white font-medium">{fields.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => {
          const isEditing = editingFieldId === field.id;

          return (
            <div key={field.id} className="bg-graphite border border-border-gray rounded-md p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border-gray mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-pure-white">{field.name}</h3>
                    <span className="text-xs text-slate-gray font-mono">
                      Crop: <strong className="text-pure-white font-medium">{field.crop_type}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-obsidian border border-border-gray text-xs font-mono text-cerulean">
                    {field.soil_type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="bg-obsidian/70 p-2.5 rounded border border-border-gray/60">
                    <span className="text-[11px] text-slate-gray block">Plot Surface Area</span>
                    <span className="font-mono text-pure-white font-medium">{field.area_sqm.toLocaleString()} m²</span>
                  </div>
                  <div className="bg-obsidian/70 p-2.5 rounded border border-border-gray/60">
                    <span className="text-[11px] text-slate-gray block">Active Irrigation Zones</span>
                    <span className="font-mono text-pure-white font-medium">{field.zones?.length || 1} Assigned</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-obsidian border border-border-gray space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-pure-white flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cerulean" />
                      <span>Moisture Threshold Limits</span>
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(field)}
                        className="text-cerulean hover:text-cerulean/80 inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-gray mb-1">
                            Min Trigger Threshold (%)
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="80"
                            value={lowerTh}
                            onChange={(e) => setLowerTh(Number(e.target.value))}
                            className="w-full bg-graphite border border-border-gray rounded px-2 py-1 text-xs text-pure-white font-mono focus:border-cerulean focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-gray mb-1">
                            Max Field Capacity (%)
                          </label>
                          <input
                            type="number"
                            min="20"
                            max="95"
                            value={upperTh}
                            onChange={(e) => setUpperTh(Number(e.target.value))}
                            className="w-full bg-graphite border border-border-gray rounded px-2 py-1 text-xs text-pure-white font-mono focus:border-cerulean focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2">
                        <button
                          onClick={() => setEditingFieldId(null)}
                          className="px-2.5 py-1 rounded text-xs text-slate-gray hover:text-pure-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveThresholds(field.id)}
                          className="inline-flex items-center space-x-1.5 bg-cerulean text-pure-white px-3 py-1 rounded text-xs font-medium hover:bg-cerulean/90"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <div>
                        <span className="text-slate-gray">Lower Cutoff: </span>
                        <span className="text-amber-alert font-bold">{field.lower_moisture_threshold}%</span>
                      </div>
                      <div>
                        <span className="text-slate-gray">Upper Capacity: </span>
                        <span className="text-field-green font-bold">{field.upper_moisture_threshold}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-gray/50 flex items-center justify-between text-[11px] text-slate-gray">
                <span>Crop water sensitivity: Moderate</span>
                <span className="font-mono">Created: {new Date(field.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
