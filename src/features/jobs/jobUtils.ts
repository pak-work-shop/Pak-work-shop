import type { BadgeVariant } from '../../components/ui/Badge';
import type {
  InvoiceStatus,
  JobItemType,
  JobStatus,
  PaymentMethod,
} from '../../types/database';

export const FORWARD_JOB_STAGES: JobStatus[] = [
  'received',
  'inspection',
  'awaiting_approval',
  'in_progress',
  'quality_check',
  'ready',
  'delivered',
];

export const ALL_JOB_STATUSES: JobStatus[] = [
  'received',
  'inspection',
  'awaiting_approval',
  'in_progress',
  'quality_check',
  'ready',
  'delivered',
  'on_hold',
  'cancelled',
];

export const ALL_INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'void',
];

export const JOB_ITEM_TYPES: JobItemType[] = [
  'service',
  'part',
  'labor',
  'other',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'cash',
  'bank_transfer',
  'jazzcash',
  'easypaisa',
  'card',
  'other',
];

export const DEMO_JOB_SAMPLES: Array<{
  jobNo: string;
  phone: string;
  vehicle: string;
  status: JobStatus;
}> = [
  {
    jobNo: 'JC-000201',
    phone: '03000000001',
    vehicle: 'Toyota Corolla (2021)',
    status: 'in_progress',
  },
  {
    jobNo: 'JC-000202',
    phone: '03000000002',
    vehicle: 'Honda Civic (2020)',
    status: 'inspection',
  },
  {
    jobNo: 'JC-000203',
    phone: '03000000003',
    vehicle: 'Suzuki Cultus (2019)',
    status: 'awaiting_approval',
  },
  {
    jobNo: 'JC-000204',
    phone: '03000000004',
    vehicle: 'Kia Sportage (2022)',
    status: 'ready',
  },
  {
    jobNo: 'JC-000205',
    phone: '03000000005',
    vehicle: 'Toyota Yaris (2022)',
    status: 'delivered',
  },
  {
    jobNo: 'JC-000208',
    phone: '03000000008',
    vehicle: 'Honda City (2019)',
    status: 'on_hold',
  },
];

export function getJobStageRank(status: JobStatus): number | null {
  switch (status) {
    case 'received':
      return 1;
    case 'inspection':
      return 2;
    case 'awaiting_approval':
      return 3;
    case 'in_progress':
      return 4;
    case 'quality_check':
      return 5;
    case 'ready':
      return 6;
    case 'delivered':
      return 7;
    default:
      return null;
  }
}

/**
 * Mirrors server-side transition rules in public.admin_update_job_status:
 * - Terminal states ('delivered', 'cancelled') cannot transition out.
 * - From 'on_hold': can return to any active stage ('received'..'ready', rank 1..6) or 'cancelled'.
 * - From any active stage (rank 1..6): can move to any later forward stage (rank > currentRank),
 *   or 'on_hold' (if rank < 7), or 'cancelled'.
 */
export function getAllowedJobTransitions(current: JobStatus): JobStatus[] {
  if (current === 'delivered' || current === 'cancelled') {
    return [];
  }

  if (current === 'on_hold') {
    return [
      'received',
      'inspection',
      'awaiting_approval',
      'in_progress',
      'quality_check',
      'ready',
      'cancelled',
    ];
  }

  const currentRank = getJobStageRank(current);
  if (currentRank === null) return [];

  const forwardStages = FORWARD_JOB_STAGES.filter((st) => {
    const r = getJobStageRank(st);
    return r !== null && r > currentRank;
  });

  const extras: JobStatus[] = [];
  if (currentRank < 7) {
    extras.push('on_hold');
  }
  extras.push('cancelled');

  return [...forwardStages, ...extras];
}

export function getJobStatusBadgeVariant(status: JobStatus): BadgeVariant {
  switch (status) {
    case 'ready':
    case 'delivered':
      return 'success';
    case 'in_progress':
    case 'quality_check':
    case 'inspection':
      return 'primary';
    case 'awaiting_approval':
    case 'on_hold':
    case 'received':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function getInvoiceStatusBadgeVariant(
  status: InvoiceStatus
): BadgeVariant {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partially_paid':
      return 'primary';
    case 'issued':
      return 'warning';
    case 'void':
      return 'danger';
    case 'draft':
    default:
      return 'neutral';
  }
}

export function formatPKR(amount: number | null | undefined): string {
  const num = Number(amount ?? 0);
  if (!Number.isFinite(num)) return 'Rs. 0';
  return `Rs. ${Math.round(num).toLocaleString('en-PK')}`;
}

export function formatKarachiDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Karachi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return iso;
  }
}

export function isMissingDatabaseObjectsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; details?: string };
  const code = String(e.code || '');
  const msg = `${e.message || ''} ${e.details || ''}`.toLowerCase();
  return (
    code === '42P01' ||
    code === '42883' ||
    code === 'PGRST202' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('could not find the function')
  );
}
