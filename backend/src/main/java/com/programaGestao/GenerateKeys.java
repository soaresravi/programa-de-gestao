package com.programaGestao;

import java.io.FileOutputStream;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;

public class GenerateKeys {
    
    public static void main(String[] args) throws Exception {

        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
       
        KeyPair pair = keyGen.generateKeyPair();
        PrivateKey privateKey = pair.getPrivate();
        PublicKey publicKey = pair.getPublic();

        String privateKeyPEM = "-----BEGIN PRIVATE KEY-----\n" + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(privateKey.getEncoded()) + "\n-----END PRIVATE KEY-----";

        try (FileOutputStream fos = new FileOutputStream("src/main/resources/privateKey.pem")) {
            fos.write(privateKeyPEM.getBytes());
        }

        String publicKeyPEM = "-----BEGIN PUBLIC KEY-----\n" + Base64.getMimeEncoder(64, "\n".getBytes()).encodeToString(publicKey.getEncoded()) + "\n-----END PUBLIC KEY-----";

        try (FileOutputStream fos = new FileOutputStream("src/main/resources/publicKey.pem")) {
            fos.write(publicKeyPEM.getBytes());
        }

        System.out.println("Chaves geradas com sucesso!");
        System.out.println("- privateKey.pem");
        System.out.println("- publicKey.pem");
    }
}
