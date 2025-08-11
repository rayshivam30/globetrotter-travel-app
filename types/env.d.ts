namespace NodeJS {
  export interface ProcessEnv {
    // GeoDB Cities API
    NEXT_PUBLIC_GEODB_API_KEY: string;
    
    // Add other environment variables here as needed
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
