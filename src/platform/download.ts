export function downloadText(name: string, type: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  /* revoking at once cancels the download in some browsers */
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
