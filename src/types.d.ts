declare module 'inquirer-datepicker-prompt';
declare module 'gradient-string';
declare module 'terminal-link';
declare module 'terminal-image' {
  export function buffer(
    imageBuffer: Uint8Array,
    options?: { width?: string | number; height?: string | number }
  ): Promise<string>;
  
  export function file(
    filePath: string,
    options?: { width?: string | number; height?: string | number }
  ): Promise<string>;
  
  // For older versions compatibility
  export function fromURL(
    url: string,
    options?: { width?: string | number; height?: string | number }
  ): Promise<string>;
} 