const BADGE_LABELS = {
  connected: { text: "🟢 Connected", className: "badge-connected" },
  disconnected: { text: "🔴 Offline", className: "badge-disconnected" },
  connecting: { text: "⏳ Connecting…", className: "badge-connecting" },
};

const DOT_COLORS = {
  connected: "#4caf50",
  disconnected: "#e74c3c",
  connecting: "#f39c12",
};

export default function NavbarComponent({
  connectionStatus,
  onExport,
  onReset,
}) {
  const badge = BADGE_LABELS[connectionStatus] || BADGE_LABELS.connecting;

  return (
    <nav className="navbar-bella d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div className="d-flex align-items-center gap-2">
        <span style={{ fontSize: "1.5rem" }} aria-hidden="true">
          🍕
        </span>
        <div>
          <div className="brand-title">Bella Napoli</div>
          <div className="brand-sub">Ristorante Italiano</div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span className={badge.className}>{badge.text}</span>

        <button
          type="button"
          className="btn-nav"
          onClick={onExport}
          title="Export chat as JSON"
        >
          <i className="bi bi-download me-1" />
          <span>Export</span>
        </button>

        <button
          type="button"
          className="btn-nav"
          onClick={onReset}
          title="Reset conversation"
        >
          <i className="bi bi-arrow-counterclockwise me-1" />
          <span>Reset</span>
        </button>

        <div className="luca-avatar-nav" aria-label="Luca the waiter">
          🧑‍🍳
          <span
            className="status-dot"
            style={{ background: DOT_COLORS[connectionStatus] }}
          />
        </div>
      </div>
    </nav>
  );
}
