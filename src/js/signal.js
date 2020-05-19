let divAliceMessage = document.getElementById("Alice");
let divBobMessage = document.getElementById("Bob");

let KeyHelper = libsignal.KeyHelper;

// 生成预共享密钥对，也是生成地址的id
let bobPreKeyId = 1337;
let alicePreKeyId = 333;

// 用于生成签名密钥对的id和身份密钥对一起使用
var bobSignedKeyId = 100;
var aliceStore = new SignalProtocolStore();

var bobStore = new SignalProtocolStore();
let BobConfig = {
    userName: "Bob",
    registrationId: 1000,
    preKeyId: bobPreKeyId,
    signedKeyId: bobSignedKeyId,
    address: new libsignal.SignalProtocolAddress("bob", bobPreKeyId),
    store: bobStore
}
let AliceConfig = {
    userName: "Alice",
    preKeyId: alicePreKeyId,
    signedKeyId: 101,
    registrationId: 1001,
    address: new libsignal.SignalProtocolAddress("alice", alicePreKeyId),
    store: aliceStore
}
let ALICE_ADDRESS = AliceConfig.address;
let BOB_ADDRESS = BobConfig.address;

class Person {
    constructor(ctn, option) {
        this.ctn = ctn;
        this.config = option;
        this.message = undefined;
        this.init();
    }
    getReceiver(receiver) {
        return receiver == "Bob" ? BobConfig : AliceConfig;
    }
    init() {
        this.render();
        this.attchEvent();
    }

    getPaddedMessageLength(messageLength) {
        const messageLengthWithTerminator = messageLength + 1;
        let messagePartCount = Math.floor(messageLengthWithTerminator / 160);

        if (messageLengthWithTerminator % 160 !== 0) {
            messagePartCount += 1;
        }

        return messagePartCount * 160;
    }

    getPlaintext() {
        if (!this.plaintext) {
            const messageBuffer = this.message.toArrayBuffer();
            this.plaintext = new Uint8Array(
                this.getPaddedMessageLength(messageBuffer.byteLength + 1) - 1
            );
            this.plaintext.set(new Uint8Array(messageBuffer));
            this.plaintext[messageBuffer.byteLength] = 0x80;
        }
        return this.plaintext;
    }
    render() {
        const {
            preKeyId,
            signedKeyId,
            address
        } = this.config;
        this.ctn.innerHTML += `
            <p>生成预共享密钥对Id（preKeyId）${preKeyId}</p>
            <p>用预共享密钥生成的地址：${address}</p>
            <p>生成签名密钥的signKeyId：${signedKeyId}</p>
            <p></p>`;
    }
    attchEvent() {
        document.getElementById(`${this.config.userName}Mes`).addEventListener('click', () => {
            this.message = this.ctn.querySelector(".message").value;
            let originalMessage = this.message; //this.getPlaintext();

            let receiverInfo = this.getReceiver(this.config.receiver);
            this.ctn.innerHTML += `<p>${this.config.userName} send: ${this.message}</p>`;
            this.bulidMessage(receiverInfo, originalMessage);
        }, false);
    }
    async getReceiverBundle(store, preKeyId, signedPreKeyId) {
        let signedPreKeyUserSignature = "SCyn+OZDfhAepEYcezX4bBj/tCperWH7HAAnXDPJ74ica83rqFRRqWCZ6uh6oDy/6XD06LzyL3K8EIpjcOXmhQ==";
        let signedPreKeyUserPublicKey = "BYnp+em8oJZepOBFN6K2NmVg3/JUZwBLhXPUAUNR4bp5";
        let identityKeyPairUserPublicKey = "BbgP+qzH44PwTJWZKPSqHvleKt/FtUxZXOwAZP7rCoA5";
        let recordsUserPublicKey = "BeT+YWX8KiW0+PFxf/G+nUJuxMEWIlLPZ89sei7gvnpZ";
        let registrationId = await store.getLocalRegistrationId();
        return {
            identityKey: base64ToArrayBuffer(identityKeyPairUserPublicKey),
            registrationId: registrationId,
            preKey: {
                keyId: preKeyId,
                publicKey: base64ToArrayBuffer(recordsUserPublicKey),
            },
            signedPreKey: {
                keyId: signedPreKeyId,
                publicKey: base64ToArrayBuffer(signedPreKeyUserPublicKey),
                signature: base64ToArrayBuffer(signedPreKeyUserSignature)
            }
        }
        // return {
        //     identityKey: identityKeyPairUserPublicKey,
        //     registrationId: registrationId,
        //     preKey: {
        //         keyId: preKeyId,
        //         publicKey: recordsUserPublicKey,
        //     },
        //     signedPreKey: {
        //         keyId: signedPreKeyId,
        //         publicKey: signedPreKeyUserPublicKey,
        //         signature: signedPreKeyUserSignature
        //     }
        // }
    }
    async storeMyIdentityRegistrator(store,ctn) {
        try {
            let identityKeyPair = localStorage.getItem('identityKey');
            let registrationId = localStorage.getItem('registrationId');
            if (!identityKeyPair) {
                registrationId = await KeyHelper.generateRegistrationId();
                identityKeyPair = await KeyHelper.generateIdentityKeyPair();
                localStorageSet('identityKey', identityKeyPair);
                localStorage.setItem('registrationId', registrationId);
            }else{
                identityKeyPair = localStorageGet('identityKey');
            }
            store.put('identityKey', identityKeyPair);
            store.put('registrationId', registrationId);
            const {
                pubKey,
                privKey
            } = identityKeyPair;
            ctn.innerHTML += `<p> identityKey 公钥:${arrayBufferToBase64(pubKey)} 私钥:${arrayBufferToBase64(privKey)}</p>
                                <p>registrationId: ${registrationId}</p>`;
        } catch (err) {
            console.log(err);
        }
    }
    async bulidMessage(receiverInfo, message) {
        await genIdentityRegistrator(this.config.store, this.ctn);
        await this.storeMyIdentityRegistrator(receiverInfo.store, divBobMessage);

        let preKeyBundleB = await generatePreKeyBundle(receiverInfo.store, receiverInfo.preKeyId, receiverInfo.signedKeyId);
        // let preKeyBundleA = await this.getReceiverBundle(receiverInfo.store,receiverInfo.preKeyId, receiverInfo.signedKeyId);
        let builder = new libsignal.SessionBuilder(this.config.store, BOB_ADDRESS);
        await builder.processPreKey(preKeyBundleB);
        let aliceSessionCipher = new libsignal.SessionCipher(this.config.store, BOB_ADDRESS);

        //message = encodeURIComponent(message);
        message = stringToArrayBuffer(message);
        let ciphertext = await aliceSessionCipher.encrypt(message);
        divAliceMessage.innerHTML += `<p>密文${stringToBase64(ciphertext.body)}</p>`;
        //解密alice发过来的消息
        //let txt = `MwohBR6waCiw9uqQxt79CbrvIbBiYHJSJENSkM5ImV79SD5vEAAYACIgc3rv6Bt0XP6j8NruFE+tMXJwe3NoAseC64nSOfB/s6WLoA3LXZSZdg==`;
        let txt = stringToBase64(ciphertext.body);
        let bobSessionCipher = new libsignal.SessionCipher(receiverInfo.store, ALICE_ADDRESS);
        let plaintext = await bobSessionCipher.decryptPreKeyWhisperMessage(txt, 'base64');
        plaintext = util.toString(plaintext);
        //plaintext = decodeURIComponent(plaintext);
        divBobMessage.innerHTML += `<p>${receiverInfo.userName}接受的内容是：${plaintext}</p>`;
    }
}
new Person(divAliceMessage, {
    ...AliceConfig,
    receiver: "Bob"
});
new Person(divBobMessage, {
    ...BobConfig,
    receiver: "Alice"
});

async function genIdentityRegistrator(store, ctn) {
    try {
        let identityKeyPair = await KeyHelper.generateIdentityKeyPair();
        let registrationId = await KeyHelper.generateRegistrationId();
        store.put('identityKey', identityKeyPair);
        store.put('registrationId', registrationId);
        const {
            pubKey,
            privKey
        } = identityKeyPair;
        ctn.innerHTML += `<p> identityKey 公钥:${pubKey} 私钥:${privKey}</p>
                            <p>registrationId: ${registrationId}</p>`;
    } catch (err) {
        console.log(err);
    }
}

async function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    let identity = await store.getIdentityKeyPair();
    let registrationId = await store.getLocalRegistrationId();

    let preKey = localStorage.getItem('preKey');
    let signedPreKey = localStorage.getItem('signedPreKey');
    if (!preKey) {
        preKey = await KeyHelper.generatePreKey(preKeyId);
        signedPreKey = await KeyHelper.generateSignedPreKey(identity, signedPreKeyId);
        
        localStorageSet('preKey', preKey);
        localStorageSet('signedPreKey', signedPreKey);
    }else{
        preKey= localStorageGet('preKey');
        signedPreKey = localStorageGet('signedPreKey');
    }
    store.storePreKey(preKeyId, preKey.keyPair);
    store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

    let psData = {
        identityKey: arrayBufferToBase64(identity.pubKey),
        registrationId: registrationId,
        preKey: {
            keyId: preKeyId,
            publicKey: arrayBufferToBase64(preKey.keyPair.pubKey),
        },
        signedPreKey: {
            keyId: signedPreKeyId,
            publicKey: arrayBufferToBase64(signedPreKey.keyPair.pubKey),
            signature: arrayBufferToBase64(signedPreKey.signature)
        }
    }
    console.log(JSON.stringify(psData))
    return {
        identityKey: identity.pubKey,
        registrationId: registrationId,
        preKey: {
            keyId: preKeyId,
            publicKey: preKey.keyPair.pubKey
        },
        signedPreKey: {
            keyId: signedPreKeyId,
            publicKey: signedPreKey.keyPair.pubKey,
            signature: signedPreKey.signature
        }
    };
}