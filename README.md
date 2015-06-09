# slackbot-tell

Reminders for other people.

It's like Slack's `/remind` command, but with the ability to have slackbot
`/tell` or `/ask` other people things at specific times.

E.g.:

```
/tell @mojodna to handle idling tomorrow

slackbot: Ok, I'll tell @mojodna to handle idling tomorrow at 12:00pm.
```

Then, tomorrow at 12pm, slackbot will send you a message saying, "@mojodna
asked me to tell you to handle idling."

## Caveats

We don't actually use this, primarily because Heroku app idling prevents
future notifications from being delivered. Your mileage may vary.

## Environment Variables

* `SLACK_TOKEN` - this is the web hook token that Slack provides when you configure a new integration
* `REDIS_URL` - a URL for an accessible Redis service (when deployed on Heroku, this involves configuring one of the many add-ons)
