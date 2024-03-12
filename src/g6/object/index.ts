import { registerLayout } from './layout';
import { registerNode } from './node';
import { registerEdge } from './edge';
import { registerBehavior } from './behavior';

export function init() {
  registerLayout();
  registerBehavior();
  registerEdge();
  registerNode();
}