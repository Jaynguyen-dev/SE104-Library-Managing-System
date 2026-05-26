import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--sf-bg)", padding: "32px" }}>
          <div style={{ maxWidth: "420px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12, color: "var(--sf-red)" }}>
              <i className="ti ti-alert-triangle"></i>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--sf-text)", margin: "0 0 8px", letterSpacing: "-0.3px" }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "var(--sf-text-2)", lineHeight: 1.5, margin: "0 0 20px" }}>
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            {this.state.error?.message && (
              <pre style={{ fontSize: 12, background: "var(--sf-card)", padding: "16px", borderRadius: "8px", textAlign: "left", overflow: "auto", maxHeight: "160px", marginBottom: "20px", color: "var(--sf-text-2)", border: "1px solid var(--sf-border)" }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
              style={{ padding: "10px 24px" }}
            >
              <i className="ti ti-refresh"></i> Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
