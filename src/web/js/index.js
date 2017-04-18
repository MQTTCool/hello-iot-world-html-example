/*
  MQTT.cool - http://www.lightstreamer.com
  Hello IoT World Demo

  Copyright (c) Lightstreamer Srl

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var lightStreamerClient;
var speedData, speedChart, speedOptions;
var rpmData, rpmChart, rpmOptions;
var mqttClient;

requirejs.config({
  // Set the MQTT.cool Web Client SDK as dependency to be loaded.
  deps: ['js/lib/mqtt.cool.js'],
  callback: function () {
    // Load the entry point for the Hello IoT World application, after
    // dependencies have been loaded.
    require(['app/Main']);
  }
});