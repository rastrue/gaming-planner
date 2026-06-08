import type {
  CreateReportInput,
  EmailReportInput,
  ListReportsQuery,
  PaginatedReports,
  ReportDownload,
  ReportRequest,
  UpdateReportInput,
} from '../types/index';
import { apiRequest, apiRequestBlob, apiRequestVoid } from './apiClient';

export async function getReports(query: ListReportsQuery = {}): Promise<PaginatedReports> {
  return apiRequest<PaginatedReports>('/reports', {}, query);
}

export async function getReportById(id: number): Promise<ReportRequest> {
  const data = await apiRequest<{ report: ReportRequest }>(`/reports/${id}`);
  return data.report;
}

export async function createReport(input: CreateReportInput): Promise<ReportRequest> {
  const data = await apiRequest<{ report: ReportRequest }>('/reports', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.report;
}

export async function updateReport(id: number, input: UpdateReportInput): Promise<ReportRequest> {
  const data = await apiRequest<{ report: ReportRequest }>(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

  return data.report;
}

export async function deleteReport(id: number): Promise<void> {
  await apiRequestVoid(`/reports/${id}`, { method: 'DELETE' });
}

export async function emailReport(id: number, input: EmailReportInput = {}): Promise<ReportRequest> {
  const data = await apiRequest<{ report: ReportRequest }>(`/reports/${id}/email`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return data.report;
}

export async function downloadReport(id: number): Promise<ReportDownload> {
  const { blob, fileName } = await apiRequestBlob(`/reports/${id}/download`);
  return { blob, fileName };
}
