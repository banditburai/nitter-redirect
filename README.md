# ![nitter-redirect](images/icon32.png) Nitter Redirect

A privacy-focused browser extension that redirects Twitter/X requests to [Nitter](https://github.com/zedeus/nitter), the privacy-friendly Twitter frontend.

## Features

- 🔒 **Enhanced Security** - Strict URL validation prevents open redirect attacks
- 🆕 **X.com Support** - Redirects for both the Twitter and X.com domains
- ✅ **Verified Instances** - Only uses verified, working Nitter instances
- 🛡️ **Minimal Permissions** - Only requests necessary permissions for Twitter/X domains
- 🚫 **No Tracking** - Removes Twitter/X service workers to prevent tracking
- ⚡ **Lightweight** - Event-based background script for better performance

## Supported URLs

Redirects requests from:
- `twitter.com`, `www.twitter.com`, `mobile.twitter.com`
- `x.com`, `www.x.com`, `mobile.x.com`
- `pbs.twimg.com` (images)
- `video.twimg.com` (videos)

## Security Improvements (v1.2.0)

This fork includes significant security enhancements:
- **Content Security Policy** enforced
- **URL validation** to prevent malicious redirects
- **Sanitized inputs** to prevent XSS attacks
- **No console logging** of sensitive URLs
- **Verified instance list** from official Nitter wiki

## Verified Nitter Instances

The extension uses only verified instances from the [official Nitter wiki](https://github.com/zedeus/nitter/wiki/Instances).

## Build

1.  `npm install --global web-ext`
2.  `web-ext build`
3.  See `web-ext-artifacts/` for outputs.

## Development

```bash
# Run in development mode
web-ext run

# Build for production
web-ext build
```

## Credits

This is a security-enhanced fork of [nitter-redirect](https://github.com/SimonBrazell/nitter-redirect) by Simon Brazell.

## License

Code released under [the MIT license](LICENSE). Original work Copyright (c) 2019 Simon Brazell.
