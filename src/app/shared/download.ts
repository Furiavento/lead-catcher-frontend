/** Saves a Blob as a file through a temporary link. Browser only. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Revoking synchronously can cancel the download in some browsers (Firefox).
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
