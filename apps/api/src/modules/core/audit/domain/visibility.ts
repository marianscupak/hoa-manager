export const Visibility = {
  TENANT_PUBLIC: 'TENANT_PUBLIC',
  TENANT_PRIVILEGED: 'TENANT_PRIVILEGED',
  SYSTEM_INTERNAL: 'SYSTEM_INTERNAL',
} as const;

export type Visibility = (typeof Visibility)[keyof typeof Visibility];
