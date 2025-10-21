import { encrypt, decrypt, maskEmail, maskSensitiveData } from './crypto.util';

describe('CryptoUtil', () => {
  beforeAll(() => {
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    }
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'sensitive data 123';
      const encrypted = encrypt(originalText);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      expect(encrypted.split(':').length).toBe(3);
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const text = 'test data';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('');
      expect(encrypted).toBe('');
      expect(decrypt('')).toBe('');
    });

    it('should handle unicode characters', () => {
      const text = 'Привет мир 🌍';
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(text);
    });

    it('should throw error for invalid encrypted data format', () => {
      expect(() => decrypt('invalid:format')).toThrow('Invalid encrypted data format');
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      expect(maskEmail('user@example.com')).toBe('us***@example.com');
      expect(maskEmail('a@test.com')).toBe('a***@test.com');
      expect(maskEmail('ab@test.com')).toBe('ab***@test.com');
    });

    it('should return unchanged if not email format', () => {
      expect(maskEmail('notanemail')).toBe('notanemail');
      expect(maskEmail('')).toBe('');
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask sensitive fields', () => {
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

    it('should not modify original object', () => {
      const data = { email: 'test@test.com', name: 'Test' };
      const masked = maskSensitiveData(data);

      expect(data.email).toBe('test@test.com');
      expect(masked.email).toBe('te***@test.com');
    });
  });
});
