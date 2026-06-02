import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const AboveTheFoldTest: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    // Wait for content to settle
    const timer = setTimeout(() => {
      const header = document.querySelector('header');
      const headerHeight = header?.getBoundingClientRect().height || 0;
      const viewportHeight = window.innerHeight;
      const foldThreshold = viewportHeight * 0.15; // Tightened: Premium requirement is content very high

      const mainContent = document.getElementById('main-content');
      const contentTop = mainContent?.getBoundingClientRect().top || 0;

      // Detection for Layout Shifts
      const entries = performance.getEntriesByType('layout-shift');
      const cls = entries.reduce((sum, entry: any) => sum + (entry.hadRecentInput ? 0 : entry.value), 0);

      const results = {
        path: location.pathname,
        headerHeight,
        contentTop,
        viewportHeight,
        cls,
        status: (contentTop < foldThreshold && cls < 0.05) ? 'PASS' : 'FAIL',
        details: `Top: ${contentTop}px (Fold: ${foldThreshold.toFixed(0)}px), CLS: ${cls.toFixed(4)}`
      };

      console.log('--- PREMIUM SPRINT AUDIT ---');
      console.log(JSON.stringify(results, null, 2));
      setReport(results);
    }, 3000);


    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[1000] p-2 bg-black/80 text-white text-[8px] font-mono pointer-events-none">
      {report && (
        <div className={report.status === 'PASS' ? 'text-green-400' : 'text-red-400'}>
          {report.status}: {report.details}
        </div>
      )}
    </div>
  );
};

export default AboveTheFoldTest;
