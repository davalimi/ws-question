const qs = require('querystring');
var sharedmem = null ;


exports.open = (event, context, callback) => {

    sharedmem = context.sharedmem;
    curApp = event.app;
    var params = qs.parse(event.query);

    // Add +1 for new connectedUser
    sharedmem.incInteger("connectedUsers", 1, params.channel);

    var envToken = null;
    if ( process.env.token != null && process.env.token != "" ){
        envToken = process.env.token;
    }

    if ( context.apiEndpoint.token == "XXXXXXXXXXXXXXXXXXXXXXXXXX" && envToken == null ){
        event.ws.send("token have not been configured in appconfig.json! Fix this first!\nAccess not authorized");
        return;
    }
    if (params.channel && params.token != null){         

        event.ws.subscribe(params.channel);
        event.ws.token = params.token;
        event.ws.channel = params.channel;
        curChannel = params.channel;        
        event.ws.subscribe(curChannel);

        newEvent = {
            "type": "message",
            // "message": "Write your text here",
            "firstConnection" : "true",
            "nbConnected": sharedmem.getInteger("connectedUsers", params.channel)
        }

        try{
            event.app.publish(curChannel, JSON.stringify(newEvent));
        } catch(ex){}
    }

    //Say hello or send a message to the client, increment number of connected users, ...
};

exports.message = (event, context, callback) => {
    //Do something with the message received from the client (echo, broadcast it, subscribe to a channel, execute some code ...)
    sharedmem = context.sharedmem;
    curApp = event.app;

    var envToken = null;
    if ( process.env.token != null && process.env.token != "" ){
        envToken = process.env.token;
    }

    //When we receive a message from the builder thread, we publish it to all subscribers
    if ( event.body != null && event.body != "" && event.body != "[HEARTBEAT]"){
        //AddToChannelCache(event.ws.channel, event.body);
        // event.app.publish(event.ws.channel, event.body);
    }

    //when we receive a client command
    if ( event.body != null && event.body != "" && event.body.indexOf("EXEC_CMD") > -1){

        var obj = JSON.parse(event.body);
        var cmd = obj.EXEC_CMD;

        if ( cmd == "/message" ) {
            if ( event.body != null && event.body != ""){
                SendMessageToFront(event);
                // event.app.publish(curChannel, message);
            }
            //return the body received (echo)
            // callback(null, null);
        } else if ( cmd == "/choice") {
                recordNewVote(event);
        }
    }
};

exports.close = (event, context, callback) => {
    // Do something like decrement number of users, close session,  ...
    sharedmem = context.sharedmem;
    curApp = event.app;

    var params = qs.parse(event.query);

    sharedmem.incInteger("connectedUsers", -1, params.channel);
};




async function recordNewVote(event) {

    var allVotesAnswers = {}

    var body = JSON.parse(event.body)
    var param = body.param;
    param = decodeURIComponent(param);
    param = JSON.parse(param);

    var questionID = param.questionID;
    var userID = param.userID;
    var choiceSelected = param.choiceSelected;

    sharedmem.setString(userID, choiceSelected, questionID)

    var allVote = sharedmem.getStringKeys(questionID);

    for (let i = 0; i < allVote.length; i++) {
        var key = allVote[i];
        var curVote = sharedmem.getString(key, questionID);
        allVotesAnswers[curVote] = (allVotesAnswers[curVote] || 0) + 1;
    }
    sendAllVote(allVotesAnswers,event)
}

async function sendAllVote(allVotesAnswers, event) {
    var body = JSON.parse(event.body);
    var params = qs.parse(event.query);

    var newEvent = {
        "type": "choice",
        "nbConnected": sharedmem.getInteger("connectedUsers", params.channel)

    }
    newEvent.allVotesAnswers = allVotesAnswers

    try{
        event.app.publish(curChannel, JSON.stringify(newEvent));
    } catch(ex){}
}

async function SendMessageToFront(event){
    var body = JSON.parse(event.body);
    var params = qs.parse(event.query);


    var newEvent = { 
        "type": "message",
        "nbConnected": sharedmem.getInteger("connectedUsers", params.channel)
    };
    newEvent.message = body.param;
    newEvent.userID = body.userID;

    try{
        event.app.publish(curChannel, JSON.stringify(newEvent));
    } catch(ex){}
}
