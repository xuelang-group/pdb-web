import { registerLayout } from './layout';
import { registerBehavior } from './behavior';
import { registerNode } from './node';
import { registerEdge } from './edge';

export function initG6() {
  registerLayout();
  registerBehavior();
  registerEdge();
  registerNode();
}