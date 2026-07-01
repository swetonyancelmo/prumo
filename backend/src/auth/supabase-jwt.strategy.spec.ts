import { generateKeyPairSync, KeyObject } from 'crypto';
import * as jwt from 'jsonwebtoken';
import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { SupabaseJwtStrategy } from './supabase-jwt.strategy';

const SUPABASE_URL = 'https://test-project.supabase.co';
const ISSUER = `${SUPABASE_URL}/auth/v1`;
const KID = 'test-key-1';

/** Gera um par de chaves ECC P-256 (ES256), como o JWT Signing Key do Supabase. */
function generateEcKeyPair() {
  return generateKeyPairSync('ec', { namedCurve: 'P-256' });
}

/** Exporta a chave pública como JWK, no formato servido pelo endpoint JWKS. */
function toPublicJwk(publicKey: KeyObject) {
  const jwk = publicKey.export({ format: 'jwk' });
  return { ...jwk, kid: KID, alg: 'ES256', use: 'sig' };
}

function signToken(
  privateKey: KeyObject,
  payload: Record<string, unknown>,
  options: jwt.SignOptions = {},
): string {
  const pem = privateKey.export({ format: 'pem', type: 'pkcs8' }) as string;
  return jwt.sign(payload, pem, {
    algorithm: 'ES256',
    keyid: KID,
    issuer: ISSUER,
    audience: 'authenticated',
    expiresIn: '1h',
    ...options,
  });
}

/** Config falsa — sem SUPABASE_JWT_SECRET; só a URL para montar o JWKS URI. */
function fakeConfig(): ConfigService {
  const values: Record<string, string> = { SUPABASE_URL };
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

/**
 * Dispara a estratégia contra um request e resolve com o resultado
 * (success → user, fail → { failed }, error → lançado).
 */
function runStrategy(
  strategy: SupabaseJwtStrategy,
  token?: string,
): Promise<{ user?: unknown; failed?: unknown }> {
  return new Promise((resolve, reject) => {
    const s = strategy as unknown as {
      success: (user: unknown) => void;
      fail: (info: unknown) => void;
      error: (err: Error) => void;
      authenticate: (req: unknown, options?: unknown) => void;
    };
    s.success = (user) => resolve({ user });
    s.fail = (info) => resolve({ failed: info ?? true });
    s.error = (err) => reject(err);

    const req = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    s.authenticate(req, {});
  });
}

describe('SupabaseJwtStrategy (validação via JWKS/ES256)', () => {
  let keyPair: ReturnType<typeof generateEcKeyPair>;

  beforeEach(() => {
    keyPair = generateEcKeyPair();
    // Mocka o endpoint JWKS do Supabase servindo a chave pública EC.
    nock(SUPABASE_URL)
      .get('/auth/v1/.well-known/jwks.json')
      .reply(200, { keys: [toPublicJwk(keyPair.publicKey)] })
      .persist();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('aceita token válido assinado pela chave do JWKS e mapeia o usuário', async () => {
    const strategy = new SupabaseJwtStrategy(fakeConfig());
    const token = signToken(keyPair.privateKey, {
      sub: '11111111-1111-1111-1111-111111111111',
      email: 'user@example.com',
    });

    const { user } = await runStrategy(strategy, token);
    expect(user).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'user@example.com',
      phone: undefined,
    });
  });

  it('rejeita token assinado por uma chave diferente (não presente no JWKS)', async () => {
    const strategy = new SupabaseJwtStrategy(fakeConfig());
    const outraChave = generateEcKeyPair();
    const token = signToken(outraChave.privateKey, {
      sub: '22222222-2222-2222-2222-222222222222',
    });

    const { user, failed } = await runStrategy(strategy, token);
    expect(user).toBeUndefined();
    expect(failed).toBeTruthy();
  });

  it('rejeita token com issuer inesperado', async () => {
    const strategy = new SupabaseJwtStrategy(fakeConfig());
    const token = signToken(
      keyPair.privateKey,
      { sub: '33333333-3333-3333-3333-333333333333' },
      { issuer: 'https://evil.example.com/auth/v1' },
    );

    const { user, failed } = await runStrategy(strategy, token);
    expect(user).toBeUndefined();
    expect(failed).toBeTruthy();
  });

  it('rejeita token expirado', async () => {
    const strategy = new SupabaseJwtStrategy(fakeConfig());
    const token = signToken(
      keyPair.privateKey,
      { sub: '44444444-4444-4444-4444-444444444444' },
      { expiresIn: '-10s' },
    );

    const { user, failed } = await runStrategy(strategy, token);
    expect(user).toBeUndefined();
    expect(failed).toBeTruthy();
  });

  it('rejeita requisição sem token', async () => {
    const strategy = new SupabaseJwtStrategy(fakeConfig());
    const { user, failed } = await runStrategy(strategy);
    expect(user).toBeUndefined();
    expect(failed).toBeTruthy();
  });

  it('lança se SUPABASE_URL não estiver configurado', () => {
    const emptyConfig = {
      get: () => undefined,
    } as unknown as ConfigService;
    expect(() => new SupabaseJwtStrategy(emptyConfig)).toThrow('SUPABASE_URL');
  });
});
