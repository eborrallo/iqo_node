var globals = require('./globals.js');
var functions = {};
var localStorage;
var time = function () {
    var date = new Date();
    return date.getHours() + " : " + date.getMinutes() + " : " + date.getSeconds() + " ";
}
functions.Martingale = function (show_value, ls) {
    localStorage = ls;
    var date = new Date();
    var buyed = localStorage.buyed;
    // var show_value = localStorage.get("show_value");
    getTime();
    if (serverTime.getSeconds() == 7) {//4
        localStorage.current_value = show_value;
    }
    //console.log(time()+serverTime.getSeconds());
    if (serverTime.getSeconds() == 6 && localStorage.buy_minute != date.getMinutes()) {//3
        localStorage.start_value = show_value;
        localStorage.buy_minute = date.getMinutes();

        var start_value = localStorage.start_value;
        var current_value = localStorage.current_value;


        if (current_value) {

            if (start_value > current_value) {
                var direction = localStorage.direction = "call";

                if (checkProfit()) {
                    // buyActive(soket);

                    return true;
                } else {
                    console.log(time() + "Esperando respuesta".grey)
                }

            }

            if (start_value < current_value) {
                var direction = localStorage.direction = "put";
                if (checkProfit()) {
                    // buyActive(soket);

                    return true;
                } else {
                    console.log(time() + "Esperando respuesta".grey)
                }


            }
        }
    }

};
//    "body-parser": "~1.17.1",
//    "cookie-parser": "~1.4.3",
//    "jade": "~1.11.0",
//    "serve-favicon": "~2.4.2",
//    "morgan": "~1.8.1",
module.exports = functions;
function getTime() {
    serverTime = new Date(servertime);
    // console.info("Server time: " + serverTime);

    servertimestamp = Math.floor(serverTime.getTime() / 1000);
    // console.info("Server timestamp in seconds: " + servertimestamp)

    expirationTime = new Date(servertime);
    expirationTime.setMinutes(serverTime.getMinutes() + 1);
    expirationTime.setSeconds(0, 0);


    // console.info("Server time seconds: " + serverTime.getSeconds())
    if (serverTime.getSeconds() > 30) {
        expirationTime.setMinutes(serverTime.getMinutes() + 2);
    }
    // console.info("Expiration time: " + expirationTime);

    expirationtimestamp = Math.floor(expirationTime.getTime() / 1000);
    // console.info("Expiration timestamp in seconds: " + expirationtimestamp)

};

function checkProfit() {

    var profit_amount = localStorage.profit_amount;
    var start_lot = localStorage.start_lot;
    var current_lot = localStorage.current_lot;
    var martin_leverage = localStorage.martin_leverage;
    var oldBalance = localStorage.oldBalance;
    var balance = localStorage.balance;

    console.warn("Ahora tienes : ".grey + balance.grey + " $$$".grey);
    console.warn("Antes tenias : ".grey + oldBalance + " $$$".grey)
    // console.warn("profit_amount: " + profit_amount + " ---------   start_lot : " + start_lot + "------------ current_lot : " + current_lot + "-------- martin_leverage : " + martin_leverage)

    if (!oldBalance) {
        console.warn("GOO vamos a empezar a ganar $$$".grey);

        localStorage.current_lot = start_lot;
        localStorage.martin_leverage = 0;
        localStorage.oldBalance = balance;

        return true;
    } else if (oldBalance > balance) {

        // console.warn(balance + "  " + localStorage.get("balance_now"));

        if (localStorage.martin_leverage >= 6) {
            localStorage.current_lot = start_lot;
            localStorage.martin_leverage = 0;
            console.warn("Has perdido demasiado , empezamos de nuevo  :( ".bgRed);

        } else {

            console.warn("Has perdido , aumentamos apuesta ;) ".bgRed);
            if (current_lot * 2.5 <= 4999) {
                localStorage.current_lot = current_lot *  localStorage.multiplicador;//2.5; //3 to win 50% else 25

            }
            localStorage.martin_leverage = localStorage.martin_leverage + 1;
        }
        localStorage.oldBalance = balance;
        return true;

    } else if (balance > oldBalance) {

        console.warn("GANAMOS :)".bgGreen);

        localStorage.current_lot = start_lot;
        localStorage.martin_leverage = 0;
        localStorage.oldBalance = balance;

        return true;


    } else if (balance == oldBalance) {
        console.warn("que raro un EMPATE".bgCyan);


        return true;
    }
    return false;
}
