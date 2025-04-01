interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
  
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
}

interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
  getFilePath(): Promise<string>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
  
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  
  entries(): AsyncIterable<[string, FileSystemHandle]>;
  keys(): AsyncIterable<string>;
  values(): AsyncIterable<FileSystemHandle>;
  
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface DirectoryPickerOptions {
  id?: string;
  startIn?: FileSystemHandle | string;
  mode?: 'read' | 'readwrite';
}

interface FilePickerOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  types?: FilePickerAcceptType[];
  startIn?: FileSystemHandle | string;
  id?: string;
}

interface Window {
  showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle>;
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
} 