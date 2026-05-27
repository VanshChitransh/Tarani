export interface HeliusAuthorityEntry {
  address: string;
  scopes: string[];
}

export interface HeliusContentMetadata {
  name?: string;
  symbol?: string;
  description?: string;
  token_standard?: string;
}

export interface HeliusContent {
  $schema?: string;
  json_uri?: string;
  metadata?: HeliusContentMetadata;
  links?: { image?: string; external_url?: string };
}

export interface HeliusTokenInfo {
  symbol?: string;
  decimals?: number;
  token_program?: string;
  mint_authority?: string;
  freeze_authority?: string;
  supply?: number | string;
}

export type HeliusMintExtensions = Record<string, unknown>;

export interface HeliusAsset {
  interface: string;
  id: string;
  content?: HeliusContent;
  authorities?: HeliusAuthorityEntry[];
  ownership?: {
    owner?: string;
    ownership_model?: string;
  };
  mutable?: boolean;
  burnt?: boolean;
  token_info?: HeliusTokenInfo;
  mint_extensions?: HeliusMintExtensions;
}

export interface HeliusRpcSuccess<T> {
  jsonrpc: "2.0";
  id: string | number;
  result: T;
}

export interface HeliusRpcError {
  jsonrpc: "2.0";
  id: string | number;
  error: { code: number; message: string };
}

export type HeliusRpcResponse<T> = HeliusRpcSuccess<T> | HeliusRpcError;
