/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.deviceready = false;
        this.mediaVar = null;
        this.recordFileName = "recording.wav";
        this.status = null;
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
        
        this.setupButtons();
    },

    setupButtons: function() {
        $("#stopBtn").hide();
        $("#playBtn").hide();

        //validation to check if device is ready is skipped

        $("#recordBtn").on('click touchstart touchend', function(){
            app.record();                  
        });

        $("#playBtn").on('click touchstart touchend',function(){
            app.play();
        });

        $("#stopBtn").on('click touchstart touchend',function(){
            app.stop();
        });
    },

    record: function() {
        this.createMedia(function(){
            app.status = "recording";
            app.mediaVar.startRecord();
            $("#recordBtn").hide();
            $("#stopBtn").show();
            $("#playBtn").hide();
        }, app.onStatusChange);
    },

    createMedia: function(onMediaCreated, mediaStatusCallback) {
        if ( this.mediaVar != null) {
            this.onMediaCreated();
            return;
        }

        if (typeof mediaStatusCallback == 'undefined') 
            mediaStatusCallback = null;

        //first create the file
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            fileSystem.root.getFile(recordFileName, {
                create: true,
                exclusive: false
            }, function(fileEntry){
                app.log("File " + recordFileName + " created at " + fileEntry.fullPath);
                app.mediaVar = new Media(fileEntry.fullPath, function(){
                    app.log("Media created successfully");
                }, app.onError, mediaStatusCallback); //of new Media
                onMediaCreated();
            }, app.onError); //of getFile
        }, this.onError); //of requestFileSystem

        // if it's Android -->
        // mediaVar = new Media(recordFileName, function(){
        //     log("Media created successfully");
        // }, onError, mediaStatusCallback); 
        // onMediaCreated();
    },

    stop: function() {
        if (this.mediaVar == null)
            return;

        if (this.status == 'recording')
        {
            this.mediaVar.stopRecord();
            this.log("Recording stopped");
        }
        else if (this.status == 'playing')
        {
            this.mediaVar.stop();            
            this.log("Play stopped");
        } 
        else
        {
            this.log("Nothing stopped");
        }
        $("#recordBtn").show();
        $("#stopBtn").hide();
        $("#playBtn").show();
        this.status = 'stopped';
    },

    play: function() {
        this.createMedia(function(){
            app.status = "playing";
            app.mediaVar.play();    
            $("#recordBtn").hide();
            $("#stopBtn").show();
            $("#playBtn").hide();
        });
    },
    
    onStatusChange: function() {
        if (arguments[0] == 4) //play stopped
        {
            $("#recordBtn").show();
            $("#stopBtn").hide();
            $("#playBtn").show();
        } 
    },

    onSuccess: function() {
        //do nothing
    },

    onError: function(err) {
        if (typeof err.message != 'undefined')
            err = err.message;
        alert("Error : " + err);
    },

    log: function(message) {
        console.log(message);
    }
};

app.initialize();