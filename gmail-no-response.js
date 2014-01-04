/*
 * This script goes through your Gmail Inbox and finds recent emails where you
 * were the last respondent. 
 *
 * To be reminded of an email, just add a label "Wait X days" or "Wait X weeks", * where X is how long you want to wait for a reply.
 *
 * This is most effective when paired with a time-based script trigger.
 *
 * For installation instructions, read this blog post:
 * http://jonathan-kim.com/2013/Gmail-No-Response/
 * Author: Mark Reitblatt
 * Based (strongly) on original script by Jonathan Kim (jonathan-kim.com)
 */


"use strict";

var unrespondedLabel = 'No Response';
var dayRegex = new RegExp("Wait [0-9]+ day[s]?", "i");
var weekRegex = new RegExp("Wait [0-9]+ week[s]?", "i");
var waitRegex = new RegExp("Wait [0-9]+ (week|day)[s]?", "i");
var waitingTopLabel = 'Waiting';
var waitingLabelProto = waitingTopLabel + '/Wait X Ys';


function setup() {
    getLabel(waitingTopLabel);
    getLabel(unrespondedLabel);
}

/* 
 * Assumes script is run at least every 2 days, to reduce the number of
 * sent messages to wade through
 */
function processSentMessages() {
    var threads = GmailApp.search('is:sent from:me -in:chats newer_than:2d -in:' + waitingTopLabel);

    for (var i = 0; i < threads.length; i++) {
        var thread = threads[i],
            messages = thread.getMessages(),
            lastMessage = messages[messages.length - 1],
            lastFrom = lastMessage.getFrom(),
            waitingMatch = isToWaiting(lastMessage);

        if (isFromMe(lastFrom) && waitingMatch) {
            Logger.log("Found unlabeled waiting msg");
            var waitingLabels = getWaitingLabels(waitingMatch);
            for (var j = 0; j < waitingLabels.length; j++) {
                waitingLabels[j].addToThread(thread);
            }
        }
    }
}

/* 
 * Takes a string array returned from isToWaiting(): first item is
 * full address, second item is number, third is the unit of time 
 */

function getWaitingLabels(addressArr) {
    var num = addressArr[1],
        unit = addressArr[2],
        labelName = waitingLabelProto.replace("X", num).replace("Y", unit);

    return [getLabel(labelName), getLabel(waitingTopLabel)];
}

function updateOldThreads(days, label) {
    var threads = GmailApp.search('is:sent from:me -in:chats older_than:' + days + 'd' + ' in:' + label.getName()),
        numUpdated = 0,
        minDaysAgo = new Date();

    minDaysAgo.setDate(minDaysAgo.getDate() - days);

    // Filter threads where I was the last respondent.
    for (var i = 0; i < threads.length; i++) {
        var thread = threads[i],
            messages = thread.getMessages(),
            lastMessage = messages[messages.length - 1],
            lastFrom = lastMessage.getFrom(),
            lastMessageIsOld = lastMessage.getDate().getTime() < minDaysAgo.getTime();

        if (isFromMe(lastFrom) && lastMessageIsOld) {
            markUnresponded(thread);
            numUpdated++;
        }
    }

    Logger.log('Updated ' + numUpdated + ' messages ' + days + ' days old.');
}

function processUnresponded() {
    var labels = GmailApp.getUserLabels(),
        dayLabels = new Array(),
        weekLabels = new Array();

    for (var i = 0; i < labels.length; i++) {
        if (labels[i].getName().match(dayRegex)) {
            dayLabels.push(labels[i]);
        }
        else if(labels[i].getName().match(weekRegex)) {
            weekLabels.push(labels[i]);
        }
    }

    for (var i = 0; i < dayLabels.length; i++) {
        var label = dayLabels[i],
            labelName = label.getName(),
            idx = labelName.search(/[0-9]+/);
        if(idx > -1) {
            var days = parseInt(labelName.substr(idx));
            updateOldThreads(days, label);
        }
    }

    for (var i = 0; i < weekLabels.length; i++) {
        var label = weekLabels[i],
            labelName = label.getName(),
            idx = labelName.search(/[0-9]+/);
        if(idx > -1) {
            var days = 7 * parseInt(labelName.substr(idx));
            updateOldThreads(days, label);
        }
    }
}

function isToWaiting(msg) {
    var toAddresses = (msg.getTo() + "," + msg.getCc() + "," + msg.getBcc()).split(","),
        addresses = getEmailAddresses(),
        match = undefined;
    
    for (var i = 0; i < addresses.length; i++) {
        var address = addresses[i].split("@");
        Logger.log("Processing address " + address[0] + " " + address[1]);
        addresses[i] = new RegExp(address[0] + 
                                  "\\+([0-9]+)(d|w|wk|day|week)[s]?" + "@" +
                                  address[1],"i");
    }
    for (var j = 0; j < toAddresses.length; j++) {
        Logger.log("Checking address " + toAddresses[j] + " for waiting tag");
        for( var k = 0; k < addresses.length; k++) {
          Logger.log("Comparing against regex " + addresses[k].toString());
            match = addresses[k].exec(toAddresses[j]);
            if (match) { 
                Logger.log("Found match on waiting email " + match[0]);
                return match; }
        }
    }
    Logger.log("Did not find waiting email address");
    return false;
}

function isFromMe(fromAddress) {
    var addresses = getEmailAddresses();
    for (i = 0; i < addresses.length; i++) {
        var address = addresses[i],
            r = RegExp(address, 'i');

        if (r.test(fromAddress)) {
            return true;
        }
    }

    return false;
}

function getEmailAddresses() {
    var me = Session.getActiveUser().getEmail(),
        emails = GmailApp.getAliases();

    emails.push(me);
    return emails;
}

function threadHasLabel(thread, labelName) {
    var labels = thread.getLabels();

    for (i = 0; i < labels.length; i++) {
        var label = labels[i];

        if (label.getName() == labelName) {
            return true;
        }
    }

    return false;
}

function markUnresponded(thread) {
    var label = getLabel(unrespondedLabel);
    label.addToThread(thread);
}

function getLabel(labelName) {
    var label = GmailApp.getUserLabelByName(labelName);

    if (label) {
        Logger.log('Label exists.');
    } else {
        Logger.log('Label does not exist. Creating it.');
        label = GmailApp.createLabel(labelName);
    }

    return label;
}

function main() {
    processUnresponded();
}
