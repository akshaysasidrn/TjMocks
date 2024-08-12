import Redis from 'ioredis';
import { ConnectionOptions } from 'tls';

export interface SourceOptions {
  username: string;
  host: string;
  password: string;
  port: number;
  tls_enabled: boolean;
  tls_certificate: 'none' | 'ca_certificate' | 'self_signed';
  ca_cert?: string;
  root_cert?: string;
  client_key?: string;
  client_cert?: string;
}

export async function getConnection(sourceOptions: SourceOptions): Promise<any> {
  const username = sourceOptions.username;
  const host = sourceOptions.host;
  const password = sourceOptions.password;
  const port = sourceOptions.port;
  let tls: ConnectionOptions;
  if (sourceOptions.tls_enabled) {
    tls = {};
    tls.rejectUnauthorized = (sourceOptions.tls_certificate ?? 'none') != 'none';
    if (sourceOptions.tls_certificate === 'ca_certificate') {
      tls.ca = sourceOptions.ca_cert;
    }
    if (sourceOptions.tls_certificate === 'self_signed') {
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
