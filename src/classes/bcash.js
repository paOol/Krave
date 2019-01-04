const genesisBlock = 563720;

class Bcash {
  calculateDiff(current) {
    let diff = current - genesisBlock + 101;
    return diff;
  }
  validateNumber(number, min = null) {
    console.log('number', number, typeof number, 'min', min);
    let test = parseInt(number);
    console.log('typeof test', typeof test);
    if (typeof test === NaN) {
      return { status: 'not a valid number' };
    }
    if (test < min) {
      return { status: `can't choose a past blockheight` };
    }
    if (test > min + 200) {
      return { status: `too far into the future` };
    }
    return true;
  }
  validateUserName(string) {
    let regex = /^[_A-z0-9][_A-z0-9]{1,99}$/;
    let symbolRegex = /[~@(`)!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/;
    console.log('symbolRegex.test(string)', symbolRegex.test(string));
    if (!regex.test(string)) {
      if (string.length > 98) {
        return { status: 'must be shorter than 99 characters' };
      }
    }
    if (symbolRegex.test(string)) {
      return { status: 'numbers and letters only.' };
    }
    return true;
  }
  validateCashAccount(string) {
    let regex = /^([a-zA-Z0-9_]+)(#([0-9]+)(\.([0-9]+))?)?/;
  }
}

let contain = new Bcash();
export default contain;
