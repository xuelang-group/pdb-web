import * as typeG6 from './type';
import * as objcectG6 from './object';

export function initG6(type: string) {
  if (type === 'object') {
    objcectG6.init();
  } else {
    typeG6.init();
  }
}
