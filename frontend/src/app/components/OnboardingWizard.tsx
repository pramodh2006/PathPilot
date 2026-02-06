import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Target, Clock, Calendar, AlertCircle } from 'lucide-react';
import type { MissionData } from '../App';

interface OnboardingWizardProps {
  onComplete: (data: MissionData) => void;
}

const steps = [
  { id: 'goal', title: 'Career Goal', subtitle: 'What position or skill are you targeting?' },
  { id: 'level', title: 'Current Level', subtitle: 'Where are you starting from?' },
  { id: 'availability', title: 'Time Commitment', subtitle: 'How many hours can you dedicate daily?' },
  { id: 'timeline', title: 'Target Timeline', subtitle: 'When do you want to achieve this?' },
  { id: 'constraints', title: 'Constraints', subtitle: 'Any limitations or priorities we should know?' }
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    goal: '',
    currentLevel: '',
    hoursPerDay: '',
    targetTimeline: '',
    constraints: ''
  });

  const isStepValid = () => {
    const step = steps[currentStep];
    if (step.id === 'goal') return formData.goal.trim().length > 0;
    if (step.id === 'level') return formData.currentLevel.trim().length > 0;
    if (step.id === 'availability') return formData.hoursPerDay.trim().length > 0 && parseFloat(formData.hoursPerDay) > 0;
    if (step.id === 'timeline') return formData.targetTimeline.trim().length > 0;
    if (step.id === 'constraints') return true; // Optional field
    return false;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete({
        ...formData,
        hoursPerDay: parseFloat(formData.hoursPerDay)
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'goal':
        return (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <input
              type="text"
              value={formData.goal}
              onChange={(e) => updateField('goal', e.target.value)}
              placeholder="e.g., Senior Product Manager at FAANG"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg"
              autoFocus
            />
          </div>
        );
      
      case 'level':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => (
                <button
                  key={level}
                  onClick={() => updateField('currentLevel', level)}
                  className={`px-6 py-4 rounded-xl border transition-all text-left ${
                    formData.currentLevel === level
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-medium">{level}</div>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.currentLevel !== 'Beginner' && formData.currentLevel !== 'Intermediate' && formData.currentLevel !== 'Advanced' && formData.currentLevel !== 'Expert' ? formData.currentLevel : ''}
              onChange={(e) => updateField('currentLevel', e.target.value)}
              placeholder="Or describe your current position..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        );
      
      case 'availability':
        return (
          <div className="space-y-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-4">
              <input
                type="number"
                value={formData.hoursPerDay}
                onChange={(e) => updateField('hoursPerDay', e.target.value)}
                placeholder="2"
                min="0.5"
                max="24"
                step="0.5"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg"
              />
              <p className="text-sm text-zinc-500">Hours per day you can commit to learning and execution</p>
            </div>
            {formData.hoursPerDay && parseFloat(formData.hoursPerDay) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-sm text-indigo-300"
              >
                ≈ {(parseFloat(formData.hoursPerDay) * 7).toFixed(1)} hours per week
              </motion.div>
            )}
          </div>
        );
      
      case 'timeline':
        return (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['3 months', '6 months', '1 year', '2 years'].map((timeline) => (
                <button
                  key={timeline}
                  onClick={() => updateField('targetTimeline', timeline)}
                  className={`px-6 py-4 rounded-xl border transition-all ${
                    formData.targetTimeline === timeline
                      ? 'bg-indigo-500/10 border-indigo-500 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {timeline}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={!['3 months', '6 months', '1 year', '2 years'].includes(formData.targetTimeline) ? formData.targetTimeline : ''}
              onChange={(e) => updateField('targetTimeline', e.target.value)}
              placeholder="Or specify custom timeline..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        );
      
      case 'constraints':
        return (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <textarea
              value={formData.constraints}
              onChange={(e) => updateField('constraints', e.target.value)}
              placeholder="e.g., Full-time job, family commitments, budget constraints..."
              rows={4}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
            <p className="text-sm text-zinc-500">Optional - helps us create a more realistic plan</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="onboarding-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#onboarding-grid)" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="px-6 md:px-12 pt-8 pb-6 border-b border-zinc-900">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">PathPilot</span>
              </div>
              <div className="text-sm text-zinc-500">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 md:px-12 py-12">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-4xl font-semibold text-white mb-3">
                  {steps[currentStep].title}
                </h2>
                <p className="text-lg text-zinc-400 mb-12">
                  {steps[currentStep].subtitle}
                </p>
                
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 md:px-12 py-6 border-t border-zinc-900">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Generate Plan' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
