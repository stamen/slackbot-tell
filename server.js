"use strict";

var util = require("util");

var bodyParser = require("body-parser"),
    chrono = require("chrono-node"),
    express = require("express"),
    moment = require("moment"),
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

moment.lang("en-custom", {
  calendar : {
    lastDay: "[yesterday at] LT",
    sameDay: "[today at] LT",
    nextDay: "[tomorrow at] LT",
    lastWeek: "[last] dddd [at] LT"
  },
  longDateFormat : {
    LT: "h:mma"
  }
});

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
      when = chrono.parse(what)[0],
      by = req.body.user_name,
      verbs = VERBS[req.body.command];

  if (who === "me") {
    who = by;
  }

  if (!when) {
    return res.send("um, couldn't figure out when you meant");
  }

  var body = what.slice(0, when.index - 1) + what.slice(when.index + when.text.length),
      msg = util.format("%s %s me to %s you %s",
                        by,
                        verbs[0],
                        verbs[1],
                        body),
      score = when.startDate.getTime() + TZ_OFFSET * 60 * 1000;

  var reminder = {
    who: who,
    what: msg,
    when: when.startDate,
    by: by
  };

  return client.zadd(REDIS_KEY,
                     score,
                     JSON.stringify(reminder),
                     function(err) {
    if (err) {
      return next(err);
    }

    return res.send(201, util.format("Ok, I'll %s %s %s %s.",
                                     verbs[1],
                                     who,
                                     body,
                                     moment(score).calendar()));
  });
});

app.listen(process.env.PORT || 8080, function() {
  console.log("Listening at http://%s:%d/", this.address().address, this.address().port);
});
