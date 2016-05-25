var DiscordClient = require('discord.io');
var bot = new DiscordClient(getNewDcClient());
var whiteCh = "154514530284601344";
var fs = require('fs');
var http = require('http');
var you_I = getText();
var greeting = require('./greeting.js');
var ending = require('./ending.js');
var playing = require('./playing.js');
var findGNN = require('./findGNN.js');
var steamSales = require('./steam.js');
var review = require('./review.js');
var stuck = require('./stuck.js');
var msgLog = require('./MessageLog.js');
var pattern = require('./pattern.js');
var guideRecord = require('./GuideRecord.js');

bot.on('ready', discordReady);
bot.on('message', discordMsg);

function getNewDcClient() {
	var client = {};
	client.email = "00357027@ntou.edu.tw";
	client.password = "rpgmaker2003";
	client.autorun = true;
	return client;
}

function discordReady() {
	console.log(bot.username + " - (" + bot.id + ")");
    downloadXML();
	downloadSteamRSS();
}
var LOO_Call = {};
function discordMsg(user, userID, chID, msg, rawEvent) {
	if (!isProcessRequire(user, userID, chID)) return;
    if (msg.toLowerCase().includes("count"))
        return say(chID, msgCount(user, userID, msg.substr(6, msg.length - 7)));

	clearTimeout(LOO_Call[userID]);
	if (msg != "over" && msgLog.getLastLogType(userID) == "GamePlay") {
		LOO_Call[userID] = setTimeout(() => { LOO(10, chID, userID) }, 10000);
		msgLog.addLog(userID, msg, "GamePlay", "@last");
		guideRecord.addGuide(msgLog.getLastSubject(userID), user, msg);
		return;
	} else if (msg == "over") {
		say(chID, "謝謝你提供的策略");
		console.log(guideRecord.game);
		msgLog.addLog(userID, msg, "GamePlayEnd");
		return;
	}
	
	var greetingResult = greeting.greeting(msg);
	var endingResult = ending.ending(msg);
	var findGNNResult = findGNN.findGNN(msg);
	var steamResult = steamSales.findSales(msg);
	var reviewResult = review.review(msg);
	var stuckResult = stuck.stuck(msg);
	var patternResult = pattern.matchPattern(msg);
	
	console.log(patternResult);
	var m, type, subject;
	if (patternResult.match == true) {
		type = patternResult.result;
		if (patternResult.result == "GameDifficult")
			m = "你是在說" + patternResult.getTarget() + "的難度" + patternResult.slot[1] + patternResult.slot[2] + "嗎?";
		else if (patternResult.result == "GameStuck") {
			var tGame = patternResult.getTarget();
			if (guideRecord.guide[tGame])
				m =  guideRecord.provide[tGame][0] + "說他打過了：" + guideRecord.guide[tGame][guideRecord.provide[tGame][0]].concat();
			else
				m = "你是在說" + patternResult.getTarget() + "怎麼打都" + patternResult.slot[3] + "嗎?";
		} else if (patternResult.result == "GameInfo")
			m = "你是說" + patternResult.getTarget() + "最近出了" + patternResult.slot[3] + patternResult.slot[4] + "嗎?";
		else if (patternResult.result == "GamePlay") {
			m = "恭喜你打過了" + patternResult.getTarget() + "!\n可以教我嗎? ";
		} else if (patternResult.result == "GameDeal") {
			m = "你是在詢問" + patternResult.getTarget() + "的特價資訊嗎?\n";
			var sale = steamSales.findSales(patternResult.getTarget());
			if (sale) m += sale.title + "\n" + sale.link;
			else m += patternResult.getTarget() + "最近好像沒有優惠欸";
		}
		subject = patternResult.getTarget();
		say(chID, m);
	} else if (reviewResult.value) say(chID, reviewResult.msg);
	else if (stuckResult.value) say(chID, stuck.msg);
	else if (steamResult) say(chID, steamResult.title + "\n" + steamResult.link);
	else if (findGNNResult) say(chID, findGNNResult.link);
    else if (greetingResult.value) say(chID, greetingResult.msg);
    else if (endingResult.value) say(chID, endingResult.msg);
	else {
		msg = changeView(msg);
		say(chID, "為什麼你覺得" + msg + "?");
	}
	
	msgLog.addLog(userID, msg, type, subject);
	msgLog.print();
}

function LOO(n, chID, userID) {
	say(chID, "然後呢?");
	LOO_Call[userID] = setTimeout(() => { LOO(n * 2, chID, userID) }, n * 2000);
}

function isProcessRequire(user, userID, chID) {
	if (whiteCh != chID) return false;
	if (userID == bot.id) return false;
	return true;
}

function changeView(msg) {
	for (var i = 0; i < you_I.length; i++)
		while (msg.includes(you_I[i]))
			msg = msg.replace(you_I[i], "0x" + i);
	
	while (msg.includes("我"))
		msg = msg.replace("我", "0xni");
	while (msg.includes("你"))
		msg = msg.replace("你", "我");
	while (msg.includes("妳"))
		msg = msg.replace("妳", "我");
	while (msg.includes("0xni"))
		msg = msg.replace("0xni", "你");
	
	for (i = you_I.length; i >= 0; i--)
		while (msg.includes("0x" + i))
			msg = msg.replace("0x" + i, you_I[i]);
	return msg;
}

function say(ch, ms) {
    bot.sendMessage({
        to: ch,
        message: ms
    });
}

function getText() {
    var array = fs.readFileSync("word_you_I.txt", "utf8");
	array = array.split('\r\n');
    return array;
}

function downloadXML() {
    var file = fs.createWriteStream("rss_download.xml");
    var request = http.get("http://gnn.gamer.com.tw/rss.xml", function(response) {
        response.pipe(file);
    })
	
}

function downloadSteamRSS() {
	var file = fs.createWriteStream("steam_rss.xml");
	http.get("http://store.steampowered.com/feeds/daily_deals.xml", (res) => {
		res.pipe(file);
	});
}