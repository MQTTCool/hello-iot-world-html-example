var mqtt = require('mqtt')

// Connect to the MQTT broker listening at localhost on port 1883.
var client = mqtt.connect('mqtt://localhost:1883')

// Upon successul connection, start simulation.
client.on('connect', function () {
  var tick = 100; // Tick interval in ms.
  var startTimeMillis = Date.now(); // Take current timestamp in ms.
  var totalTimeSec = 0; // Total time in seconds.
  var lastTimeMills = startTimeMillis; // Used to save last timestamp.

  var limit = 135; // Speed limit to determine speed varation range.
  var baseSpeed = 215; // Base speed limit to determine speed varation range.
  var lastSpeedKmH = 130; // Initial simulated speed in Km/h, also used to save last determined speed

  var totalDistanceMeter = 0; // Total distance covered in meters.

  // Fixed thresholds to determine RPM calcuation.
  var gearThresholds = [90, 150, 220, 300, 320];
  var gearRatios = [250, 400, 300, 250, 1000, 660];
  var baseRPM = 2000;

  // Start generating simulated metrics at tick interval.
  setInterval(function () {
    // Simulate speed variation.
    var ratio = (lastSpeedKmH - baseSpeed) / limit;
    var direction = 1;
    if (ratio < 0) {
      direction = -1;
    }
    ratio = Math.min(Math.abs(ratio), 1);
    var weight = (ratio * ratio * ratio);
    var prob = (1 - weight) / 2;
    if (!(Math.random() < prob)) {
      direction = direction * -1;
    }
    var difference = Math.round(Math.random() * 3) * direction;
    var speedKmH = lastSpeedKmH + difference;

    // Calculate current RPM.
    var diff = speedKmH
    var i = 0;
    for (i = 0; i < gearThresholds.length; i++) {
      if (speedKmH < gearThresholds[i]) {
        break;
      }
    }
    if (i > 0) {
      diff = speedKmH - gearThresholds[i - 1];
    }
    var rpm = baseRPM + gearRatios[i] * diff;

    // Calculate time interval since last invocation.
    var timeMillis = Date.now();
    var deltaTimeMillis = timeMillis - lastTimeMills;
    // Accumulate total time, actually not used.
    totalTimeSec = totalTimeSec + deltaTimeMillis / 1000;

    // Calculate distance convered since last invocation.
    deltaDistanceMeter = speedKmH * deltaTimeMillis / 3600;
    // Accumulate total distance covered, actually not used.
    totalDistanceMeter = totalDistanceMeter + deltaDistanceMeter;

    // Salve metrics to be used on next invocation.
    lastSpeedKmH = speedKmH;
    lastTimeMills = timeMillis;

    // Publish metrics to the MQTT broker.
    client.publish('telemetry/speed', speedKmH.toFixed(0));
    client.publish('telemetry/rpm', String(rpm));
  }, tick);
});
