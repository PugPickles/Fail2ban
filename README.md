# Fail2ban
json based fail2ban integration for nodejs

https://www.npmjs.com/package/fail2ban_json


#### Functions
```js
const f2b = require("fail2ban_json");

f2b.config({
    "bantime": {
        "mode": "m",    // s = seconds | m = minutes | h = hours | d = days
        "count": 10     // number of seconds/minutes etc.
    },
    "maxTry": 3,        // max attempts until locked
    "log": true,        // logging
    "path": "./"        // set path for the blocklist (and log if necessary)
})

f2b.check("1.2.3.4", cb => {
    console.log(cb);
});

f2b.ban("1.2.3.4", cb => {
    console.log(cb);
});

f2b.delete("1.2.3.4", cb => {
    console.log(cb);
});
```

#### Return value

Check:
```js
// IP not listed
{
  baned: false
}

// IP listed but not locked
{
  baned: false,
  try: 1
}

// IP locked ("bantime" is the time when requests are allowed again)
{
  baned: true,
  try: 3,
  bantime: 1671273781571
}
```

Ban:
```js
// IP is not locked yet
{
  baned: false,
  try: 1
}

// IP is locked ("bantime" is the time when requests are allowed again)
{
  baned: true,
  try: 3,
  bantime: 1671273781571
}
```

Delete:
```js
// IP is not listed
false

// IP was deleted from list
true
```
