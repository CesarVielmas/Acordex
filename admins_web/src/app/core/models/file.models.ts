export type FileCategoryType =
  | 'Contratos'
  | 'Riders Técnicos'
  | 'Fotos'
  | 'Videos'
  | 'Reportes & Facturas'
  | 'Press Kits';

export type FileFormat = 'PDF' | 'JPG' | 'PNG' | 'MP4' | 'ZIP' | 'XML' | 'DOCX';

export type FileStatus = 'Vigente' | 'Borrador' | 'Archivado';

export interface DetailedFileItem {
  id: string;
  fileName: string;
  groupName: string;
  category: FileCategoryType;
  format: FileFormat;
  size: string; // ej. '4.2 MB'
  sizeBytes?: number;
  uploadDate: string;
  uploadedBy?: string;
  status: FileStatus;
  downloadCount: number;
  tags?: string[];
  description?: string;
  url: string;
  previewUrl?: string;
}

export interface StorageBreakdownItem {
  category: FileCategoryType;
  count: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  percentage: number;
  color: string;
}
