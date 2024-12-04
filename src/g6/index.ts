import { registerLayout } from './layout';
import { registerNode } from './node';
import { registerEdge } from './edge';
import { registerBehavior } from './behavior';

export function initG6() {
  registerLayout();
  registerBehavior();
  registerEdge();
  registerNode();
}