import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  iconBgClass?: string;
  iconColorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  iconBgClass = 'bg-primary/10',
  iconColorClass = 'text-primary',
}) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${iconBgClass}`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        <div>
          <p className="text-sm text-primary font-medium">{label}</p>
          <p className="text-2xl font-heading font-bold text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
