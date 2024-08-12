import { getConnection, SourceOptions, RedisQueryService } from './redis_connection';
import * as fs from 'fs';

describe('Redis TLS Connection Tests', () => {
  const configs: { name: string; options: SourceOptions }[] = [
    {
      name: 'Insecure TLS (rejectUnauthorized: false)',
      options: {
        username: 'default',
        host: 'localhost',
        password: 'password123',
        port: 6379,
        tls_enabled: true,
        tls_certificate: 'none'
      }
    },
    {
      name: 'TLS with CA certificate',
      options: {
        username: 'default',
        host: 'localhost',
        password: 'password123',
        port: 6380,
        tls_enabled: true,
        tls_certificate: 'ca_certificate',
        ca_cert: fs.readFileSync('./certs/ca.crt', 'utf8')
      }
    },
    {
      name: 'TLS with client certificate',
      options: {
        username: 'default',
        host: 'localhost',
        password: 'password123',
        port: 6381,
        tls_enabled: true,
        tls_certificate: 'self_signed',
        root_cert: fs.readFileSync('./certs/ca.crt', 'utf8'),
        client_key: fs.readFileSync('./certs/client.key', 'utf8'),
        client_cert: fs.readFileSync('./certs/client.crt', 'utf8')
      }
    }
  ];

  const queryService = new RedisQueryService();

  configs.forEach(({ name, options }) => {
    describe(name, () => {
      it('should connect successfully', async () => {
        const result = await queryService.testConnection(options);
        expect(result.status).toBe('ok');
      });

      it('should set and get a value', async () => {
        const setResult = await queryService.run(options, { query: 'SET test_key test_value' }, 'test');
        expect(setResult.status).toBe('ok');

        const getResult = await queryService.run(options, { query: 'GET test_key' }, 'test');
        expect(getResult.status).toBe('ok');
        expect(getResult.data).toBe('test_value');
      });
    });
  });

  describe('TLS with CA certificate (error checking)', () => {
    it('should fail to connect with invalid CA certificate', async () => {
      const invalidOptions = {
        ...configs[1].options,
        ca_cert: 'invalid certificate content'
      };
      await expect(queryService.testConnection(invalidOptions)).rejects.toThrow(/Connection test failed/);
    });

    it('should fail to connect with altered CA certificate', async () => {
      const alteredCaCert = fs.readFileSync('./certs/ca.crt', 'utf8').replace('A', 'B');
      const alteredOptions = {
        ...configs[1].options,
        ca_cert: alteredCaCert
      };
      await expect(queryService.testConnection(alteredOptions)).rejects.toThrow(/Connection test failed/);
    });

    it('should fail to connect with wrong CA certificate', async () => {
      const wrongOptions = {
        ...configs[1].options,
        ca_cert: fs.readFileSync('./certs/client.crt', 'utf8') // Using client cert instead of CA cert
      };
      await expect(queryService.testConnection(wrongOptions)).rejects.toThrow(/Connection test failed/);
    });
  });

  describe('TLS with client certificate (detailed error checking)', () => {
    it('should fail to connect with incorrect client certificate', async () => {
      const invalidOptions = {
        ...configs[2].options,
        client_cert: 'invalid certificate content'
      };
      await expect(queryService.testConnection(invalidOptions)).rejects.toThrow(/Connection test failed/);
    });

    it('should fail to connect with altered client certificate', async () => {
      const alteredClientCert = fs.readFileSync('./certs/client.crt', 'utf8').replace('A', 'B');
      const alteredOptions = {
        ...configs[2].options,
        client_cert: alteredClientCert
      };
      await expect(queryService.testConnection(alteredOptions)).rejects.toThrow(/Connection test failed/);
    });

    it('should fail to connect with incorrect client key', async () => {
      const invalidOptions = {
        ...configs[2].options,
        client_key: 'invalid key content'
      };
      await expect(queryService.testConnection(invalidOptions)).rejects.toThrow(/Connection test failed/);
    });
  });
});
