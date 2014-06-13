"use strict";

var util = require("util");

var chrono = require("chrono-node"),
    express = require("express");

var app = express(),
    client = require("redis-url").connect();

var REDIS_KEY = "reminders",
    VERBS = {
      "/tell": ["asked", "tell"],
      "/ask": ["told", "ask"]
    };

setInterval(function() {
  return client.zrangebyscore(REDIS_KEY, 0, new Date().getTime(), function(err, reply) {
    if (err) {
      console.warn(err.stack);
      return;
    }

    console.log(reply);
  });
}, 60e3).unref();

app.post("/", function(req, res, next) {
  // TODO validate token (as a filter)

  var parts = req.body.text.split(" "),
      who = parts.shift(),
      what = parts.join(" "),
      when = chrono.parse(what)[0],
      by = req.body.user_name,
      verbs = VERBS[req.body.command];

  if (!when) {
    return res.send("um, couldn't figure out when you meant");
  }

  what = util.format("%s %s me to %s you %s",
                     by,
                     verbs[0],
                     verbs[1],
                     what.slice(0, when.index - 1) + what.slice(when.index + when.text.length));

  console.log("who:", who);
  console.log("what:", what);
  console.log("when:", when);

  var reminder = {
    who: who,
    what: what,
    when: when,
    by: by
  };

  return client.zadd(REDIS_KEY,
                     when.startDate.getTime(),
                     JSON.stringify(reminder),
                     function(err, reply) {
    if (err) {
      return next(err);
    }

    return res.send(201);
  });
});

app.listen(process.env.PORT || 8080, function() {
  console.log("Listening at http://%s:%d/", this.address().address, this.address().port);
});
