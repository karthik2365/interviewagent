"use client";

interface GazeWarningProps {
  show: boolean;
  onDismiss: () => void;
  violationCount: number;
}

export default function GazeWarning({ show, onDismiss, violationCount }: GazeWarningProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-red-500/30 p-8 max-w-md mx-4 text-center animate-in fade-in zoom-in duration-200">
        {/* Warning icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          Please Look at the Screen
        </h3>
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
          We detected that you may be looking away from the screen. Please keep your face visible and centered in the camera during the interview.
        </p>
        
        {violationCount > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-4 py-2 mb-4">
            <span className="text-sm text-orange-400 font-medium">
              ⚠️ Violation #{violationCount} (Demo Mode)
            </span>
            <p className="text-xs text-gray-500 mt-1">
              In a production environment, this would flag your session for review.
            </p>
          </div>
        )}

        <button
          onClick={onDismiss}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold text-sm transition-all"
        >
          I'm Looking at the Screen
        </button>
      </div>
    </div>
  );
}
