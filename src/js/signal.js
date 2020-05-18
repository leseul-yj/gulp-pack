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
    preKeyId: bobPreKeyId,
    signedKeyId: bobSignedKeyId,
    address: new libsignal.SignalProtocolAddress("bob", bobPreKeyId),
    store: bobStore
}
let AliceConfig = {
    userName: "Alice",
    preKeyId: alicePreKeyId,
    signedKeyId: 101,
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
            let originalMessage =this.message; //this.getPlaintext();

            let receiverInfo = this.getReceiver(this.config.receiver);
            this.ctn.innerHTML += `<p>${this.config.userName} send: ${this.message}</p>`;
            this.bulidMessage(receiverInfo, originalMessage);
        }, false);
    }

    async bulidMessage(receiverInfo, message) {
        await genIdentityRegistrator(this.config.store, this.ctn);
        await genIdentityRegistrator(receiverInfo.store, divBobMessage);
        let preKeyBundle = await generatePreKeyBundle(receiverInfo.store, receiverInfo.preKeyId, receiverInfo.signedKeyId);
        let builder = new libsignal.SessionBuilder(this.config.store, BOB_ADDRESS);

        return builder.processPreKey(preKeyBundle).then(() => {
            let aliceSessionCipher = new libsignal.SessionCipher(this.config.store, BOB_ADDRESS);
            let bobSessionCipher = new libsignal.SessionCipher(receiverInfo.store, ALICE_ADDRESS);
            message = encodeURIComponent(message);
            aliceSessionCipher.encrypt(message).then(function (ciphertext) {
                // handle(ciphertext.type, ciphertext.body);
                divAliceMessage.innerHTML += `<p>密文${ciphertext.body}</p>`;
               
                return bobSessionCipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary');
            }).then(function (plaintext) {
                plaintext = util.toString(plaintext);
                plaintext = decodeURIComponent(plaintext);
                divBobMessage.innerHTML += `<p>${receiverInfo.userName}接受的内容是：${plaintext}</p>`;
            });
        });
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
                            <p>registrationId: ${result[1]}</p>`;
    } catch (err) {
        console.log(err);
    }
}

async function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    let identity = await store.getIdentityKeyPair();
    let registrationId = await store.getLocalRegistrationId();
    let preKey = await KeyHelper.generatePreKey(preKeyId);
    let signedPreKey = await KeyHelper.generateSignedPreKey(identity, signedPreKeyId);
    store.storePreKey(preKeyId, preKey.keyPair);
    store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

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