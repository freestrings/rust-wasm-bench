var module, functions = {};

let sumInt = require('./sumInt.js');
sumInt().then(m => {
    functions.sumInt = m._sumInt;
    functions.inlineSumInt = m._inlineSumInt;
    module = m;
    main();
});

function jsSumInt(array, n) {
    var s = 0;
    for (var i = 0; i < n; i++) {
        s += array[i];
    }
    return s;
}

function inlineJsSumInt(array, n, iter) {
    var s = 0;
    for (var i = 0; i < iter; i++) {
        s += jsSumInt(array, n);
    }
    return s;
}

// https://takahirox.github.io/WebAssembly-benchmark/tests/sumInt.html
function wsSumInt(array, n) {
    var pointer = module._malloc(array.length * 4);
    var offset = pointer / 4;
    module.HEAP32.set(array, offset);
    var result = functions.sumInt(pointer, n);
    module._free(pointer);
    return result;
}

function wsInlineWsSumInt(array, n, iter) {
    var pointer = module._malloc(array.length * 4);
    var offset = pointer / 4;
    module.HEAP32.set(array, offset);
    var result = functions.inlineSumInt(pointer, n, iter);
    module._free(pointer);
    return result;
}

function initArray(num) {
    let array = new Int32Array(num);
    for (let i = 0, len = array.length; i < len; i++) {
        array[i] = ((Math.random() * 20000) | 0) - 10000;
    }
    return array;
}

function run(message, iter, cb) {
    let d = Date.now();
    for (let i = 0; i < iter; i++) {
        let ret = cb();
        if (ret !== true) throw new Error(cb.toString());
    }
    console.log(message, Date.now() - d);
}

function main() {
    let iter = 10;
    let num = 100000000;
    let array = initArray(num);
    let jsResult = jsSumInt(array, num);
    let wsResult = wsSumInt(array, num);
    let inlineJsResult = inlineJsSumInt(array, num, iter);
    let inlineWsResult = wsInlineWsSumInt(array, num, iter);

    if(jsResult !== wsResult) {
        throw new Error(`1.결과다름: ${jsResult}, ${wsResult}`);
    }

    if(inlineJsResult !== inlineWsResult) {
        throw new Error(`2.결과다름: ${inlineJsResult}, ${inlineWsResult}`);
    }

    if(jsResult * iter !== inlineJsResult) {
        throw new Error(`3.결과다름: ${(jsResult * iter)}, ${inlineJsResult}`);
    }

    run('JS - sum', iter, () => jsSumInt(array, num) === jsResult);
    run('JS - inlineSum', iter, () => inlineJsSumInt(array, num, iter) === inlineJsResult);
    run('Ws - sum', iter, () => wsSumInt(array, num) === jsResult);
    run('Ws - inlineSum', iter, () => wsInlineWsSumInt(array, num, iter) === inlineJsResult);
}