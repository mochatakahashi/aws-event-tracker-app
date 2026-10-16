/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Local development only: password for the `awsapc.admin` account (set in .env.local). */
  readonly VITE_LOCAL_ADMIN_PASSWORD?: string;
}
