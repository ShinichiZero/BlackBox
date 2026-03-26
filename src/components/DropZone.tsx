import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

/**
 * Drag-and-drop upload area.
 * Only .gpx and .csv files are accepted; the file size pre-check is done inside
 * the useFlightData hook via fileValidator.ts.
 */
export function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFile(acceptedFiles[0]);
      }
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/gpx+xml': ['.gpx'],
      'text/csv': ['.csv'],
      'text/plain': ['.csv'],
    },
    multiple: false,
    disabled,
    // Prevent react-dropzone from reading the file automatically
    noClick: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        flex flex-col items-center justify-center gap-3
        border-2 border-dashed rounded-xl p-12 cursor-pointer
        transition-colors duration-200
        ${isDragActive
          ? 'border-sky-400 bg-sky-900/30 text-sky-300'
          : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-sky-500 hover:text-sky-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <svg
        className="w-14 h-14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
        />
      </svg>
      <p className="text-lg font-semibold">
        {isDragActive ? 'Drop your flight log here…' : 'Drag & drop a flight log'}
      </p>
      <p className="text-sm">Supports .gpx and .csv (max 5 MB)</p>
      <p className="text-xs text-slate-500">or click to browse files</p>
    </div>
  );
}
