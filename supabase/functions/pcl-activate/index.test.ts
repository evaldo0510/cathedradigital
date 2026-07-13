// E2 — pcl-activate (Sprint 1.14)
import { registerTransitionTests } from '../tests/_pcl_transition_factory.ts';
import { spec } from './index.ts';
registerTransitionTests({ spec, currentState: 'approved' });
