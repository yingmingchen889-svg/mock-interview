import Link from "next/link";
import {
  Mic,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  BarChart3,
  Zap,
  Shield,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const painPoints = [
  {
    icon: Users,
    title: "缺乏练习",
    desc: "面试机会有限，无法反复练习提升",
  },
  {
    icon: MessageSquare,
    title: "找不到人",
    desc: "身边没有资深面试官帮你模拟面试",
  },
  {
    icon: Target,
    title: "不知问题在哪",
    desc: "面试后不知道哪里答得好、哪里需要改进",
  },
  {
    icon: TrendingUp,
    title: "进步无法量化",
    desc: "无法追踪自己的面试表现变化趋势",
  },
];

const features = [
  {
    icon: Mic,
    title: "AI 语音面试",
    desc: "真实对话体验，支持语音交互",
  },
  {
    icon: BookOpen,
    title: "多岗位覆盖",
    desc: "前端、后端、全栈、算法等 8 大方向",
  },
  {
    icon: BarChart3,
    title: "详细报告",
    desc: "逐题评分、优劣势分析、改进建议",
  },
  {
    icon: Zap,
    title: "智能追问",
    desc: "根据你的回答动态调整后续问题",
  },
  {
    icon: Shield,
    title: "多模型支持",
    desc: "GPT-4o、Claude 等顶级模型可选",
  },
  {
    icon: TrendingUp,
    title: "成长追踪",
    desc: "量化你的面试表现，可视化进步轨迹",
  },
];

const steps = [
  { num: "01", title: "配置面试", desc: "选择岗位、技术栈、难度" },
  { num: "02", title: "AI 面试", desc: "与 AI 面试官进行语音对话" },
  { num: "03", title: "获取报告", desc: "查看详细评分和改进建议" },
];

const plans = [
  {
    name: "免费版",
    price: "0",
    period: "永久免费",
    features: ["每月 5 次面试", "基础面试报告", "GPT-4o Mini 模型"],
    cta: "免费开始",
    popular: false,
  },
  {
    name: "Pro",
    price: "49",
    period: "/月",
    features: [
      "无限次面试",
      "详细面试报告",
      "GPT-4o + Claude 模型",
      "成长追踪",
      "导出 PDF",
    ],
    cta: "升级 Pro",
    popular: true,
  },
  {
    name: "Premium",
    price: "99",
    period: "/月",
    features: [
      "所有 Pro 功能",
      "优先模型访问",
      "自定义面试题库",
      "专属客服",
      "团队管理",
    ],
    cta: "联系我们",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              M
            </div>
            <span className="text-lg font-semibold">MockInterview</span>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              功能
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              定价
            </a>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              登录
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-lg px-2.5 h-7 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              免费开始
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          AI 语音模拟面试平台
        </Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          技术面试不再紧张
          <br />
          <span className="text-blue-600">AI 面试官帮你实战练习</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
          支持前端、后端、全栈等 8 大岗位方向，AI 面试官根据你的回答智能追问，
          面试结束后生成详细报告帮你持续提升
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/login" className="inline-flex items-center justify-center rounded-lg px-3 h-9 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            免费开始
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <a href="#features" className="inline-flex items-center justify-center rounded-lg border px-3 h-9 text-sm font-medium hover:bg-gray-50 transition-colors">
            了解更多
          </a>
        </div>
      </section>

      {/* Pain Points */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold">
            你是否也有这些困扰？
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {painPoints.map((item) => (
              <Card key={item.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                    <item.icon className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold">核心功能</h2>
          <p className="mt-2 text-center text-gray-500">
            全方位模拟面试体验，助你拿到理想 Offer
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <item.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold">使用流程</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-8 hidden h-6 w-6 text-gray-300 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold">选择适合你的计划</h2>
          <p className="mt-2 text-center text-gray-500">
            从免费版开始，随时升级
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.popular
                    ? "border-blue-600 ring-1 ring-blue-600 relative"
                    : ""
                }
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    最受欢迎
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">&yen;{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`inline-flex items-center justify-center rounded-lg px-3 h-9 text-sm font-medium w-full transition-colors ${
                      plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white font-bold text-xs">
                M
              </div>
              <span className="text-sm font-medium">MockInterview</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; 2024 MockInterview. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
