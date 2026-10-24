import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import i18n from '../../i18n';
import { Button } from '../ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-lg bg-[#1B1F26] border border-white/15 p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold font-heading mb-2">
              {i18n.t('common.errorTitle')}
            </h1>
            <p className="text-sm text-[#8A93A3] mb-6">
              {i18n.t('common.errorDescription')}
            </p>
            <Button
              onClick={this.handleReload}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              {i18n.t('common.reloadPage')}
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
