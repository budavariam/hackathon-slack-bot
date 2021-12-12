const express = require('express');
const router = express.Router();
const request = require('request');
require('dotenv').config();


const errorResponse = (msg = `An error occured.`) => {
    return {
        // response_type: 'in_channel', // public to the channel
        response_type: 'ephemeral',
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: msg,
                }
            }
        ],
        attachments: []
    }
}

const getBlocks = (users) => {
    try {
        return {
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `We found *${users.length}* Star${(users.length !== 1) ? 's' : ''}`
                    }
                },
                {
                    "type": "divider"
                },
                ...(users || []).flatMap(user => {
                    return [{
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": [
                                `*<${user.wiki}|${user.name}>*`,
                                `${user.grewUp}`,
                                user.slackId ? `Slack: @${user.slackId}` : null
                            ].filter(e => e).join("\n"),
                        },
                        "accessory": {
                            "type": "image",
                            "image_url": user.img,
                            "alt_text": user.name
                        }
                    },
                    {
                        "type": "divider"
                    }]
                }).filter((e, i) => i < 50)
            ]
        }
    } catch (err) {
        console.error("Failed to generate blocks", err)
        return errorResponse()
    }
}

const getUserBySearchString = function (searchString) {
    try {
        if (!searchString || searchString.length < 3) {
            const data = errorResponse(`Please provide at least 3 characters to search.`)
            return Promise.resolve(data)
        }
        const options = {
            url: `${process.env.BASE_URL}:${process.env.PORT}/users`,
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ search: searchString })
        };

        // Return new promise
        return new Promise(function (resolve, reject) {
            request(options, function (error, response, body) {
                // console.log("response", error, response, body)
                if (error) {
                    reject(error);
                } else {
                    const users = JSON.parse(body);
                    const blks = getBlocks(users)
                    const data = {
                        // response_type: 'in_channel', // public to the channel
                        response_type: 'ephemeral',
                        blocks: blks.blocks,
                        attachments: []
                    };
                    // console.log(JSON.stringify(blks, null, 2))
                    resolve(data);
                }
            });
        });
    } catch (err) {
        console.error("Failed to get data", err);
        return Promise.resolve(errorResponse())
    }
};

const getData = function (body) {
    // console.log(body.token);
    console.log({
        time: new Date(),
        command: body.command,
        text: body.text,
        team_id: body.team_id,
        team_domain: body.team_domain,
        channel_id: body.channel_id,
        channel_name: body.channel_name,
        user_id: body.user_id,
        user_name: body.user_name,
        trigger_id: body.trigger_id
    })

    return getUserBySearchString(body.text)
}

module.exports = { getData };