# slackbot-tell

Reminders for other people.

It's like Slack's `/remind` command, but with the ability to have slackbot
`/tell` or `/ask` other people things at specific times.

E.g.:

```
/tell @mojodna to handle idling tomorrow

slackbot: Ok, I'll tell @mojodna to handle idling tomorrow at 12:00pm.
```

Then, tomorrow at 12pm, slackbot will send you a message saying, "@seth asked
me to tell you to handle idling."
