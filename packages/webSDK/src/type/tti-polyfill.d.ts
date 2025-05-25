// tti-polyfill.d.ts
declare module "tti-polyfill" {
  export function getFirstConsistentlyInteractive(opts?: {
    minValue?: number;
  }): Promise<number>;
}
