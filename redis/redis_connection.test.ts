import { getConnection, SourceOptions } from './redis_connection';
import Redis from 'ioredis';
import * as fs from 'fs';

describe('Redis TLS Connection Tests', () => {
  const configs: { name: string; options: SourceOptions }[] = [
    {
      name: 'Insecure TLS (rejectUnauthorized: false)',
      options: {
        username: '',
        host: 'localhost',
        password: '',
        port: 6379,
        tls_enabled: true,
        tls_certificate: 'none'
      }
    },
    {
      name: 'TLS with CA certificate',
      options: {
        username: '',
        host: 'localhost',
        password: '',
        port: 6380,
        tls_enabled: true,
        tls_certificate: 'ca_certificate',
        ca_cert: fs.readFileSync('./certs/ca.crt', 'utf8')
      }
    },
    {
      name: 'TLS with client certificate',
      options: {
        username: '',
        host: 'localhost',
        password: '',
        port: 6381,
        tls_enabled: true,
        tls_certificate: 'self_signed',
        root_cert: fs.readFileSync('./certs/ca.crt', 'utf8'),
        client_key: fs.readFileSync('./certs/client.key', 'utf8'),
        client_cert: fs.readFileSync('./certs/client.crt', 'utf8')
      }
    }
  ];

  configs.forEach(({ name, options }) => {
    describe(name, () => {
      let connection: Redis;

      beforeAll(async () => {
        connection = await getConnection(options);
        connection.on('error', (error) => {
          console.error(`Redis error for ${name}:`, error);
        });
      });

      afterAll(async () => {
        await connection.quit();
      });

      it('should connect successfully', async () => {
        try {
          const result = await connection.ping();
          expect(result).toBe('PONG');
        } catch (error) {
          console.error(`Connection failed for ${name}:`, error);
          throw error;
        }
      });

      it('should set and get a value', async () => {
        try {
          const key = 'test_key';
          const value = 'test_value';
          await connection.set(key, value);
          const result = await connection.get(key);
          expect(result).toBe(value);
        } catch (error) {
          console.error(`Set/Get failed for ${name}:`, error);
          throw error;
        }
      });
    });
  });
});
