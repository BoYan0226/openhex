import { useTranslations } from 'next-intl';
import {
  Users,
  IdCard,
  Sparkles,
  MessagesSquare,
  Contact,
  Brain,
  Boxes,
  BookOpen,
  AppWindow,
  BarChart3,
  Check,
} from 'lucide-react';

/**
 * AssetSection — "把你的判断力，封装成一个 持续生钱的资产".
 *
 * LEFT: eyebrow pill, 2-line title (highlight in honey), body, 3 icon
 * bullets, a note line, and tag chips.
 * RIGHT: a faithful reconstruction of the product — a desktop creator
 * console (sidebar + onboarding chat) with the consumer phone (contact
 * list) overlapping its bottom-right, plus two captions. Mockup chrome
 * text mirrors the design source.
 */

const NAV_TOP = [
  { icon: IdCard, label: '名片' },
  { icon: Sparkles, label: '创造', active: true },
  { icon: MessagesSquare, label: '会话管理' },
  { icon: Contact, label: '联系人' },
  { icon: Brain, label: 'Agent大脑' },
];
const NAV_BOTTOM = [
  { icon: Boxes, label: '技能' },
  { icon: BookOpen, label: '知识' },
  { icon: AppWindow, label: '应用' },
  { icon: BarChart3, label: '数据管理' },
];

const CONTACTS = [
  {
    ini: '顺',
    bg: 'bg-honey text-ink',
    name: '大顺',
    msg: '来啦您！俺是大顺，OpenHex 的管家～',
    t: '06/07',
  },
  {
    ini: '高考',
    bg: 'bg-[#cfe8d8] text-[#2e7d52]',
    name: '高考志愿·小林',
    msg: '“计算机要死了”这个说法每隔几年…',
    t: '06/07',
  },
  {
    ini: '芒格',
    bg: 'bg-[#e7d6b8] text-[#8a6a2f]',
    name: '芒格答疑',
    msg: '价值投资就是用四毛钱买值一块钱…',
    t: '06/07',
  },
  {
    ini: '✦',
    bg: 'bg-[#e3dbff] text-[#6b4dff]',
    name: 'Sparky',
    msg: "Hey hey! What's on your mind today?",
    t: '06/06',
  },
  {
    ini: 'Hex',
    bg: 'bg-[#1f1a12] text-honey',
    name: 'Hex Scribe',
    msg: '我是 Hex Scribe，平台的文案专家～',
    t: '06/06',
  },
  {
    ini: '果',
    bg: 'bg-[#d6ead0] text-[#4d8f3f]',
    name: '果果',
    msg: '哈哈，太开心啦！扑棱扑棱～',
    t: '06/06',
  },
];

export function AssetSection() {
  const t = useTranslations('landing.asset');
  const bullets = t.raw('bullets') as Array<{ title: string; desc: string }>;
  const tags = t.raw('tags') as string[];

  return (
    <section
      data-stack-motion
      data-short-screen-fit
      data-motion-style="split"
      className="relative flex min-h-screen snap-start flex-col justify-center overflow-hidden bg-[#fbf7ee] py-20 md:py-24"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] px-6 2xl:max-w-[1560px]">
        <div
          className="grid items-center gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] 2xl:gap-20"
          data-motion="split"
        >
          {/* LEFT — copy */}
          <div>
            <span className="section-kicker">
              <span className="section-kicker-dot" />
              {t('eyebrow')}
            </span>

            <h2 className="mt-5 text-[26px] font-semibold leading-[1.18] text-ink sm:text-[40px] sm:leading-[1.14] md:text-[50px] 2xl:text-[58px]">
              <span className="whitespace-nowrap">{t('titleLine1')}</span>
              <br />
              <span className="title-honey-shadow text-honey">{t('titleHighlight')}</span>
            </h2>

            <p className="mt-4 text-[15px] leading-relaxed text-ink/65 2xl:mt-5 2xl:text-[17px]">
              {t('body')}
            </p>

            <ul className="mt-6 space-y-4 2xl:mt-8 2xl:space-y-5">
              {bullets.map((bullet, i) => {
                const badge = ['客', '队', '资'][i] ?? '';
                return (
                  <li key={bullet.title} className="flex items-start gap-3">
                    <span className="hex-clip mt-0.5 flex size-9 shrink-0 items-center justify-center bg-honey text-[14px] font-bold text-ink">
                      {badge}
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold text-ink">
                        {bullet.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-ink/55">
                        {bullet.desc}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 border-l-2 border-honey/60 pl-3 text-[13px] leading-relaxed text-ink/50">
              {t('note')}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="glass-surface-soft rounded-full border border-line bg-white px-3 py-1 text-[12px] text-ink/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — desktop console + phone mockup */}
          <div>
            <div className="relative pb-8 pr-2 md:pr-12 2xl:pb-12">
              {/* Desktop creator console */}
              <div className="glass-surface overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_24px_60px_rgba(34,28,19,.14)]">
                {/* Titlebar */}
                <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 rounded-full bg-[#28c840]" />
                </div>

                <div className="flex">
                  {/* Sidebar */}
                  <div className="hidden w-[124px] shrink-0 flex-col border-r border-line p-2.5 text-[11px] sm:flex 2xl:w-[150px] 2xl:text-[12px]">
                    <div className="mb-2 flex items-center gap-1.5 rounded-md px-1.5 py-1">
                      <span className="flex size-5 items-center justify-center rounded bg-honey text-[10px] font-bold text-ink">
                        顺
                      </span>
                      <span className="font-semibold text-ink">大顺</span>
                      <span className="ml-auto text-ink/30">⌄</span>
                    </div>
                    {NAV_TOP.map(n => (
                      <div
                        key={n.label}
                        className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 ${
                          n.active ? 'bg-honey/15 font-medium text-ink' : 'text-ink/55'
                        }`}
                      >
                        <n.icon className="size-3.5" strokeWidth={1.8} />
                        {n.label}
                      </div>
                    ))}
                    <div className="my-1.5 h-px bg-line" />
                    {NAV_BOTTOM.map(n => (
                      <div
                        key={n.label}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-ink/45"
                      >
                        <n.icon className="size-3.5" strokeWidth={1.8} />
                        {n.label}
                      </div>
                    ))}
                  </div>

                  {/* Chat area */}
                  <div className="flex min-h-[260px] flex-1 flex-col p-3.5 2xl:min-h-[300px] 2xl:p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded bg-honey text-[10px] font-bold text-ink">
                        顺
                      </span>
                      <span className="text-[12px] font-semibold text-ink">大顺</span>
                      <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[9px] text-ink/50">
                        OpenHex 产品助理
                      </span>
                    </div>
                    <div className="space-y-1.5 text-[11px] leading-[1.6] text-ink/75">
                      <p className="rounded-lg bg-paper px-2.5 py-2">
                        嗨～我是 OpenHex 产品助理 👋
                        我刚上线，还是一张白纸。正式开始前，先来认识一下吧～
                      </p>
                      <p className="text-ink/60">
                        我的性格？{' '}
                        <span className="text-ink/40">正式严谨 / 温暖亲切 / 冷静犀利？</span>
                      </p>
                      <p className="text-ink/60">
                        我擅长什么？{' '}
                        <span className="text-ink/40">编程 / 写作 / 分析 / 全能选手？</span>
                      </p>
                      <p className="text-ink/60">
                        用什么语言交流？{' '}
                        <span className="text-ink/40">中文 / 英文 / 中英混着来？</span>
                      </p>
                      <p className="ml-auto w-fit rounded-lg bg-honey/20 px-2.5 py-2 text-ink">
                        请把你的名字和自我认同改成 “Hex 小管家”
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <Check className="size-3" /> 已读取 /agent/IDENTITY.md
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-emerald-600">
                        <Check className="size-3" /> 已编辑 /agent/IDENTITY.md
                      </p>
                    </div>
                    <div className="glass-surface-soft mt-auto rounded-lg border border-line px-2.5 py-2 text-[10px] text-ink/35">
                      描述你想创建的 Agent，并提出技能要求～
                    </div>
                  </div>
                </div>
              </div>

              {/* Consumer phone overlapping bottom-right */}
              <div className="phone-solid absolute -bottom-4 right-0 w-[208px] overflow-hidden rounded-[26px] border-[6px] bg-[#fffdf7] 2xl:w-[240px]">
                {/* Status bar */}
                <div className="flex items-center justify-between px-3 py-1 text-[9px] font-medium text-ink/60">
                  <span>9:29</span>
                  <span>5G ▮▮▮ 59</span>
                </div>
                {/* Header */}
                <div className="flex items-center justify-between bg-[#fff4bd] px-3 py-2">
                  <span className="font-display text-[12px] font-semibold text-ink">◆ OpenHex</span>
                  <span className="text-ink/40">···</span>
                </div>
                {/* Contacts */}
                <div className="divide-y divide-line bg-[#fffdf7]">
                  {CONTACTS.map(c => (
                    <div key={c.name} className="flex items-center gap-2 px-2.5 py-2">
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${c.bg}`}
                      >
                        {c.ini}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-1">
                          <span className="truncate text-[11px] font-semibold text-ink">
                            {c.name}
                          </span>
                          <span className="shrink-0 text-[9px] text-ink/35">{c.t}</span>
                        </span>
                        <span className="block truncate text-[10px] text-ink/45">{c.msg}</span>
                      </span>
                    </div>
                  ))}
                </div>
                {/* Tab bar */}
                <div className="flex items-center justify-around border-t border-line py-1.5 text-[9px]">
                  <span className="flex flex-col items-center gap-0.5 text-honey-deep">
                    <MessagesSquare className="size-3.5" /> 对话
                  </span>
                  <span className="flex flex-col items-center gap-0.5 text-ink/40">
                    <Contact className="size-3.5" /> 联系人
                  </span>
                  <span className="flex flex-col items-center gap-0.5 text-ink/40">
                    <Users className="size-3.5" /> 我的
                  </span>
                </div>
              </div>
            </div>

            {/* Captions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-8">
              <span className="flex items-center gap-2 text-[12px] text-ink/55">
                <span className="hex-clip flex size-5 shrink-0 items-center justify-center bg-honey text-[10px] font-bold text-ink">
                  1
                </span>
                {t('captionDesktop')}
              </span>
              <span className="flex items-center gap-2 text-[12px] text-ink/55">
                <span className="hex-clip flex size-5 shrink-0 items-center justify-center bg-honey text-[10px] font-bold text-ink">
                  2
                </span>
                {t('captionPhone')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
