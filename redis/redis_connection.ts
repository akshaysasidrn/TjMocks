import Redis from 'ioredis';
import { ConnectionOptions } from 'tls';

export interface SourceOptions {
  username: string;
  host: string;
  password: string;
  port: number;
  tls_enabled: boolean;
  tls_certificate?: 'none' | 'ca_certificate' | 'self_signed';
  ca_cert?: string;
  root_cert?: string;
  client_key?: string;
  client_cert?: string;
}

export async function getConnection(sourceOptions: SourceOptions): Promise<Redis> {
  const { username, host, password, port, tls_enabled, tls_certificate } = sourceOptions;
  
  let tls: ConnectionOptions | undefined;
  
  if (tls_enabled) {
    tls = {};
    tls.rejectUnauthorized = (tls_certificate ?? 'none') != 'none';
    
    if (tls_certificate === 'ca_certificate') {
      tls.ca = sourceOptions.ca_cert;
    }
    
    if (tls_certificate === 'self_signed') {
      tls.ca = sourceOptions.root_cert;
      tls.key = sourceOptions.client_key;
      tls.cert = sourceOptions.client_cert;
    }
  }

  return new Redis(port, host, {
    maxRetriesPerRequest: 1,
    username,
    password,
    tls: tls,
  });
}

export class RedisQueryService {
  async run(sourceOptions: SourceOptions, queryOptions: { query: string }, dataSourceId: string): Promise<any> {
    let result = {};
    const query = queryOptions.query;
    const client = await getConnection(sourceOptions);
    try {
      const splitQuery = query.split(' ');
      const command = splitQuery[0];
      const args = splitQuery.length > 0 ? splitQuery.slice(1) : [];
      result = await client.call(command, args);
    } catch (err) {
      client.disconnect();
      throw new Error(`Query could not be completed: ${err.message}`);
    }
    return { status: 'ok', data: result };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<{ status: string }> {
    const client = await getConnection(sourceOptions);
    try {
      await client.ping();
      return { status: 'ok' };
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    } finally {
      client.disconnect();
    }
  }
}
