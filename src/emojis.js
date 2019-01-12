import React from 'react';
import EmojiList from './emoji_names.json';
import crypto from 'crypto';

let valid = [
  'ghost',
  'monkey',
  'dog',
  'cat',
  'horse',
  'cow',
  'pig',
  'goat',
  'camel',
  'elephant',
  'rat',
  'rabbit',
  'chipmunk',
  'bat',
  'rooster',
  'penguin',
  'duck',
  'owl',
  'turtle',
  'snake',
  'fish',
  'octopus',
  'snail',
  'butterfly',
  'honeybee',
  'lady beetle',
  'spider',
  'sunflower',
  'evergreen tree',
  'palm tree',
  'cactus',
  'maple leaf',
  'four leaf clover',
  'grapes',
  'watermelon',
  'lemon',
  'banana',
  'red apple',
  'cherries',
  'strawberry',
  'kiwi fruit',
  'coconut',
  'carrot',
  'ear of corn',
  'hot pepper',
  'mushroom',
  'cheese wedge',
  'egg',
  'crab',
  'cookie',
  'birthday cake',
  'lollipop',
  'house',
  'automobile',
  'bicycle',
  'sailboat',
  'airplane',
  'helicopter',
  'rocket',
  'watch',
  'sun',
  'star',
  'rainbow',
  'umbrella',
  'balloon',
  'ribbon',
  'soccer ball',
  'spade suit',
  'heart suit',
  'diamond suit',
  'club suit',
  'glasses',
  'crown',
  'top hat',
  'bell',
  'musical note',
  'microphone',
  'headphone',
  'guitar',
  'trumpet',
  'drum',
  'magnifying glass tilted left',
  'candle',
  'light bulb',
  'open book',
  'envelope',
  'package',
  'pencil',
  'briefcase',
  'clipboard',
  'scissors',
  'key',
  'locked',
  'hammer',
  'wrench',
  'balance scale',
  'yin yang',
  'triangular flag',
  'footprints',
  'bread'
];
class Emoji extends React.Component {
  create() {
    let build = [];
    let all = Object.entries(EmojiList);
    for (const each of valid) {
      for (const check of all) {
        if (each == check[1]) {
          build.push(check[0]);
        }
      }
    }
    console.log('done', build);
  }
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

  arrayFromHex = hexString =>
    new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  arrayToHex = intArray =>
    intArray.reduce(
      (str, byte) => str + byte.toString(16).padStart(2, '0'),
      ''
    );
  componentDidMount() {}

  render() {
    const { account } = this.props;
    let emoji = this.calculateEmoji(account);
    console.log('emoji', emoji);
    return (
      <span className="emoji" role="img" aria-label={emoji ? emoji : ''}>
        {emoji}
      </span>
    );
  }
}
export default Emoji;
