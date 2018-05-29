/**
 * Created by Enric on 15/06/2017.
 */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var colors = require('colors');
var WebSocket = require("ws");
var wss_url = "wss://iqoption.com/echo/websocket";
var socket = new WebSocket(wss_url);

var martingale = require("./martingale.js");
var forex = require("./forex.js");
var globals = require('./globals.js');
var Actives = globals.Actives;
var figlet = require('figlet');
var forex_bets = [];
var time = function () {
    var date = new Date();
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " ";
}
figlet('Kikaso Bot!!', function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data)
});
///////////////////////////Local Storage
localStorage = {
    strategy: 'martingale',//'martingale',
    active: 'USDCAD',
    option: 'turbo',
    start_lot: 1,
    configured: true,
    trade: true,
    trading: false,
    bestActiveId: null,
    bestActiveName: null,
    bestActiveProfit: null,
    connected: null,
    buyed: null,
    profit_amount: null,
    show_value: null,
    current_lot: null,
    direction: null,
    martin_leverage: null,
    oldBalance: null,
    balance: null,
    current_value: null,
    start_value: null,
    multiplicador: null,
    forex_show_value: null
}
///////////////////////////////////////////
var url = "https://eu.iqoption.com/api/candles/history?";
var request = require("request");
request({
    url: url,
    json: true
}, function (error, response, body) {

    if (!error && response.statusCode === 200) {
        var json = body;
        json.result.actives.forEach(function (value) {
            if (value.profit.turbo && value.name.search('OTC') == -1) {
                if (!localStorage.bestActiveId) {
                    localStorage.bestActiveId = value.id;
                    localStorage.bestActiveName = value.name;
                    localStorage.bestActiveProfit = value.profit.turbo;
                } else if (localStorage.bestActiveProfit < value.profit.turbo) {
                    localStorage.bestActiveId = value.id;
                    localStorage.bestActiveName = value.name;
                    localStorage.bestActiveProfit == value.profit.turbo;
                }
                if (globals.Actives[localStorage.active] == value.id) {
                    console.log(time() + "Actualmente estas invirtiendo en ".grey + value.name.grey + " al ".grey + value.profit.turbo + " %  de beneficio".grey); //Print the json response

                    var profit = (value.profit.turbo / 100 + 1) / (value.profit.turbo / 100);
                    localStorage.multiplicador = profit;
                }

            }
        });
        console.log(time() + "Id:".grey + localStorage.bestActiveId + "  Active: ".grey + localStorage.bestActiveName.grey + "  " + localStorage.bestActiveProfit + " % ".grey); //Print the json response
    } else {
        console.log(time() + "Ooops ha habido un error en la llamada a la api \"/api/candles/history?\" ".bgRed);
    }
});
getWS();

// var json_data = JSON.parse("https://eu.iqoption.com/api/candles/history?");

function getWS() {
    socket.onopen = function () {

        ssid = globals.ssid;

        socket.send(JSON.stringify({"name": "ssid", "msg": ssid}))
        socket.send(JSON.stringify({"name": "subscribe", "msg": "deposited"}))
        socket.send(JSON.stringify({"name": "subscribe", "msg": "tradersPulse"}))
        socket.send(JSON.stringify({"name": "subscribe", "msg": "activeScheduleChange"}))
        socket.send(JSON.stringify({"name": "subscribe", "msg": "activeCommissionChange"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "iqguard"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "signal"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "timeSync"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "feedRecentBets"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "feedRecentBets2"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "feedTopTraders2"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "feedRecentBetsMulti"}))
        socket.send(JSON.stringify({"name": "unSubscribe", "msg": "tournament"}))

        // socket.send(JSON.stringify({
        //     "name": "api_profile_changebalance",
        //     "request_id": "1497613308_2026144769",
        //     "msg": {"balance_id": 28699417}
        // }))
        // socket.send(JSON.stringify({
        //     "name": "api_game_getoptions",
        //     "request_id": "1497613308_484477721",
        //     "msg": {"limit": 30, "user_balance_id": 28699417}
        // }))

    };
    socket.onmessage = function (event) {

        var json_data = {
            name: null
        };
        try {
            var incomingMessage = event.data;
            // var json_data = JSON.parse(incomingMessage);
            json_data = JSON.parse(incomingMessage)
        }
        catch (err) {
            console.log(err.toString().bgRed);
        }
        if (json_data.name == "profile") {
            if (json_data.msg == false) {
                console.error("Cant connect to websocket, need to login to " + https_url);
                localStorage.connected = false;
            }
            else {
                localStorage.connected = true;
                if (localStorage.balance != json_data.msg['balance'].toString()) {
                    console.log(time() + "Actualizacion de tus $$ : ".yellow + json_data.msg['balance'].toString().yellow + " $$$".yellow);
                }
                localStorage.balance = json_data.msg['balance'].toString();
                if (!localStorage.trading) {
                    // localStorage.direction = 'sell';
                    // buyActiveForex();
                    Trade();
                    localStorage.trading = true;
                }
            }
        }

        if (json_data.name == "timeSync") {
            servertime = json_data.msg;
        }
        if (json_data.name == "buyComplete") {
            if (json_data.msg.isSuccessful == false) {
                console.error(json_data.msg.message.bgRed);
                localStorage.buyed = false;
            }
            else {
                console.warn("Successfully buy".grey)
                newVal = true;
                localStorage.buyed = true;
            }

        }

        if (json_data.name == "candles") {
            candlesData = json_data.msg.data;
        }
        if (json_data.name == "order-changed") {
            var exist = false;
            forex_bets.forEach(function (bet) {

                if (bet.betId == json_data.msg.position_id) {
                   bet.betFinish=true;
                    exist=true;
                }
            });
            if (!exist) {
                bet = {
                    'betId': json_data.msg.position_id,
                    'betPirce': json_data.msg.avg_price,
                    'betType': json_data.msg.side,
                    'betFinish':false
                };
                forex_bets.push(bet);
            }
        }

        if (json_data.name == "listInfoData") {
            profit_amount = json_data.msg[0]["profit_amount"];
            localStorage.profit_amount = profit_amount;
            localStorage.buyed = false;
            //checkProfit();
            // console.log(time()+"Ganacias / Perdidas : " + profit_amount);
        }

        if (json_data.name == "newChartData") {
            show_value = json_data.msg["show_value"];
            localStorage.forex_show_value = json_data.msg["show_value"];
            localStorage.show_value = show_value.toString().split(".").join("");
            //console.log(time()+json_data.msg["show_value"] + "---" + json_data.msg["symbol"])
            if (localStorage.strategy == 'forex') {
                forex_bets = forex.checkProfit(localStorage, forex_bets, socket);
            }
        }
        // All websocket messages
        // if (json_data.name != "newChartData" &&
        //     json_data.name != "listInfoData" &&
        //     json_data.name != "candles" &&
        //     json_data.name != "buyComplete" &&
        //     json_data.name != "timeSync" &&
        //     json_data.name != "tournament" &&
        //     json_data.name != "heartbeat" &&
        //     json_data.name != "tradersPulse" &&
        //     json_data.name != "profile")
        //     console.log(time() + incomingMessage);
    };
    socket.onerror = function (event) {
        var incomingMessage = event.data;
        console.error(incomingMessage);
        localStorage.connected = false;
    };
    socket.onclosed = function (event) {
        socket.connect();
    }
    return socket;
}

function Trade() {

    var trade = localStorage.trade;
    // localStorage.active", 'EURUSD');
    var active = localStorage.active;

    var strategy = localStorage.strategy;
    var start_lot = localStorage.start_lot;

    localStorage.martin_leverage = 0;
    localStorage.buyed = false;
    localStorage.current_lot = start_lot;


    console.warn("comienzo de comercio...".bgGreen);
    // chrome.notifications.create("", {
    //     type: "basic",
    //     iconUrl: "img/logo_w.png",
    //     title: "IQ Option bot",
    //     message: "comienzo de comercio..."
    // });

    socket.send(JSON.stringify({"name": "setActives", "msg": {"actives": [Actives[active]]}})) //Actives[active]

    timerId = setInterval(function () {

        if (strategy == "martingale") {
            if (martingale.Martingale(localStorage.show_value, localStorage)) {
                buyActive()
            }
        } else if (strategy == "forex") {
            if (forex.Forex(localStorage.show_value, localStorage, forex_bets)) {
                buyActiveForex();
            }

        }
    }, 1000);


}
function buyActiveForex() {
    // checkProfit();
    //console.log(time()+'******************************************************************');
    var active = localStorage.active;
    var option = localStorage.option;
    var current_lot = localStorage.current_lot;
    var direction = localStorage.direction;


    console.log(time() + "comprar...".bgBlue);
    console.log(time() + "activo: ".bgBlue + active.bgBlue);
    console.log(time() + "opción: ".bgBlue + "Forex".bgBlue);
    console.log(time() + "precio: ".bgBlue + current_lot);
    console.log(time() + "tipo: ".bgBlue + direction.bgBlue);


    // console.info("expirationtimestamp: " + expirationtimestamp);
    // console.info("servertimestamp: " + servertimestamp);
    socket.send(JSON.stringify({
        "name": "sendMessage",
        "request_id": "1502284850_35835425",
        "msg": {
            "name": "place-order-temp",
            "version": "3.0",
            "body": {
                "user_balance_id": 28699417,
                "client_platform_id": "9",
                "instrument_type": "forex",
                "instrument_id": "USDCAD",
                "side": direction,
                "type": "market",
                "amount": 100,
                "leverage": 50,
                "limit_price":+0.00001,
                "stop_price":-0.00001
            }
        }
    }));

    json = {
        "name": "newChartData",
        "msg": {
            "active_id": 100,
            "symbol": "USDCAD",
            "bid": 1.26834,
            "ask": 1.26838,
            "value": 1.26836,
            "time": 1502371801,
            "buy": 1.26838,
            "sell": 1.26834,
            "show_value": 1.26836
        }
    };

}
function buyActive() {
    // checkProfit();
    //console.log(time()+'******************************************************************');
    var active = localStorage.active;
    var option = localStorage.option;
    var current_lot = localStorage.current_lot;
    var direction = localStorage.direction;
    var dirForex = null;
    if (direction == 'put') {
        dirForex = 'sell';
    } else {
        dirForex = 'buy'
    }

    console.log(time() + "comprar...".bgBlue);
    console.log(time() + "activo: ".bgBlue + active.bgBlue);
    console.log(time() + "opción: ".bgBlue + option.bgBlue);
    console.log(time() + "precio: ".bgBlue + current_lot);
    console.log(time() + "tipo: ".bgBlue + direction.bgBlue);


    socket.send(JSON.stringify({
        "name": "buyV2",
        "msg": {
            "price": current_lot,
            "exp": expirationtimestamp,
            "act": globals.Actives[active],//globals.Actives[active],
            "type": option,
            "time": servertimestamp,
            "direction": direction
        }
    }));
}
