# lilypad
Lilypad is a website that bypasses popular ad-links redirectors and protectors.

[Official Instance](https://lp.nrmn.top) | [Heroku Instance](https://bypass-with-lilypad.herokuapp.com)

## features
- Completely unlicensed, free code.
- Open JSON API for developers.
- Regularly updated, new redirects are constantly added.
- Easily self-hostable, even compatible with Heroku*.

```* - Hosting on services like Repl and Heroku means certain sites will not work because they are on IPs that are commonly used to bruteforce these services.```

## currently supported
- adshrink.it
- linkvertise (& aliases)
- t.co
- shortly.xyz
- sub2unlock.com / sub2unlock.net
- shortconnect.com
- boost.ink (& aliases)
- adfoc.us
- adf.ly (& aliases) / adult.xyz (& aliases)
- ouo.io* / ouo.press*
- ity.im
- won.pe*
- tii.ai / tei.ai
- general redirects (tested on bit.ly, tinyurl.com, goo.gl, youtu.be, ow.ly)

[Examples found here](/docs/examples/README.md)

## tba sites
- za.gl
- fc.lc*
- exey.io*

```* - Requires an AntiCaptcha subscription. [Setup information can be found here](/docs/config/README.md).```

## api reference

### bypass urls

```http
  GET /api/bypass
```

| Parameter      | Type     | Description                                                                                |
| :------------- | :------- | :----------------------------------------------------------------------------------------- |
| `url`          | `string` | **Required**. Base 64/URI encoded URL to bypass.                                           |
| `ignoreBypass` | `string` | Ignores cache of previous attempts to bypass the URL, only use if the result is incorrect. |

#### Response

**Successful response**:

```json
{
    "success": true,
    "url": "https://github.com/",
    "fromArchive": true
}
```

`success` is whether or not the process succeeded, in this instance - it's `true`.

`url` contains the URL Lilypad found.

`fromArchive` shows whether or not it was from a previously cached bypass.

**Unsuccessful response**:

```json
{
    "success": false,
    "err": {
        "stack": "HTTPError: Response code 403 (Forbidden)\n    at Request.<anonymous> (/app/node_modules/got/dist/source/as-promise/index.js:117:42)\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)"
        "message": "Response code 403 (Forbidden)"
        "code": "HTTPError"
    }
}
```

`success` is whether or not the process succeeded, in this instance - it's `false`.

`err` is an object that has `stack`, `message` and `code` strings, sometimes certain strings are missing.

## special thanks
- This was inspired by [Universal Bypass](https://universal-bypass.org/) and some code on the server was adapted from it.

- [README.so](https://readme.so/) was partially used to generate this README.

- Some code was also used from an attempt of this project a bit farther back - [here](https://github.com/normanlol/bypass-api).

- This project is also possible thanks to [AntiCaptcha](http://getcaptchasolution.com/rpsgehhafa) (uses referal link).