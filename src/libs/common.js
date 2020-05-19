function localStorageSet(key, data) {
    let value ={};
    if(key == 'preKey'){
        const {
            keyId,
            keyPair
        } = data;
        const {
            pubKey,
            privKey
        } = keyPair;
        value = JSON.stringify({
            "keyId":keyId,
            "keyPair":{
                "pubKey": arrayBufferToBase64(pubKey),
                "privKey": arrayBufferToBase64(privKey)
            }
        })
    }else if(key == 'signedPreKey'){
        const {
            keyId,
            keyPair,
            signature
        } = data;
        const {
            pubKey,
            privKey
        } = keyPair;
        value = JSON.stringify({
            "keyId":keyId,
            "keyPair":{
                "pubKey": arrayBufferToBase64(pubKey),
                "privKey": arrayBufferToBase64(privKey)
            },
            "signature":arrayBufferToBase64(signature) 
        })
    }else{
        const {
            pubKey,
            privKey
        } = data;
        value = JSON.stringify({
            "pubKey": arrayBufferToBase64(pubKey),
            "privKey": arrayBufferToBase64(privKey)
        });
    }

    localStorage.setItem(key,value)
}

function localStorageGet(key) {
    let data = localStorage.getItem(key);
    if(data){
        data = JSON.parse(data);
        if(key == 'preKey'){
            const {
                keyId,
                keyPair
            } = data;
            const {
                pubKey,
                privKey
            } = keyPair;
            return {
                "keyId":keyId,
                "keyPair":{
                    "pubKey": base64ToArrayBuffer(pubKey),
                    "privKey": base64ToArrayBuffer(privKey)
                }
            }
        }else if(key == 'signedPreKey'){
            const {
                keyId,
                keyPair,
                signature
            } = data;
            const {
                pubKey,
                privKey
            } = keyPair;
            return {
                "keyId":keyId,
                "keyPair":{
                    "pubKey": base64ToArrayBuffer(pubKey),
                    "privKey": base64ToArrayBuffer(privKey)
                },
                "signature":base64ToArrayBuffer(signature) 
            }
        }else {
            const {
                pubKey,
                privKey
            } = data;
            return {
                "pubKey": base64ToArrayBuffer(pubKey),
                "privKey": base64ToArrayBuffer(privKey)
            }
        }

    }
}

function base64ToArrayBuffer(string) {
    return dcodeIO.ByteBuffer.wrap(string, 'base64').toArrayBuffer();
}

function arrayBufferToBase64(arrayBuffer) {
    return dcodeIO.ByteBuffer.wrap(arrayBuffer).toString('base64');
}

function stringToBase64(str) {

    // 对字符串进行编码
    // var encode = encodeURIComponent(str);
    // 对编码的字符串转化base64
    return base64 = btoa(str);

}

function stringToArrayBuffer(str) {
    if (typeof str !== 'string') {
        throw new Error('Passed non-string to stringToArrayBuffer');
    }
    const res = new ArrayBuffer(str.length);
    const uint = new Uint8Array(res);
    for (let i = 0; i < str.length; i += 1) {
        uint[i] = str.charCodeAt(i);
    }
    return res;
}

function stringToArrayBuffer(str) {
    if (typeof str !== 'string') {
        throw new Error('Passed non-string to stringToArrayBuffer');
    }
    const res = new ArrayBuffer(str.length);
    const uint = new Uint8Array(res);
    for (let i = 0; i < str.length; i += 1) {
        uint[i] = str.charCodeAt(i);
    }
    return res;
}