import { Logger } from '@orbit/core';
import * as jose from 'jose';
import * as forge from 'node-forge';
import { box, randomBytes } from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

import {
    SecurityProvider,
    SecurityConfig,
    EncryptionKey,
    SigningKey,
    EncryptedMessage,
    SignedMessage
} from '../types';

export class DefaultSecurityProvider implements SecurityProvider {
    private readonly logger: Logger;
    private readonly config: Required<SecurityConfig>;

    constructor(config: SecurityConfig = {}) {
        this.logger = new Logger('SecurityProvider');
        this.config = {
            encryptionAlgorithm: config.encryptionAlgorithm || 'ECDH-ES+A256KW',
            signatureAlgorithm: config.signatureAlgorithm || 'EdDSA',
            keyExchangeProtocol: config.keyExchangeProtocol || 'X25519'
        };
    }

    public async generateEncryptionKey(): Promise<EncryptionKey> {
        const keyPair = box.keyPair();
        return {
            publicKey: encodeBase64(keyPair.publicKey),
            privateKey: encodeBase64(keyPair.secretKey)
        };
    }

    public async generateSigningKey(): Promise<SigningKey> {
        const { privateKey, publicKey } = await jose.generateKeyPair(
            this.config.signatureAlgorithm
        );

        return {
            publicKey: await jose.exportSPKI(publicKey),
            privateKey: await jose.exportPKCS8(privateKey)
        };
    }

    public async encrypt(message: string, recipientPublicKey: string): Promise<EncryptedMessage> {
        try {
            // Generate ephemeral key pair
            const ephemeralKeyPair = box.keyPair();
            
            // Decode recipient's public key
            const recipientPubKey = decodeBase64(recipientPublicKey);
            
            // Generate shared key
            const sharedKey = box.before(recipientPubKey, ephemeralKeyPair.secretKey);
            
            // Generate random nonce
            const nonce = randomBytes(box.nonceLength);
            
            // Encrypt message
            const messageUint8 = new TextEncoder().encode(message);
            const encrypted = box.after(messageUint8, nonce, sharedKey);
            
            return {
                ciphertext: encodeBase64(encrypted),
                iv: encodeBase64(nonce),
                ephemeralPublicKey: encodeBase64(ephemeralKeyPair.publicKey)
            };
        } catch (error) {
            this.logger.error('Encryption failed:', error);
            throw error;
        }
    }

    public async decrypt(message: EncryptedMessage, privateKey: string): Promise<string> {
        try {
            if (!message.ephemeralPublicKey) {
                throw new Error('Missing ephemeral public key');
            }

            // Decode keys and message components
            const recipientPrivKey = decodeBase64(privateKey);
            const ephemeralPubKey = decodeBase64(message.ephemeralPublicKey);
            const ciphertext = decodeBase64(message.ciphertext);
            const nonce = decodeBase64(message.iv);
            
            // Generate shared key
            const sharedKey = box.before(ephemeralPubKey, recipientPrivKey);
            
            // Decrypt message
            const decrypted = box.open_after(ciphertext, nonce, sharedKey);
            if (!decrypted) {
                throw new Error('Decryption failed');
            }
            
            return new TextDecoder().decode(decrypted);
        } catch (error) {
            this.logger.error('Decryption failed:', error);
            throw error;
        }
    }

    public async sign(
        message: string | EncryptedMessage,
        privateKey: string
    ): Promise<SignedMessage> {
        try {
            const key = await jose.importPKCS8(privateKey, this.config.signatureAlgorithm);
            const messageStr = typeof message === 'string' 
                ? message 
                : JSON.stringify(message);
            
            const signature = await new jose.SignJWT({ message: messageStr })
                .setProtectedHeader({ alg: this.config.signatureAlgorithm })
                .sign(key);

            return {
                message,
                signature,
                publicKey: (await jose.exportSPKI(key)),
                timestamp: Date.now()
            };
        } catch (error) {
            this.logger.error('Signing failed:', error);
            throw error;
        }
    }

    public async verify(signedMessage: SignedMessage): Promise<boolean> {
        try {
            const publicKey = await jose.importSPKI(
                signedMessage.publicKey,
                this.config.signatureAlgorithm
            );

            const { payload } = await jose.jwtVerify(
                signedMessage.signature,
                publicKey
            );

            const messageStr = typeof signedMessage.message === 'string'
                ? signedMessage.message
                : JSON.stringify(signedMessage.message);

            return payload.message === messageStr;
        } catch (error) {
            this.logger.error('Verification failed:', error);
            return false;
        }
    }

    public async deriveSharedSecret(privateKey: string, publicKey: string): Promise<string> {
        try {
            const privKey = decodeBase64(privateKey);
            const pubKey = decodeBase64(publicKey);
            
            const sharedKey = box.before(pubKey, privKey);
            return encodeBase64(sharedKey);
        } catch (error) {
            this.logger.error('Key derivation failed:', error);
            throw error;
        }
    }

    private generateRandomBytes(length: number): Uint8Array {
        return randomBytes(length);
    }
} 