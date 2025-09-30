import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
}

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ 
  achievement, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      setShowConfetti(true);
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 2000);
      
      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -10,
                    rotate: 0,
                    scale: 1
                  }}
                  animate={{
                    y: window.innerHeight + 10,
                    rotate: 360,
                    scale: 0
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          )}

          {/* Achievement Toast */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              transition={{ 
                type: "spring", 
                damping: 15, 
                stiffness: 300 
              }}
              className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-2xl shadow-2xl p-8 max-w-md w-full pointer-events-auto relative overflow-hidden"
            >
              {/* Background Animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 opacity-50"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              {/* Content */}
              <div className="relative z-10 text-center text-white">
                {/* Icon with Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.2,
                    type: "spring",
                    damping: 10,
                    stiffness: 200
                  }}
                  className="text-6xl mb-4"
                >
                  {achievement.icon}
                </motion.div>

                {/* Trophy Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center mb-4"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Trophy className="text-white" size={32} />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl font-bold mb-2"
                >
                  🎉 Conquista Desbloqueada!
                </motion.h2>

                {/* Achievement Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-xl font-semibold mb-2"
                >
                  {achievement.title}
                </motion.h3>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="text-white/90 mb-4"
                >
                  {achievement.description}
                </motion.p>

                {/* Points */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="text-yellow-200" size={24} />
                    <span className="text-2xl font-bold">+{achievement.points}</span>
                    <span className="text-lg">pontos</span>
                  </div>
                </motion.div>

                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  <Button
                    onClick={handleClose}
                    className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-6 py-2"
                  >
                    Ver Todas as Conquistas
                  </Button>
                </motion.div>

                {/* Sparkles Animation */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`sparkle-${i}`}
                      className="absolute"
                      style={{
                        left: `${20 + (i * 10)}%`,
                        top: `${20 + (i * 8)}%`
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        rotate: [0, 180, 360],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <Sparkles className="text-white/60" size={16} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};