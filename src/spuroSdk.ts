/**
 * Spuro Functions - Lightweight SDK for Spuro API
 *
 * A simple, functional SDK that wraps the Spuro backend endpoints.
 * Users pass their own fetch client (e.g., native fetch, x402-fetch, etc.)
 */

// Types
export interface CreateEntityParams {
  payload: string; // hex-encoded payload
  content_type?: string;
  attributes?: Record<string, any>;
  ttl?: number;
}

export interface CreateEntityResponse {
  entity_key: string;
  tx_hash: string;
}

export interface Entity {
  key: string;
  owner: string;
  content_type: string;
  payload?: string;
  attributes?: Record<string, any>;
}

export interface ReadEntityResponse {
  data: string;
  entity: Entity;
}

export interface UpdateEntityParams {
  payload?: string; // hex-encoded payload
  content_type?: string;
  attributes?: Record<string, any>;
  ttl?: number;
}

export interface UpdateEntityResponse {
  status: string;
  entity_key: string;
  tx_hash: string;
}

export interface DeleteEntityResponse {
  status: string;
  entity_key: string;
  tx_hash: string;
}

export interface QueryEntitiesParams {
  query: string;
  limit?: number;
  include_payload?: boolean;
}

export interface QueryResult {
  key: string;
  attributes?: Record<string, any>;
  payload?: string;
}

export interface QueryEntitiesResponse {
  query: string;
  count: number;
  results: QueryResult[];
}

export interface TransferEntityParams {
  entity_key: string;
  new_owner: string;
}

export interface TransferEntityResponse {
  status: string;
  entity_key: string;
  old_owner: string;
  new_owner: string;
  tx_hash: string;
}

// Type for fetch-like functions
export type FetchLike = typeof fetch;

/**
 * Create a new entity
 *
 * @param fetchClient - Fetch client to use (e.g., native fetch or x402-wrapped fetch)
 * @param baseUrl - API base URL
 * @param params - Entity creation parameters
 * @returns Created entity response
 */
export async function createEntity(
  fetchClient: FetchLike,
  baseUrl: string,
  params: CreateEntityParams
): Promise<CreateEntityResponse> {
  const response = await fetchClient(`${baseUrl}/entities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: params.payload,
      content_type: params.content_type || 'text/plain',
      attributes: params.attributes,
      ttl: params.ttl || 86400,
    }),
  });

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      try {
        const text = await (response as any).text?.();
        errorBody = { raw: text };
      } catch {
        errorBody = { raw: null };
      }
    }
    throw new Error(`Create entity failed: ${JSON.stringify(errorBody)}`);
  }

  return response.json() as Promise<CreateEntityResponse>;
}

/**
 * Read an existing entity by key
 *
 * @param fetchClient - Fetch client to use
 * @param baseUrl - API base URL
 * @param entityKey - Entity key to read
 * @returns Entity data and metadata
 */
export async function readEntity(
  fetchClient: FetchLike,
  baseUrl: string,
  entityKey: string
): Promise<ReadEntityResponse> {
  const response = await fetchClient(`${baseUrl}/entities/${entityKey}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Read entity failed: ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<ReadEntityResponse>;
}

/**
 * Update an existing entity
 *
 * @param fetchClient - Fetch client to use
 * @param baseUrl - API base URL
 * @param entityKey - Entity key to update
 * @param params - Update parameters
 * @returns Update response
 */
export async function updateEntity(
  fetchClient: FetchLike,
  baseUrl: string,
  entityKey: string,
  params: UpdateEntityParams
): Promise<UpdateEntityResponse> {
  const response = await fetchClient(`${baseUrl}/entities/${entityKey}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Update entity failed: ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<UpdateEntityResponse>;
}

/**
 * Delete an entity
 *
 * @param fetchClient - Fetch client to use
 * @param baseUrl - API base URL
 * @param entityKey - Entity key to delete
 * @returns Delete response
 */
export async function deleteEntity(
  fetchClient: FetchLike,
  baseUrl: string,
  entityKey: string
): Promise<DeleteEntityResponse> {
  const response = await fetchClient(`${baseUrl}/entities/${entityKey}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Delete entity failed: ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<DeleteEntityResponse>;
}

/**
 * Query entities with a query string
 *
 * @param fetchClient - Fetch client to use
 * @param baseUrl - API base URL
 * @param params - Query parameters
 * @returns Query results
 */
export async function queryEntities(
  fetchClient: FetchLike,
  baseUrl: string,
  params: QueryEntitiesParams
): Promise<QueryEntitiesResponse> {
  const searchParams = new URLSearchParams({
    query: params.query,
    limit: (params.limit || 20).toString(),
    include_payload: (params.include_payload || false).toString(),
  });

  const response = await fetchClient(`${baseUrl}/entities/query?${searchParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Query entities failed: ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<QueryEntitiesResponse>;
}

/**
 * Transfer entity ownership to a new owner
 *
 * @param fetchClient - Fetch client to use
 * @param baseUrl - API base URL
 * @param params - Transfer parameters
 * @returns Transfer response
 */
export async function transferEntity(
  fetchClient: FetchLike,
  baseUrl: string,
  params: TransferEntityParams
): Promise<TransferEntityResponse> {
  const response = await fetchClient(`${baseUrl}/entities/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Transfer entity failed: ${JSON.stringify(error)}`);
  }

  return response.json() as Promise<TransferEntityResponse>;
}

// Utility functions

/**
 * Encode a string to hex format for payload
 *
 * @param text - Text to encode
 * @returns Hex-encoded string
 */
export function encodePayload(text: string): string {
  return Buffer.from(text).toString('hex');
}

/**
 * Decode a hex payload to string
 *
 * @param hex - Hex-encoded payload
 * @returns Decoded string
 */
export function decodePayload(hex: string): string {
  return Buffer.from(hex, 'hex').toString('utf-8');
}