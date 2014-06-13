"use strict";

var util = require("util");

var bodyParser = require("body-parser"),
    chrono = require("chrono-node"),
    express = require("express"),
    tz = require("moment-timezone");

var app = express(),
    client = require("redis-url").connect();

var REDIS_KEY = "reminders",
    TZ = "America/Los_Angeles", // TODO look this up per user
    TZ_OFFSET = tz.tz(TZ)._offset,
    VERBS = {
      "/tell": ["asked", "tell"],
      "/ask": ["told", "ask"]
    };

setInterval(function() {
  console.log("now:", new Date().getTime());
  return client.zrangebyscore(REDIS_KEY, 0, new Date().getTime(), function(err, data) {
    if (err) {
      console.warn(err.stack);
      return;
    }

    data.forEach(function(x) {
      var reminder;

      try {
        reminder = JSON.parse(x);
      } catch (err) {
        console.warn(err.stack);
        return;
      }

      console.log(reminder);
      client.zrem(REDIS_KEY, x, function(err, reply) {
        console.log(arguments);
      });
    });
  });
}, 60e3).unref();

app.use(bodyParser.urlencoded());

app.post("/", function(req, res, next) {
  // TODO validate token (as a filter)

  var parts = req.body.text.split(" "),
      who = parts.shift(),
      what = parts.join(" "),
      when = chrono.parse(what, new Date(), "PDT")[0],
      by = req.body.user_name,
      verbs = VERBS[req.body.command];

  if (who === "me") {
    who = by;
  }

  if (!when) {
    return res.send("um, couldn't figure out when you meant");
  }

  var msg = util.format("%s %s me to %s you %s",
                        by,
                        verbs[0],
                        verbs[1],
                        what.slice(0, when.index - 1) + what.slice(when.index + when.text.length));

  console.log("who:", who);
  console.log("what:", msg);
  console.log("when:", when);
  console.log("score:", when.startDate.getTime());

  var reminder = {
    who: who,
    what: msg,
    when: when.startDate,
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
