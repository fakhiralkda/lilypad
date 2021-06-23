# config setup
Here's how to setup a config with Lilypad.

## selfhosted (non-heroku)

All you must do to make a configuration in Lilypad is copy ``config.example.json`` to a file called ``config.json``.

After doing this, change your file to something like this if you're planning on adding Anti-Captcha.

If you do use AntiCaptcha, it's good to keep ``"archiveLinks"`` to true unless you are limited on storage.

```json
{
    "key": "[anticaptcha key here]",
    "antiCaptcha": true,
    "archiveLinks": true
}
```

Restart Lilypad if it is running and you're good to go!

## heroku instances
Go to the Lilypad instance's settings and click on "Reveal Config Vars".

![The page with a mouse hovering over the button](https://i.imgur.com/NMNsFHD.png)

Then, enter in the KEY field "ACKEY" exactly how it's displayed here (if you plan on using AntiCaptcha), and in the VALUE field, enter your AntiCaptcha key and click "Add".

If you do not want bypassed links saved, add a variable called "NOARCHIVE" and set the value to "true".

![Example of how it should look](https://i.imgur.com/aPgbQsZ.png)

After doing this, redeploy the instance and verify that it is up to date.