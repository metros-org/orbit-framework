export interface EncryptionKey {
    publicKey: string;
    privateKey?: string;
}

export interface SigningKey {
    publicKey: string;
    privateKey?: string;
}

export interface EncryptedMessage {
    ciphertext: string;
    iv: string;
    tag?: string;
    ephemeralPublicKey?: string;
}

export interface SignedMessage {
    message: string | EncryptedMessage;
    signature: string;
    publicKey: string;
    timestamp: number;
}

export interface SecurityConfig {
    encryptionAlgorithm?: string;
    signatureAlgorithm?: string;
    keyExchangeProtocol?: string;
}

export interface SecurityProvider {
    generateEncryptionKey(): Promise<EncryptionKey>;
    generateSigningKey(): Promise<SigningKey>;
    
    encrypt(message: string, recipientPublicKey: string): Promise<EncryptedMessage>;
    decrypt(message: EncryptedMessage, privateKey: string): Promise<string>;
    
    sign(message: string | EncryptedMessage, privateKey: string): Promise<SignedMessage>;
    verify(signedMessage: SignedMessage): Promise<boolean>;
    
    deriveSharedSecret(privateKey: string, publicKey: string): Promise<string>;
} 