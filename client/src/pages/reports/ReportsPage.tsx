import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ToastStack from '../../components/layout/ToastStack';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import * as reportService from '../../services/reportService';
import {
  removeReportRequest,
  setReports,
  upsertReportRequest,
} from '../../store/reportsSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type { ReportRequest } from '../../types/index';
import ReportGeneratorForm from './ReportGeneratorForm';
import ReportHistoryTable from './ReportHistoryTable';

export default function ReportsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const reports = useSelector((state: RootState) => state.reports.items);
  const pagination = useSelector((state: RootState) => state.reports.pagination);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const data = await reportService.getReports({ page, pageSize: 10 });
      dispatch(setReports(data));
    } catch {
      setLoadError('Unable to load report history.');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, page]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const handleReportCreated = (report: ReportRequest) => {
    dispatch(upsertReportRequest(report));
    setActionError('');
  };

  const handleReportUpdated = (report: ReportRequest) => {
    dispatch(upsertReportRequest(report));
    setActionError('');
  };

  const handleReportDeleted = (reportId: number) => {
    dispatch(removeReportRequest(reportId));
    setActionError('');
    void loadReports();
  };

  if (!user) {
    return null;
  }

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading reports" size="lg" />
      </div>
    );
  }

  if (loadError && reports.length === 0) {
    return <EmptyState title="Reports unavailable" description={loadError} />;
  }

  return (
    <>
      <div className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Generate Event Attendance or Player Participation exports, download them as PDF or DOCX, and
        send completed reports by email.
      </p>

      {actionError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      ) : null}

      <ReportGeneratorForm
        onReportCreated={handleReportCreated}
        onSuccess={(message) => showToast({ title: 'Report ready', message, variant: 'success' })}
      />

      <ReportHistoryTable
        reports={reports}
        page={pagination.page}
        totalPages={pagination.totalPages}
        defaultRecipientEmail={user.email}
        onPageChange={setPage}
        onReportUpdated={handleReportUpdated}
        onReportDeleted={handleReportDeleted}
        onActionError={setActionError}
      />
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
