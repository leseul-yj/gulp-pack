let divAliceMessage = document.getElementById("alice");
let divBobMessage = document.getElementById("bob");

let KeyHelper = libsignal.KeyHelper;

// 生成预共享密钥对，也是生成地址的id
let bobPreKeyId = 1337;
let alicePreKeyId = 333;

// 用于生成签名密钥对的id和身份密钥对一起使用
var bobSignedKeyId = 100;
let BobConfig = {
    userName: "Bob",
    preKeyId: bobPreKeyId,
    signedKeyId: bobSignedKeyId,
    address: new libsignal.SignalProtocolAddress("bob",bobPreKeyId),
}
let AliceConfig = {
    userName: "Alice",
    preKeyId: alicePreKeyId,
    signedKeyId: 101,
    address: new libsignal.SignalProtocolAddress("alice",alicePreKeyId),
}
let ALICE_ADDRESS = AliceConfig.address;
let BOB_ADDRESS = BobConfig.address;
class Person {
    constructor(ctn,option) {
        this.ctn = ctn;
        this.config = option;
        this.store = undefined;
        this.init();
    }
    getReceiver() {
        return this.receiver == "Bob" ? BobConfig : AliceConfig;
    }
    init() {
        this.store = new SignalProtocolStore();
        this.render();
        this.attchEvent();
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
        this.ctn.querySelector(".sendMessage").addEventListener('click',(ev) => {
            let txt = this.ctn.querySelector(".message").value;
            let originalMessage = util.toArrayBuffer(txt);
            let receiverInfo = this.getReceiver(this.config.receiver);
            this.ctn.innerHTML += `<p>${this.config.userName} send: ${txt}</p>`;
            this.bulidMessage(receiverInfo,originalMessage)
        },false);
    }
    async bulidMessage(config,message) {
        await genIdentityRegistrator(this.store,this.ctn);
        let preKeyBundle = await generatePreKeyBundle(bobStore,config.preKeyId,config.signedKeyId);
        let builder = new libsignal.SessionBuilder(this.store,BOB_ADDRESS);
        return builder.processPreKey(preKeyBundle).then(() => {
            let aliceSessionCipher = new libsignal.SessionCipher(aliceStore,BOB_ADDRESS);
            let bobSessionCipher = new libsignal.SessionCipher(bobStore,ALICE_ADDRESS);
            aliceSessionCipher.encrypt(originalMessage,'binary').then(function(ciphertext) {
                return bobSessionCipher.decryptPreKeyWhisperMessage(ciphertext.body,'binary');
            }).then(function(plaintext) {
                divBobMessage.innerHTML += `</br>${config.receiver}接受的内容是：${util.toString(plaintext)}`;
            });
        });
    }
}
new Person(divAliceMessage,{...AliceConfig,receiver: "Bob"});
new Person(divBobMessage,{...BobConfig,receiver: "Alice"});

async function genIdentityRegistrator(store,ctn) {
    try {
        let identityKeyPair = await KeyHelper.generateIdentityKeyPair();
        let registrationId = await KeyHelper.generateRegistrationId();
        store.put('identityKey',identityKeyPair);
        store.put('registrationId',registrationId);
        const {
            pubKey,
            privKey
        } = identityKeyPair;
        ctn.innerHTML += `<p> identityKey 公钥:${pubKey} 私钥:${privKey}</p>
                            <p>registrationId: ${result[1]}</p>`;
    } catch(err) {
        console.log(err);
    }
}

async function generatePreKeyBundle(store,preKeyId,signedPreKeyId) {
    let identity = await store.getIdentityKeyPair();
    let registrationId = await store.getLocalRegistrationId();
    let preKey = await KeyHelper.generatePreKey(preKeyId);
    let signedPreKey = await KeyHelper.generateSignedPreKey(identity,signedPreKeyId);
    store.storePreKey(preKeyId,preKey.keyPair);
    store.storeSignedPreKey(signedPreKeyId,signedPreKey.keyPair);

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



var aliceStore = new SignalProtocolStore();

var bobStore = new SignalProtocolStore();


var Curve = libsignal.Curve;

Promise.all([
    genIdentityRegistrator(aliceStore,divAliceMessage),
    genIdentityRegistrator(bobStore,divBobMessage),
]).then(function(result) {
    console.log('result',result)
    return generatePreKeyBundle(bobStore,bobPreKeyId,bobSignedKeyId);
}).then(function(preKeyBundle) {
    // 给bob发送对话
    var builder = new libsignal.SessionBuilder(aliceStore,BOB_ADDRESS);
    return builder.processPreKey(preKeyBundle).then(function() {

        let originalMessage = util.toArrayBuffer("收拾啊啊啊啊bb");
        //let originalMessage = "jjj hjjh";
        let aliceSessionCipher = new libsignal.SessionCipher(aliceStore,BOB_ADDRESS);
        let bobSessionCipher = new libsignal.SessionCipher(bobStore,ALICE_ADDRESS);

        aliceSessionCipher.encrypt(originalMessage,'binary').then(function(ciphertext) {


            // check for ciphertext.type to be 3 which includes the PREKEY_BUNDLE
            return bobSessionCipher.decryptPreKeyWhisperMessage(ciphertext.body,'binary');

        }).then(function(plaintext) {
            //alert(plaintext);
            divAliceMessage.innerHTML += `</br>bob解密内容：${util.toString(plaintext)}`;

        });

        // bobSessionCipher.encrypt(originalMessage).then(function(ciphertext) {

        //     return aliceSessionCipher.decryptWhisperMessage(ciphertext.body,'binary');

        // }).then(function(plaintext) {

        //     assertEqualArrayBuffers(plaintext,originalMessage);

        // });

    });
});