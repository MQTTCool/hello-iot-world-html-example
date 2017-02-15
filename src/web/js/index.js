var lightStreamerClient;
var speedData, speedChart, speedOptions;
var rpmData, rpmChart, rpmOptions;
var mqttClient;

requirejs.config({
  // Set the MQTT Extender Web Client SDK as dependency to be laoded.
  deps: ['js/lib/lightstreamer-mqtt.js'],
  callback: function () {
    // Load the entry point for the Hello IoT World application, after 
    // dependences have been loaded.
    require(['app/Main']);
  }
});