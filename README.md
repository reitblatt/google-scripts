This script reminds you when someone hasn't replied to an email after a certain period of time.

To be reminded of an email, just add a label "Wait X days" or "Wait X weeks", * where X is how long you want to wait for a reply. You can also copy yourself on the email (To, CC, or BCC) like ```mark+1d@gmail.com``` and the next time ```processSentMessages``` from gmail-no-response.js runs, it will add the appropriate tag ("Wait 1 day" in this case). That's it!

### How to Install

Visit the [Google Scripts](http://script.google.com) site and create your first script. Scripts are stored in Google Drive, so you can edit them there later on.

Then, get the [Gmail - No Response script](https://github.com/reitblatt/google-scripts/blob/master/gmail-no-response.js) and paste it into your new script document.

Next, click the clock icon to create a trigger that will run this script on a schedule. ```main``` and ```processSentMessages``` should both run at least daily. I set mine up to run daily at midnight.

H/t to [Jonathan Kim](jonathan-kim.com) for the original script.
