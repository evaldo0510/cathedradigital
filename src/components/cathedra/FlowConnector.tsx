import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '@/constants';
import { Card, CardContent } from '@/components/ui/card';
import { RouteRecommendation } from '@/lib/smartRouter';

interface FlowConnectorProps {
  recommendations: RouteRecommendation[];
  title?: string;
  subtitle?: string;
}

const FlowConnector: React.FC<FlowConnectorProps> = ({
  recommendations,
  title = 'Continue sua experiência',
  subtitle = 'Com base no que você escreveu, sugerimos:',
}) => {
  const navigate = useNavigate();

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      className="space-y-spacing-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <div className="text-center space-y-spacing-2xs">
        <div className="flex items-center justify-center gap-spacing-xs">
          <Icons.Sparkles className="w-spacing-md h-spacing-md text-primary" />
          <h3 className="text-premium-sm font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-premium-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-spacing-sm">
        {recommendations.map((rec, i) => {
          const Icon = (Icons as any)[rec.icon] || Icons.Compass;
          return (
            <motion.div
              key={rec.route}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
            >
              <Card
                className="cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
                onClick={() => navigate(rec.route)}
              >
                <CardContent className="p-spacing-md flex items-center gap-spacing-sm">
                  <Icon className="w-spacing-lg h-spacing-lg text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-premium-sm font-semibold text-foreground truncate">{rec.label}</p>
                    <p className="text-premium-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                  <Icons.ChevronRight className="w-spacing-md h-spacing-md text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default FlowConnector;
