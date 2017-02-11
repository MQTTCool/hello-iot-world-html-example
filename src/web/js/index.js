var lightStreamerClient;
var speedData, speedChart, speedOptions;
var rpmData, rpmChart, rpmOptions;
var mqttClient;
require(["MQTTExtender"], function (MQTTExtender) {

  // Load package for gauges.
  google.charts.load('current', { 'packages': ['gauge'] });

  // Set the onload callback, which initializes gauges and starts the
  // connection to the MQTT extender.
  google.charts.setOnLoadCallback(function () {
    // Initalize bandwidth sliders.
    initBandwidthSlider();

    // Initialize frequency sliders for Speed and RPM.
    initFreqSlider("Speed", "telemetry/speed");
    initFreqSlider("RPM", "telemetry/rpm");

    // Speed gauge initialization.
    speedData = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['Speed', 0],
    ]);
    speedOptions = {
      redFrom: 210, redTo: 250,
      yellowFrom: 230, yellowTo: 300,
      minorTicks: 10,
      max: 300
    };
    speedChart = new google.visualization.Gauge(document.getElementById('speedGauge'));
    speedData.setValue(0, 1, 0);
    speedChart.draw(speedData, speedOptions);

    // RPM gauge initialization.
    rpmData = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['RPM', 2000]
    ]);
    rpmOptions = {
      //width: 200, height: 180,
      redFrom: 23000, redTo: 25000,
      yellowFrom: 18000, yellowTo: 23000,
      minorTicks: 10,
      max: 25000
    };
    rpmChart = new google.visualization.Gauge(document.getElementById('rpmGauge'));
    rpmData.setValue(0, 1, 0);
    rpmChart.draw(rpmData, rpmOptions);

    // Connect to the MQTT Extender.
    startMqttConnection(MQTTExtender);
  });
});

/**
 * Initialize the Bandwidth slider.
 */
function initBandwidthSlider() {
  // Max allowed bandwidth, in Kbps/s.
  var maxBandVal = 5.5;

  // Init bandwidth values.
  var values = [];
  for (var x = 0.5; x <= maxBandVal; x += 0.5) {
    values.push(x);
  }

  // The span id to be updated
  var spanId = "nowBandwidth";

  var bwslider = new Control.Slider('handleSelectBandwidth', 'selectBandwidth', {
    sliderValue: maxBandVal, values: values, step: 0.5, increment: 0.5, range: $R(0.5, maxBandVal),

    onSlide: function (v) {
      updateSlider(v, maxBandVal, spanId);
    },

    onChange: function (v) {
      var val = updateSlider(v, maxBandVal, spanId);
      if (lightStreamerClient) {
        // If max bandwidth is selected, pass the "unlimited" value.
        if (val == maxBandVal) {
          val = "unlimited";
        }
        // Update the max bandwidth through the LightStreamerClient instance.
        lightStreamerClient.connectionOptions.setMaxBandwidth(val);
      }
    }
  });
};

/**
 * Initialize a Frequency slider
 * 
 * @param {string} which - The name of the slider to initialize.
 * @param {string} topic - The topic to re-susbcribe to upon changing.
 */
function initFreqSlider(which, topic) {
  // Max allowed frequency.
  var maxFreqVal = 2.1;

  // Init frequency values.
  var freqValues = [];
  for (var x = 0.1; x <= maxFreqVal + 0.1; x += 0.1) {
    freqValues.push(x);
  }

  // The span id to be updated.
  var spanId = "now" + which + "Frequency";

  var freqSlider = new Control.Slider('handleSelect' + which + 'Frequency', 'select' + which + 'Frequency', {
    sliderValue: maxFreqVal, values: freqValues, step: 0.1, increment: 0.1, range: $R(0.1, maxFreqVal),

    onSlide: function (v) {
      updateSlider(v, maxFreqVal, spanId);
    },

    onChange: function (v) {
      var val = updateSlider(v, maxFreqVal, spanId);
      if (lightStreamerClient) {
        // Prepare basic subscriptions options.
        var subOptions = {};
        // Set the property to specify the max frequency rate.
        if (val != maxFreqVal) {
          subOptions['requestedMaxFrequency'] = val;
        }
        // Subscribe again to the same topic, with updated options.
        mqttClient.subscribe(topic, subOptions);
      }
    }
  });
}

/**
 * Connects to the MQT Extender and manages subscriptions to telemetry topics.
 */
function startMqttConnection(MQTTExtender) {
  // Connect to the MQTT Extender.
  MQTTExtender.connect('http://localhost:8080', {

    onLsClient: function (lsClient) {
      // Save the reference to the LightStreamerClient instance provided by
      // the library upon successful connection to the MQTT Extender, in order
      // to be used later for updating the max bandwidth.
      lightStreamerClient = lsClient;
    },

    onConnectionFailure: function (errorCode, errorMessage) {
      console.log(errorMessage);
    },

    onConnectionSuccess: function (mqttExtenderSession) {
      // Get a client instance, which will connect to the MQTT broker mapped by
      // the alias "mosquitto". The instance will also be used later to 
      // re-subscribe for updating the frequency update.
      mqttClient = mqttExtenderSession.createClient('mosquitto');

      // Connect to the MQTT broker.
      mqttClient.connect({
        onSuccess: function () {
          // Upon successful connection, subscribe to telemetry topics.
          mqttClient.subscribe('telemetry/speed');
          mqttClient.subscribe('telemetry/rpm');
        },

        onFailure: function (response) {
          console.log("Connection failure: " + response);
        }
      });

      // Callback invoked if the connection to the target MQTT broker is lost.
      mqttClient.onConnectionLost = function (response) {
        console.log("Connection lost:" + response.errorMessage);
      }

      // Callback invoked upon receiving a message.
      mqttClient.onMessageArrived = function (message) {
        // Get the message topic to retrieve the pertinent gauge.
        var dest = message.destinationName;
        var tok = dest.split('/', 2);
        var gauge = tok[1];

        // Transfomr metric to int values, as required by the Google Chart Tools.
        var metric = parseInt(parseInt(message.payloadString));
        // Update the target gauge.
        switch (gauge) {
          case 'rpm':
            rpmData.setValue(0, 1, metric);
            rpmChart.draw(rpmData, rpmOptions);
            break;

          case 'speed':
            speedData.setValue(0, 1, metric);
            speedChart.draw(speedData, speedOptions);
            break;

          default:
            break;
        }
      };
    }
  });
}

/**
 * Updates the specified span with current slider value.
 * 
 * @param {number} currValue - The current slider value.
 * @param {number} maxValue - The max allowed value.
 * @param {number} id - The id of span to be updated.
 * @return {number} the rounde slider value
 */
function updateSlider(currValue, maxValue, id) {
  var val = Math.round(currValue * 100) / 100;
  var valStr = String(val);
  if (val == maxValue) {
    valStr = "unlimited";
  }
  document.getElementById(id).innerHTML = valStr;
  return val;
}