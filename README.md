# [Krave](https://krave.xyz/)

A React app for scheduled Cash Account registrations.

## Overview

![image](https://user-images.githubusercontent.com/5941389/50789351-d4f56580-1270-11e9-82f8-e535c1dcb63e.png)

Cash Accounts are basically aliases for BCH addresses and the numbers increment
infinitely based on each block that gets mined on the Bitcoin Cash network.
Krave follows the
[spec](https://gitlab.com/cash-accounts/specification/blob/master/SPECIFICATION.md)
to create cash accounts.

### How it works

Each registration is saved into the database along with the specified
blockheight at which to broadcast/register the cash account. A check is made to
ensure there is fewer than 25 queued jobs for each block height. This is due to
a current unconfirmed chain limit in the Bitcoin protocol. More than 25
unconfirmed transactions in the mempool results in unreliable confirmations and
may result in failing to confirm for the specified blockheight and missing the
registration.

A unique identifier is created and a deposit address is generated for each
visitor. Once the QR code and deposit address is generated, a socket listener
starts listening to all transactions and waits until there is a transaction
detected for the newly generated receiving address. Once there is a match, we
check the value of the unspent outputs to ensure the proper amount was sent.

If the value is correct, a callback will insert the job into the database to be
registered at a later block height. A button to pay with the
[BadgerWallet](https://badgerwallet.cash/) is also included for convenience. If
the user has Badger installed with funds, the transaction can be completed in
seconds with just 2 clicks.

A scheduler runs every minute to check for queued jobs. There cannot be
duplicate registration transaction IDs so a malicious user cannot spoof/insert
invalid jobs into the database. A valid job to be processed requires a valid
txid (to confirm it was paid for), and is marked complete once the registration
transaction is broadcasted. That registration txid is saved to the database as
well.

### Project Organization

`src` is where most of the logic lies

`src/routes` where all the express/api routes is handled

`src/classes` classes/services, and bulk of logic.

`public` for all assets that are not sensitive. logos, images, etc.

### Quick Start

```
cd to Krave directory
npm run start
```

browse to http://localhost:4545

### testing

```
npm run test
```

#### Tested on Node v8.9.3

you can read more about [Cash Accounts](https://www.cashaccount.info) here.
