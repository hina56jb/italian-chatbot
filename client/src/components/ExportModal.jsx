export default function ExportModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div
      className="export-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="export-modal card border-0 rounded-4 shadow">
        <div className="export-modal-header">
          <h5 id="export-modal-title" className="mb-0 fs-6">
            <i className="bi bi-file-earmark-code me-2" />
            Export Ready
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className="export-modal-body text-center py-3">
          <div style={{ fontSize: "2.8rem" }} aria-hidden="true">
            📄
          </div>
          <p className="mt-2 mb-0" style={{ fontSize: "0.84rem" }}>
            Conversation saved as
            <br />
            <strong>bella_napoli_chat.json</strong>
          </p>
        </div>
        <div className="export-modal-footer">
          <button
            type="button"
            className="btn btn-sm w-100 rounded-3 text-white export-modal-btn"
            onClick={onClose}
          >
            Perfetto! 🍕
          </button>
        </div>
      </div>
    </div>
  );
}
