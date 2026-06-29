/* ===== 小组互评系统 - 配置文件 ===== */
/* 部署前请替换以下 Supabase 配置 */

const SUPABASE_URL = 'https://tcrpqyfxuyfvcnqcpbpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcnBxeWZ4dXlmdmNucWNwYnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2OTY5MzAsImV4cCI6MjA5ODI3MjkzMH0._c5tNPcTFWbkkCaSkPHIM581jnFPJT3-L0pK0Mbv4tI';

/* ===== 班级口令（防止外部人员随意提交评分） ===== */
const CLASS_PASSWORDS = {
  class1: '商数一班2024',
  class2: '商数二班2024'
};

/* ===== 班级分组数据 ===== */
const CLASS_DATA = {
  class1: {
    name: '24商数一班',
    groups: [
      { id: 1, name: '第1组', members: ['曹婧', '朱冰燕', '官钰华'] },
      { id: 2, name: '第2组', members: ['杨丽', '陈容', '王宗媛'] },
      { id: 3, name: '第3组', members: ['李成景', '张涵', '李海潮', '缪祥政'] },
      { id: 4, name: '第4组', members: ['李连杰', '陆国荣', '张宇墨', '刘宇'] },
      { id: 5, name: '第5组', members: ['蒋金珏', '陈位笑', '李一禾'] },
      { id: 6, name: '第6组', members: ['杨琼英', '施米娜', '尹文仙', '庞宇宣'] },
      { id: 7, name: '第7组', members: ['董柯妤', '赵紫婷', '袁胜吉', '杨越'] },
      { id: 8, name: '第8组', members: ['何晟莹', '王静', '郑思琪', '李瑞琳'] },
      { id: 9, name: '第9组', members: ['段金美', '吴芩', '杨建佳'] },
      { id: 10, name: '第10组', members: ['荀婷婷', '汪金花', '李德怡', '彭乐婷'] },
      { id: 11, name: '第11组', members: ['代路路', '董安龙', '谢太阳'] },
      { id: 12, name: '第12组', members: ['张发龙', '谭乾鹏', '王厅'] },
      { id: 13, name: '第13组', members: ['岩平', '金跃泽', '罗树荣'] }
    ]
  },
  class2: {
    name: '商数二班',
    groups: [
      { id: 1, name: '第一组', members: ['李炫燃', '褚瑾', '李秋春', '胡蓉'] },
      { id: 2, name: '第二组', members: ['杨梦宇', '蔡玉琪', '牟萱惠', '王艳'] },
      { id: 3, name: '第三组', members: ['杨璐', '訾梦雪', '李红梦', '陆旋'] },
      { id: 4, name: '第四组', members: ['杨茹', '李熙彤', '周海梅', '鄢欣'] },
      { id: 5, name: '第五组', members: ['汪丽', '龚瑞', '杨丽', '普海燕'] },
      { id: 6, name: '第六组', members: ['沙俊茗', '何沛佳', '余丹丹'] },
      { id: 7, name: '第七组', members: ['郑云倩', '二娘', '蔡兴慧', '李芹芝'] },
      { id: 8, name: '第八组', members: ['李瑞', '陈向羊', '饶祥松', '袁心一'] },
      { id: 9, name: '第九组', members: ['杨辉', '朱玺', '陈思杰', '袁盛源'] },
      { id: 10, name: '第十组', members: ['武飞翔', '孔维清', '顾富国', '马昊楠'] },
      { id: 11, name: '第十一组', members: ['余所文', '许浩然', '唐毅', '姚树昌'] }
    ]
  }
};

/* ===== 评分维度 ===== */
const DIMENSIONS = [
  { id: 1, name: '选题', subtitle: '商业价值与逻辑', maxScore: 10 },
  { id: 2, name: '数据', subtitle: '数据规模与质量', maxScore: 15 },
  { id: 3, name: '可视化', subtitle: '有效性与美观度', maxScore: 25 },
  { id: 4, name: '分析', subtitle: '深度与洞察', maxScore: 30 },
  { id: 5, name: '展示', subtitle: '呈现与建议', maxScore: 20 }
];
