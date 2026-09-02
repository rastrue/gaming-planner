import { useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import ModalDialog from '../../components/ui/ModalDialog';
import Pagination from '../../components/ui/Pagination';
import TextInput from '../../components/ui/TextInput';
import {
  formatDeliveryChannel,
  formatReportFormat,
  formatReportKind,
  formatReportStatus,
} from '../../utils/labels';
import * as reportService from '../../services/reportService';
import { getActionErrorMessage } from '../../utils/apiErrors';
import type { ReportRequest, ReportStatus } from '../../types/index';

const dateLocale = 'en-US';

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString(dateLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function reportStatusVariant(status: ReportStatus) {
  switch (status) {
    case 'GENERATED':
      return 'success';
    case 'EMAILED':
      return 'info';
    case 'QUEUED':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'default';
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export interface ReportHistoryTableProps {
  reports: ReportRequest[];
  totalReports: number;
  page: number;
  totalPages: number;
  defaultRecipientEmail?: string;
  onPageChange: (page: number) => void;
  onReportUpdated: (report: ReportRequest) => void;
  onReportDeleted: (reportId: number) => void;
  onActionError: (message: string) => void;
  onActionSuccess?: (message: string) => void;
}

export default function ReportHistoryTable({
  reports,
  totalReports,
  page,
  totalPages,
  defaultRecipientEmail = '',
  onPageChange,
  onReportUpdated,
  onReportDeleted,
  onActionError,
  onActionSuccess,
}: ReportHistoryTableProps) {
  const [emailTarget, setEmailTarget] = useState<ReportRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReportRequest | null>(null);
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openEmailModal = (report: ReportRequest) => {
    setEmailTarget(report);
    setRecipientEmail(report.recipientEmail ?? defaultRecipientEmail);
  };

  const handleDownload = async (report: ReportRequest) => {
    setIsSubmitting(true);

    try {
      const download = await reportService.downloadReport(report.id);
      triggerBlobDownload(download.blob, download.fileName);
    } catch (error) {
      const message = getActionErrorMessage(error, 'Unable to download report.');
      if (message) {
        onActionError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmail = async () => {
    if (!emailTarget) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await reportService.emailReport(emailTarget.id, {
        recipientEmail: recipientEmail.trim(),
      });
      onReportUpdated(updated);

      if (updated.status === 'FAILED') {
        onActionError(updated.failedReason ?? 'Unable to email report.');
      } else {
        setEmailTarget(null);
        onActionSuccess?.(`Report sent to ${recipientEmail.trim()}.`);
      }
    } catch (error) {
      const message = getActionErrorMessage(error, 'Unable to email report.');
      if (message) {
        onActionError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsSubmitting(true);

    try {
      await reportService.deleteReport(deleteTarget.id);
      onReportDeleted(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      const message = getActionErrorMessage(error, 'Unable to delete report.');
      if (message) {
        onActionError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card title="Report history">
        {totalReports === 0 ? (
          <EmptyState title="No reports yet" />
        ) : (
          <>
            <DataTable<ReportRequest>
              caption="Generated report requests"
              data={reports}
              getRowKey={(report) => report.id}
              columns={[
                {
                  key: 'kind',
                  header: 'Report',
                  mobileLabel: 'Report',
                  render: (report) => (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatReportKind(report.reportKind)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatReportFormat(report.outputFormat)} · {formatDeliveryChannel(report.deliveryChannel)}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (report) => (
                    <Badge variant={reportStatusVariant(report.status)}>
                      {formatReportStatus(report.status)}
                    </Badge>
                  ),
                },
                {
                  key: 'requestedAt',
                  header: 'Requested',
                  hideOnMobile: true,
                  render: (report) => formatDateTime(report.requestedAt),
                },
                {
                  key: 'delivery',
                  header: 'Delivery',
                  hideOnMobile: true,
                  render: (report) => (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>Generated: {formatDateTime(report.generatedAt)}</p>
                      <p>Sent: {formatDateTime(report.emailedAt)}</p>
                      {report.failedReason ? (
                        <p className="text-red-600 dark:text-red-400">{report.failedReason}</p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  mobileLabel: 'Actions',
                  render: (report) => {
                    const canDownload = report.status === 'GENERATED' || report.status === 'EMAILED';
                    const isBusy = isSubmitting;

                    return (
                      <div className="flex flex-wrap gap-2">
                        {canDownload ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={isBusy}
                              onClick={() => void handleDownload(report)}
                            >
                              Download {report.outputFormat}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => openEmailModal(report)}
                            >
                              Email
                            </Button>
                          </>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={isBusy}
                          onClick={() => setDeleteTarget(report)}
                        >
                          Delete
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
            />

            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
          </>
        )}
      </Card>

      <ModalDialog
        open={Boolean(emailTarget)}
        title="Email report"
        onClose={() => setEmailTarget(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEmailTarget(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={isSubmitting} onClick={() => void handleEmail()}>
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Send{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {emailTarget ? formatReportKind(emailTarget.reportKind) : ''}
            </span>{' '}
            ({emailTarget?.outputFormat}) to the recipient.
          </p>
          <TextInput
            label="Recipient email"
            name="recipientEmail"
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            required
          />
        </div>
      </ModalDialog>

      <ModalDialog
        open={Boolean(deleteTarget)}
        title="Delete report"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" disabled={isSubmitting} onClick={() => void handleDelete()}>
              Delete report
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Delete this report request and its associated export file?
        </p>
      </ModalDialog>
    </>
  );
}
