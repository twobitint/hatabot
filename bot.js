#!/usr/bin/env node

const file      = './users.json'

const dotenv            = require('dotenv')
const puppeteer         = require('puppeteer')
const mergeImg          = require('merge-img')
const Discord           = require('discord.io')
const request           = require('request-json')
const jsonfile          = require('jsonfile')
const users             = require(file)

dotenv.config()

const base      = 'https://na1.api.riotgames.com/lol/'
const client    = request.createClient(base)
client.headers['X-Riot-Token'] = process.env.RIOT_API_KEY

games = {}
promises = []
for (let summoner in users) {
    const user = users[summoner]
    promises.push(new Promise((resolve, reject) => {
        client.get('spectator/v3/active-games/by-summoner/' + user.league, function (err, res, body) {
            if ('gameId' in body) {
                const gameId = body.gameId
                if (user.lastGame != gameId) {
                    console.log(summoner)
                    if (!(gameId in games)) {
                        games[gameId] = {}
                    }
                    games[gameId][summoner] = user
                }
            }
            resolve()
        })
    }))
}
Promise.all(promises).then(function () {
    for (let gameId in games) {
        const game = games[gameId]
        for (summoner in game) {
            user = game[summoner]
            users[summoner].lastGame = gameId
        }
        GetPoroScreenshot(Object.keys(game)[0], function (buf) {
            SendDiscordMessage(game, buf)
        })
    }
    // update users file
    // jsonfile.writeFile(file, users, function (err) {
    //     if (err) console.error(err)
    // })
})

function SendDiscordMessage(users, poroImageBuffer)
{
    var bot = new Discord.Client({
        token: process.env.DISCORD_TOKEN,
        autorun: true
    });
    
    bot.on('ready', function() {
        for (key in bot.users) {
            var user = bot.users[key];
            var username = user.username + '#' + user.discriminator;
            for (userKey in users) {
                if (username == users[userKey].discord) {
                    console.log(user);
                    console.log(username);
                    bot.uploadFile({
                        to: user.id,
                        file: poroImageBuffer,
                        message: 'hello?',
                        filename: 'poro.png'
                    }, function (err, resp) {
                        console.error(err)
                    })
                }
            }
        }
        //console.log(bot.users);
        // bot.sendMessage({
        //     to: '#test',
        //     message: 'hi'
        // })
    });

    bot.on('disconnect', function(errMsg, code) {
        console.log(errMsg)
        console.log(code)
    })
}


function GetPoroScreenshot(name, callback) {
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://porofessor.gg/live/na/' + name);
        await page.setViewport({width: 1920, height: 1200});
        await page.waitForSelector('.cards-list');
        //await page.screenshot({path: '/var/www/yahoobb/public/test.png'});

        const elems = await page.$$('.cards-list');
        var i = 1;
        for (let elem of elems) {
            //console.log(elementHandle.getProperties());
            await elem.screenshot({path: '/tmp/test' + i + '.png'});
            i++;
        }

        await browser.close();

        mergeImg(['/tmp/test1.png', '/tmp/test2.png'], {direction: true})
            .then((img) => {
                // Save image as file
                //img.write('/var/www/yahoobb/public/test.png', callback);
                // Get image as `Buffer`
                img.getBuffer("image/png", (error, buf) => callback(buf));
            });
    })();
}
