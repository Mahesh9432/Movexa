import React from 'react';

export default function PageHeader({ category, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E3ED] pb-4">
      <div>
        {category && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#087F73]">
            {category}
          </p>
        )}
        <h1 className="text-3xl font-bold mt-1 text-[#20252B]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}