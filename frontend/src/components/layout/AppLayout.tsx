import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

export const AppLayout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mdp_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mdp_sidebar_collapsed', String(next));
      } catch {
        // Ignore if storage full or disabled
      }
      return next;
    });
  };

  const handleToggleMobile = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <AppHeader
          onOpenSearch={() => setSearchOpen(true)}
          onToggleMobile={handleToggleMobile}
          onToggleCollapse={handleToggleCollapse}
          isCollapsed={collapsed}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Ctrl + K Global Search Modal */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
};
