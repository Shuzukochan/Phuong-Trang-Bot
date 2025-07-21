const crypto = require('crypto');

/**
 * Simple Encryptor class using Node.js built-in crypto module
 * Replaces @zibot/ziencryptor functionality
 */
class Encryptor {
    constructor(password) {
        if (!password) {
            throw new Error('Password is required for encryption/decryption');
        }
        this.password = password;
        this.algorithm = 'aes-256-cbc';
    }

    /**
     * Create a key from password
     * @param {string} password - The password to derive key from
     * @returns {Buffer} - The derived key
     */
    _createKey(password) {
        return crypto.scryptSync(password, 'salt', 32);
    }

    /**
     * Encrypt data into a secure string
     * @param {any} data - The data to encrypt (will be JSON stringified)
     * @returns {string} - Encrypted string
     */
    encrypt(data) {
        try {
            const text = typeof data === 'string' ? data : JSON.stringify(data);
            
            // Create key and IV
            const key = this._createKey(this.password);
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Combine IV and encrypted data
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt an encrypted string back to original data
     * @param {string} encryptedData - The encrypted string
     * @returns {any} - Decrypted data
     */
    decrypt(encryptedData) {
        try {
            // Split IV and encrypted data
            const parts = encryptedData.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted data format');
            }
            
            const iv = Buffer.from(parts[0], 'hex');
            const encryptedText = parts[1];
            
            const key = this._createKey(this.password);
            const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
            
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            // Try to parse as JSON, if fails return as string
            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
}

module.exports = Encryptor;
