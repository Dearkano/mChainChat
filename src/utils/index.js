export function Generate_key() {
    var key = "";
    var hex = "0123456789abcdef";

    for (var i = 0; i < 64; i++) {
        key += hex.charAt(Math.floor(Math.random() * 16));
        //Initially this was charAt(chance.integer({min: 0, max: 15}));
    }
    return key;
}