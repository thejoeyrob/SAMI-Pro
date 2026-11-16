import { X, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
export function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  ...rest
}: any) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      <Icon size={18} />
    </button>
  );
}
export function Field({ label, children, hint }: any) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Status({ state, children }: any) {
  return (
    <span className={`status status-${state}`}>
      <i />
      {children}
    </span>
  );
}
export function Modal({ title, onClose, children, wide = false }: any) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const root = ref.current;
    root?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const els = [
          ...root!.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),textarea,select,[tabindex="0"]',
          ),
        ].filter((el) => el.offsetParent !== null);
        if (!els.length) {
          e.preventDefault();
          return;
        }
        const first = els[0],
          last = els.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === root)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <header>
          <h2>{title}</h2>
          <IconButton icon={X} label="Close dialog" onClick={onClose} />
        </header>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
export function Busy({ children }: any) {
  return (
    <span className="busy">
      <LoaderCircle size={16} className="spin" />
      {children}
    </span>
  );
}
