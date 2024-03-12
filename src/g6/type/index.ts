// import './layout';
import { registerNode } from './node';
// import './edge';
import { registerBehavior } from './behavior';
import { registerEdge } from './edge';

export function init() {
  registerNode();
  registerBehavior();
  registerEdge();
}