'use client';

import React, { useState, useEffect } from 'react';
import { getStoredActivities, addCustomActivity } from '@/lib/activities';
import { SearchableSelect } from './SearchableSelect';

interface ActivitySelectProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  includeAllOption?: boolean;
}

export function ActivitySelect({
  value,
  onChange,
  className = '',
  placeholder = 'Pilih Aktivitas...',
  includeAllOption = false,
}: ActivitySelectProps) {
  const [activities, setActivities] = useState<string[]>([]);

  const loadActivities = () => {
    setActivities(getStoredActivities());
  };

  useEffect(() => {
    loadActivities();
    const handleUpdate = () => loadActivities();
    window.addEventListener('activities-updated', handleUpdate);
    return () => window.removeEventListener('activities-updated', handleUpdate);
  }, []);

  const options = React.useMemo(() => {
    const list: string[] = [];
    if (includeAllOption) list.push('All');
    activities.forEach(a => {
      if (!list.includes(a)) list.push(a);
    });
    if (value && value !== 'All' && !list.includes(value)) {
      list.push(value);
    }
    return list.map(item => ({
      value: item,
      label: item === 'All' ? 'Semua Aktivitas' : item
    }));
  }, [activities, includeAllOption, value]);

  const handleCustomAdd = (newAct: string) => {
    addCustomActivity(newAct);
  };

  return (
    <SearchableSelect
      value={value}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Cari atau tambah aktivitas..."
      className={className}
      allowCustomAdd={true}
      onCustomAdd={handleCustomAdd}
    />
  );
}
