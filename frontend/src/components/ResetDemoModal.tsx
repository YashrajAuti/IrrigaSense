import React, { useState } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isChecked) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await onConfirmReset();
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to reset demonstration dataset');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-graphite border border-border-gray rounded-md w-full max-w-md p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-gray hover:text-pure-white"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded bg-amber-alert/10 border border-amber-alert/30 text-amber-alert">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-pure-white">Reset Demonstration Dataset</h3>
            <span className="text-xs text-slate-gray">Database Seeder &bull; Confirmation Required</span>
          </div>
        </div>

        <p className="text-xs text-slate-gray leading-relaxed mb-4">
          This operation will clear all current simulated logs, sensor events, and overridden thresholds, and re-initialize the baseline Indian agro dataset (Sahyadri Agro Estate, Baramati, Maharashtra).
        </p>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded bg-neon-rose/10 border border-neon-rose/30 text-neon-rose text-xs">
            {errorMessage}
          </div>
        )}

        <label className="flex items-start space-x-2.5 p-3 rounded bg-obsidian border border-border-gray cursor-pointer text-xs mb-5">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-0.5 rounded border-border-gray text-cerulean focus:ring-0 bg-graphite"
          />
          <span className="text-pure-white font-medium">
            I understand that all current simulated telemetry and command records will be reset.
          </span>
        </label>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-border-gray">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-xs text-slate-gray hover:text-pure-white border border-border-gray hover:bg-obsidian transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isChecked || isLoading}
            className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded text-xs font-medium transition-colors ${
              isChecked && !isLoading
                ? 'bg-amber-alert text-jet-black hover:bg-amber-alert/90'
                : 'bg-obsidian border border-border-gray text-slate-gray cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Resetting Data...</span>
              </>
            ) : (
              <span>Confirm & Reset Database</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
