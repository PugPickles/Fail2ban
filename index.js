const fs = require("fs");
const path = require('path');
const process = require('process');


let config = {};



// calculate time from given format in millis
function timeCalc(banMode, banTime) {
    // seconds to millis
    if (banMode == "s") {
        config.bantime = parseInt(banTime) * 1000;
        return;
    }

    // minutes to millis
    if (banMode == "m") {
        config.bantime = parseInt(banTime) * 60 * 1000;
        return;
    }

    // hours to millis
    if (banMode == "h") {
        config.bantime = parseInt(banTime) * 60 * 60 * 1000;
        return;
    }

    // days to millis
    if (banMode == "d") {
        config.bantime = parseInt(banTime) * 24 * 60 * 60 * 1000;
        return;
    }

    // no valid letter for conversion
    console.error(`Invalid parameter for "bantime mode" (mode = ${banMode})`);
    console.info("Valid are the letters: s = seconds | m = minutes | h = hours | d = days");
    process.exit(1);
}



function log(msg) {
    if (! config.log) {
        return;
    }

    fs.appendFileSync(path.join(config.path, "log.log"), `${new Date(Date.now()).toLocaleString()} | ${msg}\n`, error => {
        if (error) {
            console.error(error);
            process.exit(1);
        }
    });
}



module.exports = {
    config(configJSON) {
        try {
            // calculate time from given format in millis
            timeCalc(configJSON.bantime.mode, configJSON.bantime.count);

            // check and set maxTry
            if (!configJSON.maxTry) {
                console.error('The parameter "maxTry" is missing, but needed');
                process.exit(1);
            }
            config.maxTry = parseInt(configJSON.maxTry);
            
            // check and set logging
            if (configJSON.log == undefined) {
                console.error('The parameter "log" is missing, but needed');
                process.exit(1);
            }
            config.log = configJSON.log;
            
            // check path
            if (! fs.existsSync(configJSON.path)) {
                console.error(`Path "${configJSON.path}" is invalid`);
                process.exit(1);
            }
            config.path = configJSON.path;

            // create blocklist/log
            if (! fs.existsSync(path.join(config.path, "blocklist.json"))) {
                fs.writeFileSync(path.join(config.path, "blocklist.json"), "{}");
            }

            if (config.log && ! fs.existsSync(path.join(config.path, "log.log"))) {
                fs.writeFileSync(path.join(config.path, "log.log"), "");
            }

        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    },

    check(ip, cb) {
        let blocklist = JSON.parse(fs.readFileSync(path.join(config.path, "blocklist.json")));

        // ip in list
        if (ip in blocklist) {
            // check max try
            if (blocklist[ip].try >= config.maxTry) {
                // check time expired
                if (Date.now() >= blocklist[ip].bantime) {
                    delete blocklist[ip];

                    fs.writeFileSync(path.join(config.path, "blocklist.json"), JSON.stringify(blocklist));

                    log(`${ip} | [CHECK] | Time has expired, unlock`);
                    return cb({
                        "baned": false
                    });
                }

                // time not expired
                log(`${ip} | [CHECK] | Time is not expired yet, will be unlocked at ${new Date(blocklist[ip].bantime).toLocaleString()}`);
                return cb({
                    "baned": true,
                    "try": blocklist[ip].try,
                    "bantime": blocklist[ip].bantime
                });
            }

            // max try not reached
            log(`${ip} | [CHECK] | Maximum number of attempts not yet reached (${blocklist[ip].try}/${config.maxTry})`);
            return cb({
                "baned": false,
                "try": blocklist[ip].try
            });
        } 
        
        // ip not in list
        log(`${ip} | [CHECK] | IP is not bant`);
        return cb({
            "baned": false
        });
    },

    ban(ip, cb) {
        let blocklist = JSON.parse(fs.readFileSync(path.join(config.path, "blocklist.json")));

        // check if ip exist
        if (ip in blocklist) {
            // check max try
            if (blocklist[ip].try >= config.maxTry) {
                log(`${ip} | [BAN] | IP is already bant`);
                return cb({
                    "baned": true,
                    "try": blocklist[ip].try,
                    "bantime": blocklist[ip].bantime
                });
            }

            // update try and time
            blocklist[ip] = {
                "try": blocklist[ip].try + 1,
                "bantime": Date.now() + config.bantime
            }

            fs.writeFileSync(path.join(config.path, "blocklist.json"), JSON.stringify(blocklist));

            // check max try
            if (blocklist[ip].try >= config.maxTry) {
                log(`${ip} | [BAN] | Maximum number of attempts reached (${blocklist[ip].try}/${config.maxTry})`);
                return cb({
                    "baned": true,
                    "try": blocklist[ip].try,
                    "bantime": blocklist[ip].bantime
                });
            }

            log(`${ip} | [BAN] | Maximum number of attempts not yet reached (${blocklist[ip].try}/${config.maxTry})`);
            return cb({
                "baned": false,
                "try": blocklist[ip].try
            });
        }

        // set ip
        blocklist[ip] = {
            "try": 1,
            "bantime": Date.now() + config.bantime
        }

        fs.writeFileSync(path.join(config.path, "blocklist.json"), JSON.stringify(blocklist));

        log(`${ip} | [BAN] | Add ip to list`);
        return cb({
            "baned": false,
            "try": blocklist[ip].try
        });
    },

    delete(ip, cb) {
        let blocklist = JSON.parse(fs.readFileSync(path.join(config.path, "blocklist.json")));

        if (ip in blocklist) {       
            delete blocklist[ip];

            fs.writeFileSync(path.join(config.path, "blocklist.json"), JSON.stringify(blocklist));

            log(`${ip} | [DELETE] | Delete ip from list`);
            return cb(true);
        }

        log(`${ip} | [DELETE] | IP is not listed`);
        return cb(false);
    }
}