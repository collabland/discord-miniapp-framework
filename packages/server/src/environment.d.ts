declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Discord Application Client ID */
      VITE_CLIENT_ID: string;

      /** Discord Application Client Secret */
      CLIENT_SECRET: string;

      /** Server port (default: 3001) */
      PORT?: string;

      /** Client port for CORS (default: 3000) */
      CLIENT_PORT?: string;

      /** Node environment */
      NODE_ENV?: 'development' | 'production' | 'test';

      /** Application name */
      APP_NAME?: string;
    }
  }
}

export {};
