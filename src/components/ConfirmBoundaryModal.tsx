import { X, AlertCircle, Check } from "lucide-react";
import { useEffect, useRef } from "react";

interface BoundaryMetrics {
  hectares: number;
  perimeter: number;
  coordinates?: { lat: number; lng: number }[];
}

interface ConfirmBoundaryModalProps {
  showModal: boolean;
  metrics: BoundaryMetrics | null;
  onConfirm: () => void;
  onRedefine: () => void;
  onCancel: () => void;
}

export function ConfirmBoundaryModal({
  showModal,
  metrics,
  onConfirm,
  onRedefine,
  onCancel,
}: ConfirmBoundaryModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (showModal && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [showModal]);

  // Keyboard navigation
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
      if (e.key === "Enter" && e.ctrlKey) {
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, onCancel, onConfirm]);

  if (!showModal || !metrics) return null;

  const formatArea = (hectares: number) => {
    if (hectares < 1) {
      return `${(hectares * 10000).toFixed(0)} m²`;
    }
    return `${hectares.toFixed(2)} ha`;
  };

  const formatPerimeter = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        ref={modalRef}
        className="confirm-boundary-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="boundary-modal-title"
        aria-describedby="boundary-modal-description"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <Check size={24} className="modal-icon-success" />
            <h2 id="boundary-modal-title">Confirm Site Boundary</h2>
          </div>
          <button
            className="modal-close"
            onClick={onCancel}
            aria-label="Close modal"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-content" id="boundary-modal-description">
          <div className="boundary-metrics-container">
            <div className="metric-card">
              <div className="metric-label">Site Area</div>
              <div className="metric-value">{formatArea(metrics.hectares)}</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Perimeter</div>
              <div className="metric-value">
                {formatPerimeter(metrics.perimeter)}
              </div>
            </div>

            {metrics.coordinates && metrics.coordinates.length > 0 && (
              <div className="metric-card full-width">
                <div className="metric-label">Boundary Points</div>
                <div className="coordinates-list">
                  {metrics.coordinates.map((coord, idx) => (
                    <div key={idx} className="coordinate-item">
                      <span className="coord-index">{idx + 1}.</span>
                      <span className="coord-value">
                        {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="confirmation-notice">
              <AlertCircle size={18} />
              <p>
                Review the boundary details. You can confirm to proceed or
                redefine to adjust the boundary.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            aria-label="Cancel boundary confirmation"
          >
            Cancel
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onRedefine}
            aria-label="Redefine site boundary"
          >
            Redefine
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className="primary"
            onClick={onConfirm}
            aria-label="Confirm site boundary"
          >
            Confirm Boundary
          </button>
        </div>

        <div className="modal-hint">
          <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to confirm · <kbd>Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
}
