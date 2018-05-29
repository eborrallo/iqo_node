var globals = require('./globals.js');
var functions = {};
var localStorage;
var time = function () {
    var date = new Date();
    return date.getHours() + " : " + date.getMinutes() + " : " + date.getSeconds() + " ";
}
functions.Forex = function (show_value, ls, bets) {
    localStorage = ls;
    var date = new Date();
    var buyed = localStorage.buyed;
    // var show_value = localStorage.get("show_value");
    getTime();

    if (serverTime.getSeconds() == 0) {//4
        localStorage.current_value = show_value;
    }
    //console.log(time()+serverTime.getSeconds());
    if (serverTime.getSeconds() == 59 && localStorage.buy_minute != date.getMinutes()) {//3
        localStorage.start_value = show_value;
        localStorage.buy_minute = date.getMinutes();

        var start_value = localStorage.start_value;
        var current_value = localStorage.current_value;


        if (current_value) {

            if (start_value > current_value) {
                var direction = localStorage.direction = "buy";//
                return true;
            }

            if (start_value < current_value) {
                var direction = localStorage.direction = "sell";//
                return true;


            }
        }
    }

};
//    "body-parser": "~1.17.1",
//    "cookie-parser": "~1.4.3",
//    "jade": "~1.11.0",
//    "serve-favicon": "~2.4.2",
//    "morgan": "~1.8.1",
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

functions.checkProfit = function (ls, bets, socket) {
    localStorage = ls;

    if (bets) {
        // console.log(bets);

        bets.forEach(function (bet) {
                if (bet.betType == 'buy' && !bet.betFinish) {


                    if (bet.betPirce < localStorage.forex_show_value) {
                        var diference = localStorage.forex_show_value - bet.betPirce;
                        // console.log('Entra-buy--'.bgRed + ' ' + diference);
                        // console.log(diference > 0.00006);
                        if (diference > 0.0002) {
                            console.log('VENDE'.bgRed);

                            socket.send(
                                JSON.stringify(
                                    {
                                        "name": "sendMessage",
                                        "request_id": "1502377107_2017153226",
                                        "msg": {
                                            "name": "close-position",
                                            "version": "1.0",
                                            "body": {
                                                "position_id": bet.betId
                                            }
                                        }
                                    }
                                )
                            );


                        }
                    }
                } else if (bet.betType == 'sell' && !bet.betFinish) {
                    if (bet.betPirce > localStorage.forex_show_value) {
                        var diference = bet.betPirce - localStorage.forex_show_value;
                        // console.log('Entra-sell--'.bgRed + '' + diference);
                         //console.log(diference );
                        if (diference > 0.0002) {

                            console.log('VENDE'.bgRed);
                            socket.send(
                                JSON.stringify(
                                    {
                                        "name": "sendMessage",
                                        "request_id": "1502377107_2017153226",
                                        "msg": {
                                            "name": "close-position",
                                            "version": "1.0",
                                            "body": {
                                                "position_id": bet.betId
                                            }
                                        }
                                    }
                                )
                            );

                        }
                    }
                }
            }
        );
        return bets;

    } else {


    }
}
;

module.exports = functions;

