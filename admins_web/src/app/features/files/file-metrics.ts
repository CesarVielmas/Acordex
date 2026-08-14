import { FileItem } from '../../core/models/admin.models';
import { StorageBreakdownItem } from '../../core/models/file.models';

export function calculateFilesKPIs(files: FileItem[]) {
  const totalFiles = files.length;
  const contractsCount = files.filter(f => f.category === 'Contratos').length;
  const ridersCount = files.filter(f => f.category === 'Riders Técnicos').length;
  const mediaCount = files.filter(f => f.category === 'Fotos' || f.category === 'Videos').length;
  const totalDownloads = files.reduce((sum, f) => sum + (f.downloadCount || 0), 0);

  return {
    totalFiles,
    contractsCount,
    ridersCount,
    mediaCount,
    totalDownloads
  };
}

export function getFileCategoryIcon(category: string): string {
  switch (category) {
    case 'Contratos': return 'description';
    case 'Riders Técnicos': return 'tune';
    case 'Fotos': return 'photo_library';
    case 'Videos': return 'video_library';
    case 'Reportes & Facturas': return 'receipt_long';
    case 'Press Kits': return 'folder_zip';
    default: return 'insert_drive_file';
  }
}

export function getFileCategoryBadgeClass(category: string): string {
  switch (category) {
    case 'Contratos': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    case 'Riders Técnicos': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    case 'Fotos': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'Videos': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    case 'Reportes & Facturas': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'Press Kits': return 'bg-primary/20 text-primary border-primary/40';
    default: return 'bg-surface-container-highest text-outline border-outline-variant/30';
  }
}

export function calculateStorageBreakdown(files: FileItem[]): StorageBreakdownItem[] {
  const categories: StorageBreakdownItem[] = [
    { category: 'Videos', count: 0, totalSizeBytes: 120.5 * 1024 * 1024, totalSizeFormatted: '120.5 MB', percentage: 65, color: '#f43f5e' },
    { category: 'Fotos', count: 0, totalSizeBytes: 45.8 * 1024 * 1024, totalSizeFormatted: '45.8 MB', percentage: 24, color: '#10b981' },
    { category: 'Press Kits', count: 0, totalSizeBytes: 8.1 * 1024 * 1024, totalSizeFormatted: '8.1 MB', percentage: 5, color: '#eab308' },
    { category: 'Riders Técnicos', count: 0, totalSizeBytes: 7.9 * 1024 * 1024, totalSizeFormatted: '7.9 MB', percentage: 4, color: '#06b6d4' },
    { category: 'Contratos', count: 0, totalSizeBytes: 2.4 * 1024 * 1024, totalSizeFormatted: '2.4 MB', percentage: 1.5, color: '#a855f7' },
    { category: 'Reportes & Facturas', count: 0, totalSizeBytes: 1.2 * 1024 * 1024, totalSizeFormatted: '1.2 MB', percentage: 0.5, color: '#f59e0b' }
  ];

  for (const f of files) {
    const item = categories.find(c => c.category === f.category);
    if (item) item.count++;
  }

  return categories;
}
