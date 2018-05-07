'use strict';

require('dotenv').config();
const Winston = require('winston');
const AssistantV1 = require('watson-developer-cloud/assistant/v1');
const tv4 = require('tv4');
const structuredContentSchema = ('./config/structured-content.js');
var request = require('request');

const imgurHeaders = {
	"Authorization": "Client-ID 2dd2fee31c6d14d"
}
/**
 *
 *
 * Configure the fields below 
 *
 *
 */
const watsonAssistant = new AssistantV1({
	version: '2018-02-16',
	username: process.env.WATSON_USERNAME, //reference your .env file for this value!
	password: process.env.WATSON_PASSWORD, //reference your .env file for this value!
  	url: "https://gateway.watsonplatform.net/conversation/api",
});
const config = require('./config/config.js');  //be sure to have ./config/config.js updated to your account!
const context_cues = {
	transfer: 'escalate',  //this is the context flag to transfer convo, make sure it is present in your watson workspace!
	close: 'resolve' //this is the context flag to close convo, make sure it is present in your watson workspace!
};
const intent_cues = {
	transfer: 'ccp',
	close: 'resolve'
};
/**
 *
 *
 * Configure the fields above 
 *
 *
 */


const log = new Winston.Logger({
    name: 'bot_agent_log',
    transports: [new Winston.transports.Console({
        timestamp: true,
        colorize: true,
        level: process.env.loglevel || 'info'
    })]
});

const Bot = require('./bot.js');
let agent_config = {};
try {
    agent_config = config[process.env.LP_ACCOUNT][process.env.LP_USER];
} catch (ex) {
    log.warn(`[agent.js] Error loading config: ${ex}`)
}

/**
 * The agent bot starts in the default state ('ONLINE') and subscribes only to its own conversations
 *
 * Bot configuration is set via a config file (see config/example_config.js)
 * and environment variables LP_ACCOUNT and LP_USER
 *
 * transferSkill should be set to the ID of the skill you want the bot to transfer to
 *
 * @type {Bot}
 */

const agent = new Bot(agent_config);
const transferSkill = '-1'; //TODO - enter your transfer ID

const isJSON = (text) => {
	try{
		JSON.parse(text);
	}catch(e){
		return false;
	}
	return true;
};

agent.on(Bot.const.CONNECTED, data => {
    log.info(`[agent.js] CONNECTED ${JSON.stringify(data)}`);
});

agent.on(Bot.const.ROUTING_NOTIFICATION, data => {
    log.info(`[agent.js] ROUTING_NOTIFICATION ${JSON.stringify(data)}`);

    // Accept all waiting conversations
    agent.acceptWaitingConversations(data);
});

agent.on(Bot.const.CONVERSATION_NOTIFICATION, event => {
    log.info(`[agent.js] CONVERSATION_NOTIFICATION ${JSON.stringify(event)}`);
});

agent.on(Bot.const.AGENT_STATE_NOTIFICATION, event => {
    log.info(`[agent.js] AGENT_STATE_NOTIFICATION ${JSON.stringify(event)}`);
});

agent.on(Bot.const.CONTENT_NOTIFICATION, event => {
    log.info(`[agent.js] CONTENT_NOTIFICATION ${JSON.stringify(event)}`);

    // Respond to messages from the CONSUMER
    if (event.originatorMetadata.role === 'CONSUMER'
        && agent.getRole(agent.myConversations[event.dialogId].conversationDetails) === 'ASSIGNED_AGENT') {


    	//send message to watson assistant to handle responses
    	watsonAssistant.message({
    		workspace_id: config.watson.workspace_id,
    		input: {
    			text: event.message
    		},
			context: agent.myConversations[event.dialogId].watsonContext || {} 
    	}, function(err, response){
    		if(err){
    			log.warn(`[agent.js] ERROR WATSON_ASSISTANT: ${err}`);
    		}else{
    			agent.myConversations[event.dialogId].watsonContext = response.context;
    			log.info(`[agent.js] WATSON_ASSISTANT: ${JSON.stringify(response)}`);
    			if(!agent.myConversations[event.dialogId].watsonContext.consumerProfile){
    				agent.getConsumerProfile(event.dialogId, agent.myConversations[event.dialogId].conversationDetails, (consumerProfile) => {
    					let consumerProfileWatsonFormatted = {};

    					//format consumer profile to be easier read by watson
    					consumerProfile.forEach((sdeObject) => {
    						consumerProfileWatsonFormatted[sdeObject.type] = {
    							... consumerProfileWatsonFormatted[sdeObject.type],
    							... sdeObject.info
    						};
    					});

    					//add new consumer profile to the watson context for use in the workspace
    					agent.myConversations[event.dialogId].watsonContext['consumerProfile'] = consumerProfileWatsonFormatted;
    				});
    			}

                //if response.context.queryAPI
                //then make outbound call
                //update response.output.text with API response
				const currDialogId = event.dialogId;
				var allImagesProcessed = [];
				if(response.input.text.indexOf("Bag Tag")>-1){
					agent.sendText(currDialogId, "Please wait. We are now matching your selected bag to lost bags...");
					var reqParams = {method: 'post', json: true, body: {recordLocator: "TANBOJ", bagTag:"101010010101" , lastName: "Jahsti"}, url: "http://baggagefinder-noncogent-asshead.mybluemix.net/lost"}
					request(reqParams, (err, res, body) => { //Call bagLost API which returns bags tied to current passengers PNR
						if (err) { return console.log(err); }
						if(res.complete && res.statusCode===200)
						{
							var bagMatchResponse = body;
							for(var i=0; i<bagMatchResponse.elements.length; i++){
								if(bagMatchResponse.elements[i].type==="horizontal"){
										bagMatchResponse.elements[i].elements.splice(2,bagMatchResponse.elements[i].elements.length-2);	//For now, user will be shown max 2 bag images
										var bagMatchResponseLength = bagMatchResponse.elements[i].elements.length;
										for(var j=0; j<bagMatchResponse.elements[i].elements.length; j++){
											var currElem = bagMatchResponse.elements[i].elements[j];
												var reqImageBase64 = bagMatchResponse.elements[i].elements[j].img;
												var reqOptions = {
													method: 'post',
													body: reqImageBase64.substring(reqImageBase64.indexOf("/9j"), reqImageBase64.length),
													json: true,
													url: 'https://api.imgur.com/3/image',
													headers: imgurHeaders
												}
												request(reqOptions, (error, response, body) => {
													if(!error && response.statusCode===200){
														var imageUrl = body.data.link; //imgur URL for image to display to user
														allImagesProcessed.push(imageUrl);	
													}
										})
									}
								}
							}
							var refreshIntervalId = setInterval(function(){
								if(allImagesProcessed.length===bagMatchResponseLength){
									if(bagMatchResponse.elements[2].elements[0].img){ delete bagMatchResponse.elements[2].elements[0].img;  bagMatchResponse.elements[2].elements[0].url= allImagesProcessed[0];}
									if(bagMatchResponse.elements[2].elements.length>1 && bagMatchResponse.elements[2].elements[1].img) { delete bagMatchResponse.elements[2].elements[1].img;  bagMatchResponse.elements[2].elements[1].url= allImagesProcessed[1];}
									bagMatchResponse.elements[2].elements[1].click.actions[0].text = "second bag";
									agent.sendRichContent(currDialogId, {
										id: Math.floor(Math.random() * 100000).toString(),
										content: bagMatchResponse	
									})
									clearInterval(refreshIntervalId);
								}
							}, 1000);
						}
					});

				}
				else if(response.output.text){
        			//send list of responses
        			response.output.text.forEach(outputText => {
        				if(isJSON(outputText) && tv4.validate(JSON.parse(outputText), structuredContentSchema)){
        					//send structured content
        					agent.sendRichContent(event.dialogId, {
        						id: Math.floor(Math.random() * 100000).toString(),
        						content: JSON.parse(outputText)
        					})
        				}else{
        					//send text
        					agent.sendText(event.dialogId, outputText);
        				}

        			});
        		} 

        		//transfer or close based on context
        		Object.keys(context_cues).forEach(contextEvent => {
        			if(response.context[ context_cues[contextEvent] ]){
        				switch(contextEvent){
        					case 'transfer':
        						!response.output.text && agent.sendText(event.dialogId, 'Transferring you to a new agent, one moment');
        						agent.transferConversation(event.dialogId, transferSkill);
        						break;
        					case 'close':
        						agent.closeConversation(event.dialogId);
        						break;
        				}
        			}
        		});

        		//transfer or close based on intent
        		if(response.intents){
        			response.intents.forEach(intent => {
        				if(intent.intent === intent_cues.transfer){
    						!response.output.text && agent.sendText(event.dialogId, 'Transferring you to a new agent, one moment');
    						agent.transferConversation(event.dialogId, transferSkill);
        				}
        			});
        		}
    		}
    	});
    }
});

agent.on(Bot.const.SOCKET_CLOSED, event => {
    log.info(`[agent.js] SOCKET_CLOSED ${JSON.stringify(event)}`);
});

agent.on(Bot.const.ERROR, error => {
    log.error(`[agent.js] ERROR ${JSON.stringify(error)}`);
});
