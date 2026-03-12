const entries = [
  {
    id: "origin",
    year: 2024,
    month: "10月",
    date: "2024.10.17",
    title: "群初立",
    category: "起源",
    people: ["KA21 群友"],
    kicker: "追记",
    summary: "一个普通的日子，KA21 群悄然成立。彼时尚无人知，这会成为一段可被反复翻阅的群史开端。",
    quote: "命运之齿轮已于此刻悄然转动。",
    body: "据《Ka21·群本纪》载：\n一个普通的日子，KA21 群初立。群贤毕至，风起于堂，盛况犹忆。无人知，命运之齿轮已于此刻悄然转动。\n\n这一条像刊物的扉页。它并不热闹，却适合作为整站的开篇，因为所有后来的趣闻、人物与群像，都从这里生根。"
  },
  {
    id: "badge",
    year: 2025,
    month: "2月",
    date: "2025.02.28",
    title: "群徽",
    category: "视觉",
    people: ["群友共创"],
    kicker: "封面线索",
    summary: "群徽投票像一次群体审美公投，最后诞生的不只是一个标志，更像群体的共同旗帜。",
    quote: "其徽纳乾坤于方寸。",
    body: "据《Ka21·群本纪》载：\nKa21 群集贤论群徽，张榜而投，限期三日。初图稿数起，未见归一。及至期满，群心所向已定，群徽降生。\n\n杂志网站如果要有气质，这条几乎注定要成为视觉栏目，因为它天然对应封面、标识与刊头。"
  },
  {
    id: "class",
    year: 2025,
    month: "3月",
    date: "2025.03.04",
    title: "得到授课",
    category: "公共时刻",
    people: ["吴老师", "橘子祭酒"],
    kicker: "外部舞台",
    summary: "群友走上更大的讲台，内部经验开始向外部世界辐射，这类事件很适合作为“出圈”栏目。",
    quote: "科技烈火燎硅原，平权笑抚众生弦。",
    body: "据《Ka21·群本纪》载：\n吴太傅会同橘子祭酒于“得到”云端布道，群友热情以迎。先演飞书多维表格，小白多见玄妙；后诏“牛马库”于天下，众皆叹 KA21 群友之群力。\n\n放在杂志里，这一条像一篇专题报道，因为它兼具知识、人物与观众反应。"
  },
  {
    id: "domain",
    year: 2025,
    month: "4月",
    date: "2025.04.25",
    title: "新域名",
    category: "专题故事",
    people: ["三金cool"],
    kicker: "卷首专题",
    summary: "从旧域到新域，不只是技术迁移，更像群体把一个松散宝库正式迁入新纪元。",
    quote: "数域迁徙，非搬瓦砾，实移山河。",
    body: "据《Ka21·群本纪》载：\n群有佬名“三金cool”，本掌「牛马库」于旧域。前月，效盘庚迁殷之智，欲迁新域以藏万卷。是役也，斩破万险，前日落成，定为“www.ka21ai.cn”。\n\n如果把《群本纪》做成杂志站，这条非常适合当创刊号主打故事。因为它既有建设意味，也有迁徙意味，还有一句极好的刊物式收束：昔见牛马库初立，今观宝库凌云。"
  },
  {
    id: "dongyi",
    year: 2025,
    month: "5月",
    date: "2025.05.24",
    title: "Dongyi 早报",
    category: "群体习惯",
    people: ["Dongyi"],
    kicker: "现象级",
    summary: "每日准时发报，群友统一回同一张表情包，久而久之，日常便有了仪式。",
    quote: "纵使群星皆沉寂，Dongyi 自成赛博钟。",
    body: "群内唯一现象级事件：每日 Dongyi 准时发送 AI 早报，风雨无阻，群友皆以同一“Dongyi 辛苦啦”表情包回之。久之，江湖人遂相传：“纵使群星皆沉寂，Dongyi 自成赛博钟。”\n\n这类条目很适合作为网站里的“群中风物”，因为它不靠大事撑场，靠的是长出来的共同节奏。"
  },
  {
    id: "tour",
    year: 2025,
    month: "5月",
    date: "2025.05.26",
    title: "南巡",
    category: "人物现场",
    people: ["吴老师", "风师", "东深"],
    kicker: "线下流动",
    summary: "一场跨城市会友，把屏幕里的旧语化成了现实中的真缘。",
    quote: "三日三贤三地见，屏间旧语化真缘。",
    body: "据《Ka21·群本纪》载：\n时维五月，吴老师连日出游，旋会诸贤。首会守村人李嘟嘟于京都，相见恨晚；次与东深云台饮霞，把酒言欢；今复与风师金陵会晤，以球会友。\n\n这条适合被排成杂志里的旅行专题，因为它自带空间移动感。"
  },
  {
    id: "future",
    year: 2025,
    month: "6月",
    date: "2025.06.26",
    title: "未来之群",
    category: "群史想象",
    people: ["东深", "风老师"],
    kicker: "群史哲思",
    summary: "一句“若此群多年不散，当如何”，把日常群聊突然提到了时间的高度。",
    quote: "不散人间温情意，屏语如舟载轮回。",
    body: "据《Ka21·群本纪》载：\n是日，东深忽发一问：“若此群多年不散，当如何？”众人初闻皆默，继而畅想。有人言他年群在，人亦在；或戏曰，彼时风老师当号“风爷爷”。\n\n杂志网站很需要这种条目，因为它会让整站不只是趣闻集合，还多了时间感和命运感。"
  },
  {
    id: "karaoke",
    year: 2025,
    month: "6月",
    date: "2025.06.27",
    title: "团建 K 歌",
    category: "群体时刻",
    people: ["小雨霏霏", "东深", "Loki", "离谱", "吴老师", "蜡笔"],
    kicker: "初次团建",
    summary: "第一次群体 K 歌像一个非常好的副刊栏目，既轻松，又能把人气写出来。",
    quote: "一唱惊开屏上夜，余音绕梁不肯归。",
    body: "据《Ka21·群本纪》载：\n是夜，群友初启团建，设歌房而会，群史所未有也。虽为“预热”，然气氛盎然，曲者纵情，听者忘倦。\n\n这条在页面里适合配大图和短评，做成翻页感很强的活动页。"
  },
  {
    id: "logo",
    year: 2025,
    month: "8月",
    date: "2025.08.29",
    title: "群 Logo",
    category: "视觉",
    people: ["大摩托车佬"],
    kicker: "刊头支撑",
    summary: "当群有了徽，又有了更明确的 Logo，整个杂志网站的视觉系统就更有根基。",
    quote: "群有新标，众行不惑。",
    body: "据《Ka21·群本纪》载：\n群有大摩托车佬，绘构群徽。骨曰“KA21”，神曰“AI”；一笔成人，虚实相依。\n\n这一条和“群徽”可以合编成视觉特辑，形成网站自己的刊头故事。"
  },
  {
    id: "anniversary",
    year: 2025,
    month: "10月",
    date: "2025.10.17",
    title: "一周年",
    category: "年度节点",
    people: ["KA21 群友"],
    kicker: "周年纪念",
    summary: "一周年天然适合做成年刊封面，也可以作为未来每年一期的总目录入口。",
    quote: "风雅共聚，以续来日千秋之缘。",
    body: "据《Ka21·群本纪》载：\nKa21 群自甲辰十月初建，至今已一载，贤士济济，论道纷纶。今逢开元之际，风雅共聚，诸僚同庆。\n\n这条最像实体刊物里的周年卷首。网站做起来后，它也适合承担“年度回顾”的入口。"
  },
  {
    id: "agi-bar",
    year: 2025,
    month: "11月",
    date: "2025.11.25",
    title: "驻 AGI Bar",
    category: "外部坐标",
    people: ["牛马库", "卡兹克护肝片"],
    kicker: "历史伏笔",
    summary: "有些事情发生时并不轰烈，但多年后回望，会显得格外重要。",
    quote: "那天稀疏平常，却从此被悄然安放在群史的一角。",
    body: "据《Ka21·群本纪》载：\n是日，“牛马库”与“卡兹克护肝片”入驻 AGI Bar。多年后，当其被大众所熟知，群友仍会回想起它们最初出现的那个遥远日子。\n\n这种条目很适合网站里的“伏笔档案”栏目。"
  },
  {
    id: "education",
    year: 2026,
    month: "1月",
    date: "2026.01.05",
    title: "AI 教育",
    category: "观点交锋",
    people: ["Loki", "风老师"],
    kicker: "讨论场",
    summary: "当观点冲突足够锋利，群史就不止是事件录，也会成为思想录。",
    quote: "十年寒窗筛凡骨，怎敌日日换星河。",
    body: "据《Ka21·群本纪》载：\n是日，Loki 写文谈教育怪象：AI 之能，七月一翻；而稚子学堂，仍诵九九乘法。群贤哗然，辩“教”与“育”殊途。\n\n杂志网站可以专门辟一块讨论栏目，让这一类内容不被趣闻淹没。"
  },
  {
    id: "podcast",
    year: 2026,
    month: "3月",
    date: "2026.03.03",
    title: "灯下白",
    category: "新栏目",
    people: ["边牧", "吴老师", "倒放"],
    kicker: "播客上线",
    summary: "共创播客的出现，说明群体已经不只是聊天，而是在发育新的媒介形态。",
    quote: "一灯初举处，万户遂通明。",
    body: "据《Ka21·群本纪》载：\n是岁，群友共创播客，名曰《灯下白》。首期边牧与吴老师对谈，聊 AI 维权，论数据分析，述方法之道。\n\n这条非常适合作为网站上的“新栏目上线”横幅，因为它天然对应新的内容载体。"
  },
  {
    id: "claw",
    year: 2026,
    month: "3月",
    date: "2026.03.07",
    title: "龙虾大户",
    category: "人物趣闻",
    people: ["烫水", "小金鱼"],
    kicker: "社区侧记",
    summary: "这类轻巧的人物趣闻最适合做成杂志里的边栏，让整站有呼吸感。",
    quote: "先看烫水。",
    body: "据《Ka21·群本纪》载：\n群有佬名烫水，好养龙虾。近日连作三文，皆论养虾之法，群友小金鱼见之遂言：“烫水已成社区龙虾领航员。”\n\n网站若想耐看，不能全是大事，也需要这样轻盈的一页。"
  }
];

const people = [
  {
    name: "吴老师",
    role: ["讲席中枢", "线下组织者"],
    note: "在授课、表情包、线下会友等条目中反复出现，像杂志里贯穿多期的核心人物。"
  },
  {
    name: "风老师",
    role: ["资源派", "群史坐标"],
    note: "常以分享资源与关键发言出现，气质稳，适合作为网站上的长线人物索引。"
  },
  {
    name: "卡总",
    role: ["组织推动", "结构型人物"],
    note: "从首转到移山计划，更多承担一种搭台与定调的力量。"
  },
  {
    name: "东深",
    role: ["提问者", "时间感制造者"],
    note: "一句“未来之群”，就把日常群聊拉到了更长的时间维度。"
  },
  {
    name: "Dongyi",
    role: ["日常仪式", "群中赛博钟"],
    note: "现象级条目说明，有些人物的意义不在高光，而在长时间稳定出现。"
  },
  {
    name: "三金cool",
    role: ["建设者", "迁站主角"],
    note: "新域名这一条非常适合做专题封面，也让人物与项目绑定得更紧。"
  },
  {
    name: "倒放",
    role: ["创作者", "新媒介入口"],
    note: "从播客命名到 AI 创作，适合作为新栏目和新媒介方向的人物入口。"
  },
  {
    name: "烫水",
    role: ["社区趣闻", "边栏人物"],
    note: "人物页不能只收关键人物，边栏人物的存在会让整站更有温度。"
  }
];

let activeYear = "全部";
let activeEntryId = "domain";

const statsEl = document.getElementById("stats");
const leadStoryEl = document.getElementById("leadStory");
const featureListEl = document.getElementById("featureList");
const yearFiltersEl = document.getElementById("yearFilters");
const timelineGridEl = document.getElementById("timelineGrid");
const detailCardEl = document.getElementById("detailCard");
const peopleGridEl = document.getElementById("peopleGrid");

function renderStats() {
  const years = new Set(entries.map((entry) => entry.year));
  const categories = new Set(entries.map((entry) => entry.category));
  const cards = [
    { value: entries.length, label: "已选样章条目" },
    { value: years.size, label: "覆盖年份" },
    { value: categories.size, label: "可展开栏目" }
  ];

  statsEl.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <strong>${card.value}</strong>
          <span>${card.label}</span>
        </article>
      `
    )
    .join("");
}

function renderLeadStory() {
  const story = entries.find((entry) => entry.id === "domain");
  leadStoryEl.innerHTML = `
    <p class="section-kicker">${story.kicker}</p>
    <h3>${story.title}</h3>
    <div class="story-meta">
      <span>${story.date}</span>
      <span>${story.category}</span>
      <span>${story.people.join(" / ")}</span>
    </div>
    <p>${story.summary}</p>
    <p>${story.body.split("\n\n")[0]}</p>
    <div class="tag-row">
      <span>适合做封面故事</span>
      <span>可配迁站时间线</span>
      <span>可加外链与旁注</span>
    </div>
  `;
}

function renderFeatureList() {
  const featuredIds = ["dongyi", "future", "anniversary", "podcast"];
  featureListEl.innerHTML = featuredIds
    .map((id) => entries.find((entry) => entry.id === id))
    .map(
      (entry) => `
        <article class="feature-item" data-entry-id="${entry.id}">
          <div class="meta">
            <span>${entry.month}</span>
            <span>${entry.category}</span>
          </div>
          <h3>${entry.title}</h3>
          <p>${entry.summary}</p>
        </article>
      `
    )
    .join("");
}

function renderYearFilters() {
  const years = ["全部", ...new Set(entries.map((entry) => entry.year.toString()))];
  yearFiltersEl.innerHTML = years
    .map(
      (year) => `<button type="button" class="${year === activeYear ? "active" : ""}" data-year="${year}">${year}</button>`
    )
    .join("");
}

function renderTimeline() {
  const filteredEntries =
    activeYear === "全部"
      ? entries
      : entries.filter((entry) => entry.year.toString() === activeYear);

  timelineGridEl.innerHTML = filteredEntries
    .map(
      (entry) => `
        <article class="timeline-card" data-entry-id="${entry.id}">
          <div class="inner">
            <div class="meta">
              <span>${entry.date}</span>
              <span>${entry.kicker}</span>
            </div>
            <h3>${entry.title}</h3>
            <p>${entry.summary}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderDetail() {
  const entry = entries.find((item) => item.id === activeEntryId) || entries[0];
  detailCardEl.innerHTML = `
    <span class="detail-kicker">${entry.category}</span>
    <h3>${entry.title}</h3>
    <div class="story-meta">
      <span>${entry.date}</span>
      <span>${entry.month}</span>
      <span>${entry.people.join(" / ")}</span>
    </div>
    <blockquote>${entry.quote}</blockquote>
    <div class="detail-body">${entry.body}</div>
    <div class="tag-row">
      <span>保留原作语气</span>
      <span>可补图片与原链接</span>
      <span>可继续扩成完整内页</span>
    </div>
  `;
}

function renderPeople() {
  peopleGridEl.innerHTML = people
    .map((person) => {
      const initial = person.name.slice(0, 1);
      return `
        <article class="person-card">
          <div class="initial">${initial}</div>
          <h3>${person.name}</h3>
          <div class="person-role">${person.role.map((item) => `<span>${item}</span>`).join("")}</div>
          <p>${person.note}</p>
        </article>
      `;
    })
    .join("");
}

function bindEvents() {
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scroll);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  yearFiltersEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-year]");
    if (!button) {
      return;
    }
    activeYear = button.dataset.year;
    renderYearFilters();
    renderTimeline();
  });

  document.addEventListener("click", (event) => {
    const card = event.target.closest("[data-entry-id]");
    if (!card) {
      return;
    }
    activeEntryId = card.dataset.entryId;
    renderDetail();
    document.getElementById("detail").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

renderStats();
renderLeadStory();
renderFeatureList();
renderYearFilters();
renderTimeline();
renderDetail();
renderPeople();
bindEvents();
