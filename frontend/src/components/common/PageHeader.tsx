import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#94A3B8' }} />}
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((b, i) =>
            b.href ? (
              <MuiLink
                key={i}
                component={Link}
                to={b.href}
                underline="hover"
                sx={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}
              >
                {b.label}
              </MuiLink>
            ) : (
              <Typography key={i} sx={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>
                {b.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.65rem', fontWeight: 700, color: '#0F172A' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>{action}</Box>}
      </Box>
    </Box>
  );
};
