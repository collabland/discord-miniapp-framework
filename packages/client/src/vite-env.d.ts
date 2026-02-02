/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Discord Application Client ID */
  readonly VITE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
