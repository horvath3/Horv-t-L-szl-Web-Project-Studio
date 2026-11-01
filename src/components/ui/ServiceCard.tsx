import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';

interface ServiceCardProps {
  number: string;
  title: string;
  description: string;
  points: string[];
  icon: React.ReactNode;
  serviceTypeParam?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  number,
  title,
  description,
  points,
  icon,
  serviceTypeParam
}) => {
  const targetUrl = serviceTypeParam
    ? `/projekt-igeny?type=${encodeURIComponent(serviceTypeParam)}`
    : '/projekt-igeny';

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-8 border border-white/8 flex flex-col justify-between h-full relative group">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all">
            {icon}
          </div>
          <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
            {number}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold font-display text-white mb-3 group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Bullet points */}
        <ul className="space-y-2.5 mb-8">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-xs text-slate-300">
              <span className="mt-0.5 p-0.5 rounded bg-indigo-500/20 text-indigo-400 shrink-0">
                <Check className="w-3 h-3" />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="pt-4 border-t border-white/5">
        <Link
          to={targetUrl}
          className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white/5 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all group-hover:border-indigo-500/30"
        >
          <span>Projektet szeretnék</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
};
