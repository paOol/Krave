import React from 'react';
import EmojiList from './emoji_names.json';
import crypto from 'crypto';

class Emoji extends React.Component {
  calculateEmoji(each) {
    let { registrationtxid, blockhash } = each;
    if (blockhash === null) {
      return;
    }
    if (registrationtxid.startsWith('{')) {
      return;
    }

    blockhash = Buffer.from(blockhash, 'hex');
    registrationtxid = Buffer.from(registrationtxid, 'hex');

    let concat = Buffer.concat([blockhash, registrationtxid]);
    const hash = crypto
      .createHash('sha256')
      .update(concat)
      .digest('hex');
    let last = hash.slice(-8);

    let decimalNotation = parseInt(last, 16);
    let modulus = decimalNotation % 100;
    return EmojiList[modulus];
  }

  render() {
    const { account } = this.props;
    let emoji = this.calculateEmoji(account);
    return (
      <span className="emoji" role="img" aria-label={emoji ? emoji : ''}>
        {emoji}
      </span>
    );
  }
}
export default Emoji;
