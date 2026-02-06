import { motion } from 'motion/react';
import { ArrowRight, Target, TrendingUp, Zap } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Trajectory Path - Subtle */}
        <motion.svg 
          className="absolute top-0 left-0 w-full h-full opacity-5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
        >
          <motion.path
            d="M -100 600 Q 300 400 600 300 T 1200 200 T 1800 150"
            stroke="url(#gradient)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-4xl"
        >
          {/* Logo */}
          <motion.div 
            className="mb-8 flex items-center justify-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">PathPilot</h1>
          </motion.div>

          {/* Hero Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-6xl md:text-7xl font-semibold text-white mb-6 tracking-tight leading-[1.1]"
          >
            Take Control of Your
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Career Trajectory
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered mission planning for ambitious professionals.
            From goal to execution, systematically.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            onClick={onStart}
            className="group relative px-8 py-4 bg-white text-black rounded-xl font-medium text-lg hover:scale-[1.02] transition-transform duration-200 flex items-center gap-3 mx-auto overflow-hidden"
          >
            <span className="relative z-10">Initialize Mission</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          </motion.button>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-16"
          >
            {[
              { icon: TrendingUp, text: 'Auto-Scheduled Execution' },
              { icon: Target, text: 'Milestone Tracking' },
              { icon: Zap, text: 'AI-Powered Planning' }
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-zinc-400 text-sm"
              >
                <feature.icon className="w-4 h-4" />
                <span>{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
