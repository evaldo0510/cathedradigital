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
      const foldThreshold = viewportHeight * 0.5; // Content should start well before 50% height

      const mainContent = document.getElementById('main-content');
      const contentTop = mainContent?.getBoundingClientRect().top || 0;

      const results = {
        path: location.pathname,
        headerHeight,
        contentTop,
        viewportHeight,
        status: contentTop < foldThreshold ? 'PASS' : 'FAIL',
        details: `Content starts at ${contentTop}px (Viewport: ${viewportHeight}px, Fold: ${foldThreshold}px)`
      };

      console.log('--- ABOVE THE FOLD TEST ---');
      console.log(JSON.stringify(results, null, 2));
      setReport(results);
    }, 2000);

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
