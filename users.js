#!/usr/bin/env node

const file      = './users.json'

const dotenv            = require('dotenv')
const request           = require('request-json')
const yargs             = require('yargs')
const jsonfile          = require('jsonfile')
const users             = require(file)

// Warn if user count is too high
if (users.length >= 24) {
    console.warn('The user list is getting too long.')
}

dotenv.config()

const base      = 'https://na1.api.riotgames.com/lol/'
const client    = request.createClient(base)
client.headers['X-Riot-Token'] = process.env.RIOT_API_KEY

yargs.command('add <summoner> <discord>', 'Add a user', (yargs) => {
    yargs.positional('summoner', {
        describe: 'summoner name',
        type: 'string'
    }).positional('discord', {
        describe: 'discord full user <name#number>',
        type: 'string'
    })
}, (argv) => {
    addUser(argv.summoner, argv.discord)
}).option('verbose', {
    alias: 'v',
    default: false
}).argv

function addUser(summoner, discord)
{
    summoner = summoner.toLowerCase()
    client.get('summoner/v4/summoners/by-name/' + summoner, function (err, res, body) {
        console.log(body)
        users[summoner] = {
            league: body.id,
            discord: discord,
            lastGame: null
        }

        jsonfile.writeFile(file, users, function (err) {
            if (err) console.error(err)
        })
    })
}


