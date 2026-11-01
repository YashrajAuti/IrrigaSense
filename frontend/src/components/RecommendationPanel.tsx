import React, { useState } from 'react';
import { RecommendationResponse } from '../types';
import { AlertTriangle, CheckCircle2, Droplet, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';

interface RecommendationPanelProps {
  recommendation: RecommendationResponse;
  onReviewAction: () => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendation,
  onReviewAction,
}) => {
  const [showFullExplanation, setShowFullExplanation] = useState(false);

  const actionStyle = {
    IRRIGATE_NOW: {
      badge: 'bg-neon-rose/15 text-neon-rose border-neon-rose/30',
      title: 'Irrigation Recommended',
      icon: Droplet,
      iconColor: 'text-neon-rose',
    },
    TARGET_OPTIMAL: {
      badge: 'bg-field-green/15 text-field-green border-field-green/30',
      title: 'Moisture Target Optimal',
      icon: CheckCircle2,
      iconColor: 'text-field-green',
    },
    DELAY_OR_STOP: {
      badge: 'bg-amber-alert/15 text-amber-alert border-amber-alert/30',
      title: 'Hold or Halt Irrigation',
      icon: AlertTriangle,
      iconColor: 'text-amber-alert',
    },
    INSUFFICIENT_DATA: {
      badge: 'bg-slate-gray/15 text-slate-gray border-slate-gray/30',
      title: 'Insufficient Data / Stale Sensor',
      icon: AlertTriangle,
      iconColor: 'text-slate-gray',
    },
  }[recommendation.recommended_action] || {
    badge: 'bg-cerulean/15 text-cerulean border-cerulean/30',
    title: 'Evaluating Conditions',
    icon: ShieldCheck,
    iconColor: 'text-cerulean',
  };

  const Icon = actionStyle.icon;

  return (
    <div className="bg-graphite border border-border-gray rounded-md p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-gray">
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded bg-obsidian border border-border-gray ${actionStyle.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-pure-white">{actionStyle.title}</h2>
              <span className="text-xs text-slate-gray">
                Zone: <span className="text-pure-white font-medium">{recommendation.zone_name}</span> ({recommendation.crop_type})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded text-xs font-mono font-medium border ${actionStyle.badge}`}>
              {recommendation.recommended_action}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-obsidian/70 border border-border-gray/70 rounded p-2.5">
            <span className="text-[11px] text-slate-gray block">Current Moisture</span>
            <span className="text-base font-bold font-mono text-pure-white">
              {recommendation.current_soil_moisture !== null
                ? `${recommendation.current_soil_moisture.toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>

          <div className="bg-obsidian/70 border border-border-gray/70 rounded p-2.5">
            <span className="text-[11px] text-slate-gray block">Configured Range</span>
            <span className="text-base font-bold font-mono text-pure-white">
              {recommendation.lower_threshold.toFixed(0)}% - {recommendation.upper_threshold.toFixed(0)}%
            </span>
          </div>

          <div className="bg-obsidian/70 border border-border-gray/70 rounded p-2.5">
            <span className="text-[11px] text-slate-gray block">Calculated Depth</span>
            <span className="text-base font-bold font-mono text-pure-white">
              {recommendation.target_depth_mm.toFixed(1)} mm
            </span>
          </div>

          <div className="bg-obsidian/70 border border-border-gray/70 rounded p-2.5">
            <span className="text-[11px] text-slate-gray block">Gross Water Req.</span>
            <span className="text-base font-bold font-mono text-cerulean">
              {recommendation.estimated_water_liters.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
            </span>
          </div>
        </div>

        {/* Transparent Reasoning */}
        <div className="space-y-1.5 my-3">
          <span className="text-xs font-semibold text-slate-gray uppercase tracking-wider block">
            Engine Rule Evaluation:
          </span>
          <ul className="space-y-1 text-xs text-pure-white/90">
            {recommendation.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <ChevronRight className="w-3.5 h-3.5 text-cerulean shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Disclaimer & Review Button */}
      <div className="pt-3 border-t border-border-gray flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-gray text-[11px]">
          {recommendation.disclaimer}
        </span>

        <button
          onClick={onReviewAction}
          className="inline-flex items-center space-x-2 bg-cerulean text-pure-white px-4 py-2 rounded text-xs font-medium hover:bg-cerulean/90 transition-colors"
        >
          <span>Review Recommendation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
