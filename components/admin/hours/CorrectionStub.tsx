import React from "react";
import { AlertCircle } from "lucide-react";

interface CorrectionStubProps {
  from: string;
  to: string;
  pause: string;
  comment: string;
  timestamp: string;
}

/**
 * CorrectionStub Component
 * Displays admin corrections to hours entries
 * Shown as a red/warning-colored block beneath the original entry
 */
export function CorrectionStub({
  from,
  to,
  pause,
  comment,
  timestamp,
}: CorrectionStubProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-2 rounded-r-md">
      <div className="flex gap-2">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-red-800">
              Korrektur (Admin)
            </span>
            <span className="text-xs text-red-600">{timestamp}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-2 text-sm">
            <div>
              <span className="text-red-700 font-medium">Von:</span>{" "}
              <span className="text-red-900">{from}</span>
            </div>
            <div>
              <span className="text-red-700 font-medium">Bis:</span>{" "}
              <span className="text-red-900">{to}</span>
            </div>
            <div>
              <span className="text-red-700 font-medium">Pause:</span>{" "}
              <span className="text-red-900">{pause}</span>
            </div>
          </div>
          
          {comment && (
            <div className="text-sm">
              <span className="text-red-700 font-medium">Kommentar:</span>{" "}
              <span className="text-red-900">{comment}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

