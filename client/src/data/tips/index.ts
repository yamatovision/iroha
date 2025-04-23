import { fortuneTips } from './fortune-tips';
import { elementTips } from './element-tips';
import { compatibilityTips } from './compatibility-tips';
import { teamTips } from './team-tips';
import { membercardTips } from './membercard-tips';
import { generalTips } from './general-tips';

export const tipsByCategory = {
  fortune: fortuneTips,
  elements: elementTips,
  compatibility: compatibilityTips,
  team: teamTips,
  membercard: membercardTips,
  general: generalTips,
};

export type TipCategory = keyof typeof tipsByCategory;