describe('CryptoUtil', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  afterAll(() => {
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const { encrypt, decrypt } = await import('./crypto.util');
      
      const originalText = 'sensitive data 123';
      const encrypted = encrypt(originalText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      expect(encrypted.split(':').length).toBe(3);
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const { encrypt, decrypt } = await import('./crypto.util');
      
      const text = 'test data';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    it('should handle empty strings', async () => {
      const { encrypt, decrypt } = await import('./crypto.util');
      
      const encrypted = encrypt('');
      expect(encrypted).toBe('');
      expect(decrypt('')).toBe('');
    });

    it('should handle unicode characters', async () => {
      const { encrypt, decrypt } = await import('./crypto.util');
      
      const text = 'Привет мир 🌍';
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(text);
    });

    it('should throw error for invalid encrypted data format', async () => {
      const { decrypt } = await import('./crypto.util');
      
      expect(() => decrypt('invalid:format')).toThrow('Invalid encrypted data format');
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', async () => {
      const { maskEmail } = await import('./crypto.util');
      
      expect(maskEmail('user@example.com')).toBe('us***@example.com');
      expect(maskEmail('a@test.com')).toBe('a***@test.com');
      expect(maskEmail('ab@test.com')).toBe('a***@test.com');
    });

    it('should return unchanged if not email format', async () => {
      const { maskEmail } = await import('./crypto.util');
      
      expect(maskEmail('notanemail')).toBe('notanemail');
      expect(maskEmail('')).toBe('');
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask sensitive fields', async () => {
      const { maskSensitiveData } = await import('./crypto.util');
      
      const data = {
        id: 1,
        email: 'user@test.com',
        passwordHash: 'hash123',
        name: 'John',
        token: 'secret-token',
      };

      const masked = maskSensitiveData(data);

      expect(masked.id).toBe(1);
      expect(masked.name).toBe('John');
      expect(masked.email).toBe('us***@test.com');
      expect(masked.passwordHash).toBe('***REDACTED***');
      expect(masked.token).toBe('***REDACTED***');
    });

    it('should not modify original object', async () => {
      const { maskSensitiveData } = await import('./crypto.util');
      
      const data = { email: 'test@test.com', name: 'Test' };
      const masked = maskSensitiveData(data);

      expect(data.email).toBe('test@test.com');
      expect(masked.email).toBe('te***@test.com');
    });
  });
});
