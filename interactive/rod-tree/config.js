window.ROD_TREE_CONFIG = {
  imageSrc: "../../assets/rod-tree-scene.jpg",
  publicUrl: "https://nadyarodionova.ru/interactive/rod-tree/",
  telegramUrl: "https://t.me/nadya_rodionova",
  storageKey: "nadya_rod_tree_v1",
  links: {
    mini: "../../workshops/rod-i-sila-roda-mini.html",
    program: "../../workshops/kontakt-s-rodom.html",
    workshops: "../../workshops/index.html",
  },
  categories: {
    roots: {
      id: "roots",
      title: "Корни — история семьи",
      lead:
        "В ваших ответах на первом плане желание узнать свои корни. Первый шаг — вернуть семейную память, заполнить пустые страницы.",
      focus: "родословная и семейная память",
      links: [
        { label: "Мини-мастерская «Род и сила рода»", href: "../../workshops/rod-i-sila-roda-mini.html" },
        { label: "Программа «Контакт с родом»", href: "../../workshops/kontakt-s-rodom.html" },
      ],
    },
    trunk: {
      id: "trunk",
      title: "Ствол — внутренняя опора",
      lead:
        "В ваших ответах на первом плане тема поддержки и собственных решений. Первый шаг — отделить семейные правила и себя: что из них ваше, а что — «так принято».",
      focus: "установки, собственная позиция",
      links: [
        { label: "Мини-мастерская «Род и сила рода»", href: "../../workshops/rod-i-sila-roda-mini.html" },
        { label: "Программа «Контакт с родом»", href: "../../workshops/kontakt-s-rodom.html" },
      ],
    },
    branches: {
      id: "branches",
      title: "Ветви — отношения в семье",
      lead:
        "В ваших ответах на первом плане тема контакта и границ. Первый шаг — понять, чего вы хотите от общения с семьёй.",
      focus: "коммуникация и границы",
      links: [
        { label: "Мини-мастерская «Род и сила рода»", href: "../../workshops/rod-i-sila-roda-mini.html" },
        { label: "Программа «Контакт с родом»", href: "../../workshops/kontakt-s-rodom.html" },
      ],
    },
    crown: {
      id: "crown",
      title: "Крона — дары и ресурсы",
      lead:
        "В ваших ответах на первом плане желание увидеть сильные стороны рода. Первый шаг — опереться на то наследство предков, которое вы ещё не ценили.",
      focus: "ресурсы и сила рода",
      links: [
        { label: "Мини-мастерская «Род и сила рода»", href: "../../workshops/rod-i-sila-roda-mini.html" },
        { label: "Программа «Контакт с родом»", href: "../../workshops/kontakt-s-rodom.html" },
      ],
    },
  },
  questions: [
    {
      id: 1,
      text: "Что вам важнее всего узнать о своём роде?",
      options: [
        { id: "a", label: "Кто были мои предки и что они несли.", category: "roots" },
        { id: "b", label: "Какие установки и правила я унаследовал(а).", category: "trunk" },
        { id: "c", label: "Почему в семье повторяются сложные отношения.", category: "branches" },
        { id: "d", label: "Какие способности и ресурсы передаются мне.", category: "crown" },
      ],
    },
    {
      id: 2,
      text: "Где сейчас больше всего неопределённости?",
      options: [
        { id: "a", label: "В истории семьи — много неизвестных страниц.", category: "roots" },
        {
          id: "b",
          label: "Где трудно понять, где мои желания, а где желания семьи.",
          category: "trunk",
        },
        { id: "c", label: "В общении с родственниками не хватает ясности.", category: "branches" },
        {
          id: "d",
          label: "В том, на какие сильные стороны рода можно опереться.",
          category: "crown",
        },
      ],
    },
    {
      id: 3,
      text: "Какая мысль возникает при слове «род»?",
      options: [
        { id: "a", label: "Хочу знать больше о том, что было до меня.", category: "roots" },
        { id: "b", label: "Хочу больше поддержки и устойчивости.", category: "trunk" },
        { id: "c", label: "Хочу изменить отношения, сохраняя свои границы.", category: "branches" },
        { id: "d", label: "Хочу увидеть не только сложности, но и дары.", category: "crown" },
      ],
    },
    {
      id: 4,
      text: "Что чаще повторяется в семейной истории?",
      options: [
        { id: "a", label: "Молчание и разрывы — недостающие сведения.", category: "roots" },
        {
          id: "b",
          label: "Установки «так принято» или «в нашей семье всегда так».",
          category: "trunk",
        },
        { id: "c", label: "Сложные конфликты и близкие отношения.", category: "branches" },
        {
          id: "d",
          label: "Способности и ресурсы, которые передаются поколениям.",
          category: "crown",
        },
      ],
    },
    {
      id: 5,
      text: "Какой первый шаг кажется вам наиболее важным?",
      options: [
        { id: "a", label: "Собрать семейную родословную.", category: "roots" },
        { id: "b", label: "Разобраться с унаследованными убеждениями.", category: "trunk" },
        { id: "c", label: "Посмотреть на родовую коммуникацию.", category: "branches" },
        { id: "d", label: "Найти и усилить сильные стороны рода.", category: "crown" },
      ],
    },
    {
      id: 6,
      text: "Что вы хотели бы получить от работы с темой рода?",
      options: [
        { id: "a", label: "Ясность основ и связи с историей семьи.", category: "roots" },
        { id: "b", label: "Внутреннюю опору и право жить по-своему.", category: "trunk" },
        { id: "c", label: "Более спокойные и тёплые отношения.", category: "branches" },
        {
          id: "d",
          label: "Возможность принять и развивать ресурсы рода.",
          category: "crown",
        },
      ],
    },
  ],
};
