import { Note } from './types';

export const mockNotes: Note[] = [
  {
    id: '1',
    title: '夏日摄影构思',
    content: '考虑在黄金时间使用胶片相机捕捉光影。尝试冷色调与温暖肤色的对比。拍摄地点：城市老街区，带有复古气息的咖啡馆外廊。',
    category: '灵感',
    date: '2023年8月15日',
    tags: ['摄影', '光影']
  },
  {
    id: '2',
    title: '本周项目里程碑',
    content: '1. 完成UI原型设计迭代\n2. 准备周三的技术方案评审\n3. 联系供应商确认首批物料\n4. 整理季度报告初稿',
    category: '待办',
    date: '2023年8月14日',
    tags: ['工作', '规划']
  },
  {
    id: '3',
    title: '极简主义生活感悟',
    content: '拥有的东西越多，被占据的心力就越多。尝试通过整理物理空间来整理内心。最近读到的那句“少即是多”真的很有共鸣，在这个信息爆炸的时代，专注变得格外奢侈。',
    category: '随笔',
    date: '2023年8月12日',
    tags: ['生活', '极简']
  },
  {
    id: '4',
    title: '桌面布置灵感',
    content: '参考了北欧极简主义，重点在于天然木材与白色的融合。',
    category: '灵感',
    date: '2023年8月10日',
    tags: ['家居', '设计'],
    imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: '5',
    title: '微交互逻辑研究',
    content: '关于移动端触感反馈的 12 种不同实现方式，以及如何在不同系统 API 之间保持一致性的探讨。',
    category: '堆栈',
    date: '2023年10月20日',
    tags: ['交互设计', '研究'],
    isStack: true,
    childCount: 12
  },
  {
    id: '6',
    title: '去中心化社交的可能性',
    content: '协议层与应用层的彻底解耦\n数据主权的回归与分发逻辑\n经济激励模型的重新设计',
    category: '堆栈',
    date: '2023年10月22日',
    tags: ['深度思考', 'Web3'],
    isStack: true,
    childCount: 48
  }
];
