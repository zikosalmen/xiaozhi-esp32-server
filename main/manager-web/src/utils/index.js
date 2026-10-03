import { Message } from 'element-ui'
import router from '../router'
import Constant from '../utils/constant'

/**
 * [text]
 */
export function checkUserLogin(fn) {
    let token = localStorage.getItem(Constant.STORAGE_KEY.TOKEN)
    let userType = localStorage.getItem(Constant.STORAGE_KEY.USER_TYPE)
    if (isNull(token) || isNull(userType)) {
        goToPage('console', true)
        return
    }
    if (fn) {
        fn()
    }
}

/**
 * [text]
 * @param data
 * @returns {boolean}
 */
export function isNull(data) {
    if (data === undefined) {
        return true
    } else if (data === null) {
        return true
    } else if (typeof data === 'string' && (data.length === 0 || data === '' || data === 'undefined' || data === 'null')) {
        return true
    } else if ((data instanceof Array) && data.length === 0) {
        return true
    }
    return false
}

/**
 * [text]
 * @param data
 * @returns {boolean}
 */
export function isNotNull(data) {
    return !isNull(data)
}

/**
 * [text]
 * @param msg
 */
export function showDanger(msg) {
    if (isNull(msg)) {
        return
    }
    Message({
        message: msg,
        type: 'error',
        showClose: true
    })
}

/**
 * [text]
 * @param msg
 */
export function showWarning(msg) {
    if (isNull(msg)) {
        return
    }
    Message({
        message: msg,
        type: 'warning',
        showClose: true
    });
}



/**
 * [text]
 * @param msg
 */
export function showSuccess(msg) {
    Message({
        message: msg,
        type: 'success',
        showClose: true
    })
}



/**
 * [text]
 * @param path
 * @param isRepalce
 */
export function goToPage(path, isRepalce) {
    if (isRepalce) {
        router.replace(path)
    } else {
        router.push(path)
    }
}

/**
 * [text]vue[text]
 * @param path
 * @param isRepalce
 */
export function getCurrentPage() {
    let hash = location.hash.replace('#', '')
    if (hash.indexOf('?') > 0) {
        hash = hash.substring(0, hash.indexOf('?'))
    }
    return hash
}

/**
 * [text][min,max][text]
 * @param min
 * @param max
 * @returns {number}
 */
export function randomNum(min, max) {
    return Math.round(Math.random() * (max - min) + min)
}


/**
 * [text]uuid
 */
export function getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        return (c === 'x' ? (Math.random() * 16 | 0) : ('r&0x3' | '0x8')).toString(16)
    })
}


/**
 * [text]
 * @param {string} mobile [text]
 * @param {string} areaCode [text]
 * @returns {boolean}
 */
export function validateMobile(mobile, areaCode) {
    // [text]
    const cleanMobile = mobile.replace(/\D/g, '');

    // [text]
    switch (areaCode) {
        case '+86': // 中国大// [comment]
            return /^1[3-9]\d{9}$/.test(cleanMobile);
        case '+852': // 中国香// [comment]
            return /^[569]\d{7}$/.test(cleanMobile);
        case '+853': // 中国澳// [comment]
            return /^6\d{7}$/.test(cleanMobile);
        case '+886': // 中国台// [comment]
            return /^9\d{8}$/.test(cleanMobile);
        case '+1': // 美国/加拿// [comment]/[comment]
            return /^[2-9]\d{9}$/.test(cleanMobile);
        case '+44': // 英// [comment]
            return /^7[1-9]\d{8}$/.test(cleanMobile);
        case '+81': // 日// [comment]
            return /^[7890]\d{8}$/.test(cleanMobile);
        case '+82': // 韩// [comment]
            return /^1[0-9]\d{7}$/.test(cleanMobile);
        case '+65': // 新加// [comment]
            return /^[89]\d{7}$/.test(cleanMobile);
        case '+61': // 澳大利// [comment]
            return /^[4578]\d{8}$/.test(cleanMobile);
        case '+49': // 德// [comment]
            return /^1[5-7]\d{8}$/.test(cleanMobile);
        case '+33': // 法// [comment]
            return /^[67]\d{8}$/.test(cleanMobile);
        case '+39': // 意大// [comment]
            return /^3[0-9]\d{8}$/.test(cleanMobile);
        case '+34': // 西班// [comment]
            return /^[6-9]\d{8}$/.test(cleanMobile);
        case '+55': // 巴// [comment]
            return /^[1-9]\d{10}$/.test(cleanMobile);
        case '+91': // 印// [comment]
            return /^[6-9]\d{9}$/.test(cleanMobile);
        case '+971': // 阿联// [comment]
            return /^[5]\d{8}$/.test(cleanMobile);
        case '+966': // 沙特阿拉// [comment]
            return /^[5]\d{8}$/.test(cleanMobile);
        case '+880': // 孟加拉// [comment]
            return /^1[3-9]\d{8}$/.test(cleanMobile);
        case '+234': // 尼日利// [comment]
            return /^[789]\d{9}$/.test(cleanMobile);
        case '+254': // 肯尼// [comment]
            return /^[17]\d{8}$/.test(cleanMobile);
        case '+255': // 坦桑尼// [comment]
            return /^[67]\d{8}$/.test(cleanMobile);
        case '+7': // 哈萨克斯// [comment]
            return /^[67]\d{9}$/.test(cleanMobile);
        default:
            // [text]：[text]5[text]，[text]15[text]
            return /^\d{5,15}$/.test(cleanMobile);
    }
}


/**
 * [text]SM2[text]（[text]）
 * @returns {Object} [text]
 */
export function generateSm2KeyPairHex() {
    // [text]sm-crypto[text]SM2[text]
    const sm2 = require('sm-crypto').sm2;
    const keypair = sm2.generateKeyPairHex();
    
    return {
        publicKey: keypair.publicKey,
        privateKey: keypair.privateKey,
        clientPublicKey: keypair.publicKey, // 客户端公// [comment]
        clientPrivateKey: keypair.privateKey // 客户端私// [comment]
    };
}

/**
 * SM2[text]
 * @param {string} publicKey [text]（[text]）
 * @param {string} plainText [text]
 * @returns {string} [text]（[text]）
 */
export function sm2Encrypt(publicKey, plainText) {
    if (!publicKey) {
        throw new Error('Public key cannot be null or undefined');
    }
    
    if (!plainText) {
        throw new Error('Plaintext cannot be empty');
    }
    
    const sm2 = require('sm-crypto').sm2;
    // SM2[text]，[text]04[text]
    const encrypted = sm2.doEncrypt(plainText, publicKey, 1);
    // [text]（[text]，[text]04[text]）
    const result = "04" + encrypted;
    
    return result;
}

/**
 * SM2[text]
 * @param {string} privateKey [text]（[text]）
 * @param {string} cipherText [text]（[text]）
 * @returns {string} [text]
 */
export function sm2Decrypt(privateKey, cipherText) {
    const sm2 = require('sm-crypto').sm2;
    // [text]04[text]（[text]）
    const dataWithoutPrefix = cipherText.startsWith("04") ? cipherText.substring(2) : cipherText;
    // SM2[text]
    return sm2.doDecrypt(dataWithoutPrefix, privateKey, 1);
}

/**
 * [text]
 * @param {Function} fn [text]
 * @param {number} delay [text]（[text]），[text]500ms
 * @param {boolean} immediate [text]，[text]false
 * @returns {Function} [text]
 */
export function debounce(fn, delay = 500, immediate = false) {
    let timer = null;
    
    return function (...args) {
        const context = this;
        
        if (timer) {
            clearTimeout(timer);
        }
        
        if (immediate && !timer) {
            fn.apply(context, args);
        }
        
        timer = setTimeout(() => {
            if (!immediate) {
                fn.apply(context, args);
            }
            timer = null;
        }, delay);
    };
}

