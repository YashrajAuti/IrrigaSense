import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../layouts/AppLayout';
import { api } from '../services/api';
import { IrrigationSchedule, IrrigationZone } from '../types';
import { CalendarClock, Plus, Check, Clock, Calendar, ToggleLeft, ToggleRight, X } from 'lucide-react';

export const IrrigationSchedulePage: React.FC = () => {
  const context = useContext(AppContext);
  const [schedules, setSchedules] = useState<IrrigationSchedule[]>([]);
  const [zones, setZones] = useState<IrrigationZone[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [zoneId, setZoneId] = useState<number>(1);
  const [scheduledTime, setScheduledTime] = useState('06:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [targetDepthMm, setTargetDepthMm] = useState(4.0);
  const [daysOfWeek, setDaysOfWeek] = useState('Mon,Wed,Fri');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [scheduleList, zoneList] = await Promise.all([
        api.getSchedules(),
        api.getZones(),
      ]);
      setSchedules(scheduleList);
      setZones(zoneList);
      if (zoneList.length > 0 && !zoneId) {
        setZoneId(zoneList[0].id);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (scheduleId: number) => {
    try {
      await api.toggleSchedule(scheduleId);
      loadData();
    } catch (err) {
      console.error('Failed to toggle schedule:', err);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSchedule({
        zone_id: Number(zoneId),
        name,
        scheduled_time: scheduledTime,
        duration_minutes: Number(durationMinutes),
        target_depth_mm: Number(targetDepthMm),
        days_of_week: daysOfWeek,
        is_active: true,
      });
      setIsModalOpen(false);
      setName('');
      loadData();
    } catch (err) {
      console.error('Failed to create schedule:', err);
    }
  };

  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');

  const handleDeleteSchedule = async (scheduleId: number, scheduleName: string) => {
    if (window.confirm(`Are you sure you want to delete programmed schedule "${scheduleName}"?`)) {
      try {
        await api.deleteSchedule(scheduleId);
        loadData();
      } catch (err) {
        console.error('Failed to delete schedule:', err);
      }
    }
  };

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-pure-white">Automated Irrigation Schedules</h1>
          <p className="text-xs text-slate-gray">
            Time-based automated drip cycles & programmed diurnal water delivery
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded bg-graphite border border-border-gray p-0.5 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-obsidian text-cerulean font-medium' : 'text-slate-gray hover:text-pure-white'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'calendar' ? 'bg-obsidian text-cerulean font-medium' : 'text-slate-gray hover:text-pure-white'
              }`}
            >
              Weekly Calendar
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 bg-cerulean text-pure-white px-3.5 py-1.5 rounded text-xs font-semibold hover:bg-cerulean/90 transition-colors shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Programmed Schedule</span>
          </button>
        </div>
      </div>

      {/* Conditional View: Cards or Weekly Calendar */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => {
            const zone = zones.find((z) => z.id === schedule.zone_id);

            return (
              <div
                key={schedule.id}
                className={`bg-graphite border rounded-md p-5 flex flex-col justify-between transition-colors ${
                  schedule.is_active ? 'border-border-gray' : 'border-border-gray/40 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border-gray mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-pure-white">{schedule.name}</h3>
                      <span className="text-xs text-slate-gray font-mono">
                        Zone: {zone?.name || `Zone ${schedule.zone_id}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggle(schedule.id)}
                      className={`p-1 rounded transition-colors ${
                        schedule.is_active ? 'text-field-green hover:text-field-green/80' : 'text-slate-gray hover:text-pure-white'
                      }`}
                      title={schedule.is_active ? 'Deactivate schedule' : 'Activate schedule'}
                    >
                      {schedule.is_active ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-obsidian">
                      <span className="text-slate-gray flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-cerulean" />
                        <span>Start Time & Duration</span>
                      </span>
                      <span className="font-mono text-pure-white font-medium">
                        {schedule.scheduled_time} ({schedule.duration_minutes} mins)
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-obsidian">
                      <span className="text-slate-gray flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cerulean" />
                        <span>Execution Days</span>
                      </span>
                      <span className="font-mono text-pure-white font-medium">{schedule.days_of_week}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-obsidian">
                      <span className="text-slate-gray">Target Water Depth</span>
                      <span className="font-mono text-cerulean font-bold">{schedule.target_depth_mm} mm</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border-gray/50 flex items-center justify-between text-[11px] text-slate-gray">
                  <span className="font-mono">
                    {schedule.is_active ? 'STATUS: ARMED' : 'STATUS: DISABLED'}
                  </span>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id, schedule.name)}
                    className="text-slate-gray hover:text-neon-rose text-xs transition-colors flex items-center space-x-1"
                    title="Delete schedule"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Weekly Calendar Matrix View */
        <div className="bg-graphite border border-border-gray rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-gray">
            <h3 className="text-sm font-semibold text-pure-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cerulean" />
              <span>Weekly Scheduled Run Matrix</span>
            </h3>
            <span className="text-xs text-slate-gray font-mono">Timezone: Asia/Kolkata (IST)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            {daysList.map((day) => {
              const daySchedules = schedules.filter(
                (s) => s.is_active && (s.days_of_week.includes(day) || s.days_of_week.toLowerCase().includes('daily'))
              );

              return (
                <div key={day} className="bg-obsidian border border-border-gray/70 rounded p-3 flex flex-col min-h-[160px]">
                  <div className="text-xs font-bold font-mono text-cerulean border-b border-border-gray pb-1 mb-2">
                    {day}
                  </div>
                  {daySchedules.length === 0 ? (
                    <span className="text-[11px] text-slate-gray/60 italic my-auto text-center">No runs</span>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {daySchedules.map((s) => {
                        const zone = zones.find((z) => z.id === s.zone_id);
                        return (
                          <div
                            key={s.id}
                            className="bg-graphite border border-border-gray rounded p-1.5 text-[11px] space-y-0.5"
                          >
                            <div className="font-mono font-bold text-pure-white">{s.scheduled_time}</div>
                            <div className="text-slate-gray truncate">{zone?.name || `Zone ${s.zone_id}`}</div>
                            <div className="text-[10px] text-field-green font-mono">{s.duration_minutes}m • {s.target_depth_mm}mm</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-graphite border border-border-gray rounded-md w-full max-w-md p-5 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-gray hover:text-pure-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <CalendarClock className="w-5 h-5 text-cerulean" />
              <h2 className="text-sm font-semibold text-pure-white">Create Irrigation Schedule</h2>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-gray mb-1">Schedule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dawn Tomato Drip Cycle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white focus:border-cerulean focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-gray mb-1">Target Zone</label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(Number(e.target.value))}
                  className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white focus:border-cerulean focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-gray mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-gray mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-gray mb-1">Depth (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    required
                    value={targetDepthMm}
                    onChange={(e) => setTargetDepthMm(Number(e.target.value))}
                    className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-gray mb-1">Recurrence Days</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mon,Wed,Fri"
                    value={daysOfWeek}
                    onChange={(e) => setDaysOfWeek(e.target.value)}
                    className="w-full bg-obsidian border border-border-gray rounded px-3 py-2 text-pure-white font-mono focus:border-cerulean focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-gray">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded text-xs text-slate-gray hover:text-pure-white border border-border-gray hover:bg-obsidian"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cerulean text-pure-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-cerulean/90"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
